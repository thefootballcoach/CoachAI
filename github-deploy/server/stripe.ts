import { Express, Request, Response } from "express";
import Stripe from "stripe";
import { storage } from "./storage";

// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn("STRIPE_SECRET_KEY is not set. Stripe payment functionality will not work.");
}

const stripe = stripeSecretKey 
  ? new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" })
  : null;

export function setupStripeRoutes(app: Express) {
  if (!stripe) {
    // Mock implementations if Stripe is not configured
    app.post("/api/create-payment-intent", (req, res) => {
      res.status(500).json({ message: "Stripe is not configured. Please set STRIPE_SECRET_KEY." });
    });
    
    app.post("/api/get-or-create-subscription", (req, res) => {
      res.status(500).json({ message: "Stripe is not configured. Please set STRIPE_SECRET_KEY." });
    });
    
    return;
  }
  
  // Create a payment intent for one-time purchases
  app.post("/api/create-payment-intent", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { amount, plan } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }
      
      // Create a PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount), // amount in cents
        currency: "usd",
        metadata: {
          userId: req.user!.id.toString(),
          plan: plan || "starter"
        }
      });
      
      // Record the payment attempt
      await storage.createPayment({
        userId: req.user!.id,
        amount,
        currency: "usd",
        status: "pending",
        paymentType: "one-time",
        stripePaymentId: paymentIntent.id,
        stripeSessionId: null
      });
      
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Create or retrieve a subscription
  app.post("/api/get-or-create-subscription", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const user = req.user!;
    const { plan } = req.body;
    
    // If user already has a subscription
    if (user.stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        
        res.json({
          subscriptionId: subscription.id,
          clientSecret: subscription.latest_invoice?.payment_intent?.client_secret
        });
        
        return;
      } catch (error) {
        // If subscription retrieval fails, continue to create a new one
        console.error("Error retrieving subscription, creating new one:", error);
      }
    }
    
    // Default price ID based on plan (these would be configured in your Stripe dashboard)
    let priceId = process.env.STRIPE_PRICE_ID_PROFESSIONAL;
    
    if (plan === "starter") {
      priceId = process.env.STRIPE_PRICE_ID_STARTER;
    } else if (plan === "team") {
      priceId = process.env.STRIPE_PRICE_ID_TEAM;
    }
    
    if (!priceId) {
      return res.status(400).json({ message: "Invalid plan or missing price configuration" });
    }
    
    try {
      // Create or get customer
      let customerId = user.stripeCustomerId;
      
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name || user.username,
          metadata: {
            userId: user.id.toString()
          }
        });
        
        customerId = customer.id;
        await storage.updateStripeCustomerId(user.id, customerId);
      }
      
      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId: user.id.toString(),
          plan: plan || "professional"
        }
      });
      
      // Update user with subscription info
      await storage.updateUser(user.id, {
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        subscriptionTier: plan || "professional"
      });
      
      // Record the payment attempt
      await storage.createPayment({
        userId: user.id,
        amount: subscription.items.data[0].price.unit_amount || 0,
        currency: "usd",
        status: "pending",
        paymentType: "subscription",
        stripePaymentId: subscription.latest_invoice?.payment_intent?.id || null,
        stripeSessionId: null
      });
      
      res.json({
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice?.payment_intent?.client_secret
      });
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Webhook handler for Stripe events
  app.post("/api/stripe-webhook", async (req, res) => {
    const signature = req.headers["stripe-signature"];
    
    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(400).json({ message: "Missing signature or webhook secret" });
    }
    
    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      
      switch (event.type) {
        case "payment_intent.succeeded":
          await handlePaymentSuccess(event.data.object);
          break;
          
        case "payment_intent.payment_failed":
          await handlePaymentFailure(event.data.object);
          break;
          
        case "invoice.payment_succeeded":
          await handleInvoiceSuccess(event.data.object);
          break;
          
        case "invoice.payment_failed":
          await handleInvoiceFailure(event.data.object);
          break;
          
        case "customer.subscription.updated":
          await handleSubscriptionUpdate(event.data.object);
          break;
          
        case "customer.subscription.deleted":
          await handleSubscriptionCancellation(event.data.object);
          break;
      }
      
      res.json({ received: true });
    } catch (error: any) {
      console.error("Webhook error:", error);
      res.status(400).json({ message: `Webhook Error: ${error.message}` });
    }
  });
}

// Webhook handlers
async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const userId = parseInt(paymentIntent.metadata?.userId || "0");
  
  if (!userId) return;
  
  // Update payment status
  const payments = await storage.getPaymentsByUserId(userId);
  const payment = payments.find(p => p.stripePaymentId === paymentIntent.id);
  
  if (payment) {
    await storage.updateUser(userId, {
      subscriptionTier: paymentIntent.metadata?.plan || "starter"
    });
  }
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  const userId = parseInt(paymentIntent.metadata?.userId || "0");
  
  if (!userId) return;
  
  // Update payment status
  const payments = await storage.getPaymentsByUserId(userId);
  const payment = payments.find(p => p.stripePaymentId === paymentIntent.id);
  
  if (payment) {
    // Handle failed payment
  }
}

async function handleInvoiceSuccess(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;
  
  // Handle both string and object forms of subscription property
  const subscriptionId = typeof invoice.subscription === 'string' 
    ? invoice.subscription 
    : invoice.subscription.id;
  
  if (!subscriptionId) return;
  
  try {
    // Query all users from the database
    const queryResult = await (storage as any).db
      .select()
      .from((storage as any).schema.users)
      .where((storage as any).schema.eq((storage as any).schema.users.stripeSubscriptionId, subscriptionId));
    
    const user = queryResult[0];
    
    if (user) {
      await storage.updateUser(user.id, {
        subscriptionStatus: "active"
      });
    }
  } catch (error) {
    console.error("Error handling invoice success:", error);
  }
}

async function handleInvoiceFailure(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;
  
  // Handle both string and object forms of subscription property
  const subscriptionId = typeof invoice.subscription === 'string' 
    ? invoice.subscription 
    : invoice.subscription.id;
  
  if (!subscriptionId) return;
  
  try {
    // Query all users from the database
    const queryResult = await (storage as any).db
      .select()
      .from((storage as any).schema.users)
      .where((storage as any).schema.eq((storage as any).schema.users.stripeSubscriptionId, subscriptionId));
    
    const user = queryResult[0];
    
    if (user) {
      await storage.updateUser(user.id, {
        subscriptionStatus: "past_due"
      });
    }
  } catch (error) {
    console.error("Error handling invoice failure:", error);
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  try {
    // Query from database
    const queryResult = await (storage as any).db
      .select()
      .from((storage as any).schema.users)
      .where((storage as any).schema.eq((storage as any).schema.users.stripeSubscriptionId, subscription.id));
    
    const user = queryResult[0];
    
    if (user) {
      await storage.updateUser(user.id, {
        subscriptionStatus: subscription.status
      });
    }
  } catch (error) {
    console.error("Error handling subscription update:", error);
  }
}

async function handleSubscriptionCancellation(subscription: Stripe.Subscription) {
  try {
    // Query from database
    const queryResult = await (storage as any).db
      .select()
      .from((storage as any).schema.users)
      .where((storage as any).schema.eq((storage as any).schema.users.stripeSubscriptionId, subscription.id));
    
    const user = queryResult[0];
    
    if (user) {
      await storage.updateUser(user.id, {
        subscriptionStatus: "canceled",
        stripeSubscriptionId: null
      });
    }
  } catch (error) {
    console.error("Error handling subscription cancellation:", error);
  }
}
