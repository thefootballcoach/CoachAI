import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PricingSection() {
  const [billingInterval, setBillingInterval] = useState<"monthly" | "annually">("monthly");

  const plans = [
    {
      name: "Individual Coach",
      id: "individual",
      description: "Perfect for individual coaches developing their skills with AI.",
      price: billingInterval === "monthly" ? "£50" : "£500",
      savings: billingInterval === "annually" ? "Save £100" : null,
      features: [
        "Unlimited AI session analyses",
        "7 comprehensive feedback categories",
        "Neural language & communication scoring",
        "Interpersonal skills analysis",
        "90-day session storage",
        "Coach diary access",
        "Progress tracking dashboard",
        "Research library access",
        "Email support"
      ],
      limitations: [
        "Team collaboration features",
        "Multi-coach analytics"
      ],
      button: "Start Free Trial"
    },
    {
      name: "Elite User",
      id: "elite-user",
      description: "Advanced AI coaching intelligence for elite performance.",
      price: billingInterval === "monthly" ? "£100" : "£1,000",
      savings: billingInterval === "annually" ? "Save £200" : null,
      popular: true,
      features: [
        "Unlimited AI session analyses",
        "Complete 7-category assessment framework",
        "Advanced neuroscience research insights",
        "Interpersonal skills deep analysis",
        "1-year session storage",
        "Advanced analytics dashboard",
        "Coach development tracking",
        "Research library access",
        "Priority support",
        "Video analysis capabilities",
        "Custom coaching insights"
      ],
      button: "Start Free Trial"
    },
    {
      name: "Club Package",
      id: "club",
      description: "Complete AI coaching solution for football clubs and academies.",
      price: billingInterval === "monthly" ? "From £417" : "From £5,000",
      savings: billingInterval === "annually" ? "Best Value" : null,
      features: [
        "Unlimited AI session analyses",
        "Unlimited coaching staff members",
        "Complete neural analytics suite",
        "Team performance insights",
        "Unlimited session storage",
        "Multi-coach comparison analytics",
        "Custom research integration",
        "Dedicated AI coaching consultant",
        "White-label options",
        "API access for integrations",
        "Custom training programs",
        "On-site support available"
      ],
      button: "Contact Sales"
    }
  ];

  return (
    <section id="pricing" className="py-20 bg-neutral-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto">Choose the plan that works best for your coaching needs.</p>
          <div className="flex justify-center mt-8">
            <Tabs
              value={billingInterval}
              onValueChange={(value) => setBillingInterval(value as "monthly" | "annually")}
              className="inline-flex p-1 rounded-md bg-neutral-200"
            >
              <TabsList className="bg-transparent">
                <TabsTrigger
                  value="monthly"
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    billingInterval === "monthly" ? "bg-white shadow" : ""
                  }`}
                >
                  Monthly
                </TabsTrigger>
                <TabsTrigger
                  value="annually"
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    billingInterval === "annually" ? "bg-white shadow" : ""
                  }`}
                >
                  Annual (Save 20%)
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition duration-300 ${
                plan.popular ? "border-2 border-primary shadow-lg transform md:scale-105 z-10" : ""
              }`}
            >
              {plan.popular && (
                <div className="bg-primary text-white px-4 py-1 text-xs font-medium text-center">
                  MOST POPULAR
                </div>
              )}
              <div className="p-6 border-b border-neutral-200">
                <h3 className="text-lg font-heading font-bold text-neutral-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-neutral-900">{plan.price}</span>
                  <span className="text-neutral-600 ml-1">/{billingInterval === "monthly" ? "month" : "year"}</span>
                </div>
                {plan.savings && (
                  <span className="inline-block bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded mt-2">
                    {plan.savings}
                  </span>
                )}
                <p className="text-neutral-500 mt-4 text-sm">{plan.description}</p>
              </div>
              <div className="p-6">
                <ul className="space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <svg className="w-5 h-5 text-secondary mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-neutral-700">{feature}</span>
                    </li>
                  ))}
                  {plan.limitations?.map((limitation) => (
                    <li key={limitation} className="flex items-start text-neutral-400">
                      <svg className="w-5 h-5 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span>{limitation}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Button 
                    asChild
                    className={`w-full ${
                      plan.popular ? "" : "border-primary text-primary hover:bg-primary hover:text-white"
                    }`}
                    variant={plan.popular ? "default" : "outline"}
                  >
                    <Link href="/auth">{plan.button}</Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center p-8 bg-white rounded-xl shadow-sm max-w-4xl mx-auto">
          <h3 className="text-2xl font-heading font-bold mb-4">Need a custom solution?</h3>
          <p className="text-neutral-600 mb-6">Contact our team for custom pricing and features tailored to your organization's specific needs.</p>
          <Button variant="outline">Get in Touch</Button>
        </div>
      </div>
    </section>
  );
}
