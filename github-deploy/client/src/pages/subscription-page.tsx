import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useStripe, Elements, PaymentElement, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CreditCard, ShieldCheck, CheckCircle } from "lucide-react";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const SubscribeForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsProcessing(false);
    } else {
      toast({
        title: "Subscription Successful",
        description: "You are now subscribed to the Professional plan!",
      });
      
      // The customer will be redirected to return_url
      // No need to navigate or reset state here
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <div className="bg-muted p-4 rounded-lg">
        <div className="flex items-start">
          <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5 mr-2" />
          <div>
            <h4 className="font-medium">Secure Subscription</h4>
            <p className="text-sm text-muted-foreground">
              Your payment information is encrypted and secure. You can cancel your subscription at any time.
            </p>
          </div>
        </div>
      </div>
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing} 
        className="w-full"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Subscribe Now ($79.00/month)
          </>
        )}
      </Button>
    </form>
  );
};

export default function SubscriptionPage() {
  const [clientSecret, setClientSecret] = useState("");
  const [, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Create Subscription as soon as the page loads
    apiRequest("POST", "/api/get-or-create-subscription", { 
      plan: "professional"
    })
      .then((res) => res.json())
      .then((data) => {
        setClientSecret(data.clientSecret);
      })
      .catch((error) => {
        toast({
          title: "Error",
          description: "Failed to initialize subscription. Please try again.",
          variant: "destructive",
        });
        console.error("Error creating subscription:", error);
      });
  }, [toast]);

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/pricing')}
            className="mr-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Pricing
          </Button>
          <h1 className="text-2xl font-bold">Subscribe to Professional Plan</h1>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="grid gap-6 md:grid-cols-5">
            <div className="md:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Details</CardTitle>
                  <CardDescription>
                    Start your Professional plan subscription
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {clientSecret ? (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <SubscribeForm />
                    </Elements>
                  ) : (
                    <div className="flex items-center justify-center h-48">
                      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Professional Plan</CardTitle>
                  <CardDescription>
                    Monthly subscription
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between font-medium">
                      <span>Professional Plan</span>
                      <span>$79.00/month</span>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="font-medium">What's included:</h4>
                      <ul className="space-y-1">
                        <li className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-secondary mt-0.5 mr-2" />
                          <span className="text-sm">15 sessions per month</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-secondary mt-0.5 mr-2" />
                          <span className="text-sm">Advanced feedback reports</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-secondary mt-0.5 mr-2" />
                          <span className="text-sm">90-day session storage</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-secondary mt-0.5 mr-2" />
                          <span className="text-sm">Progress tracking dashboard</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-secondary mt-0.5 mr-2" />
                          <span className="text-sm">Priority email & chat support</span>
                        </li>
                      </ul>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>$79.00/month</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="text-xs text-muted-foreground">
                  <p>
                    You can cancel your subscription at any time from your account dashboard.
                  </p>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
