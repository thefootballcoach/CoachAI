import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Users, Crown } from "lucide-react";
import { Link } from "wouter";
import { SUBSCRIPTION_PLANS } from "@shared/plans";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900">
      <div className="container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-white via-cyan-200 to-blue-300 bg-clip-text text-transparent">
            Choose Your Plan
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Start with evidence-based coaching analysis and scale as you grow
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative ${
                plan.popular 
                  ? 'border-2 border-cyan-400 bg-gradient-to-br from-slate-800/90 to-slate-700/90 scale-105' 
                  : 'border border-slate-600 bg-gradient-to-br from-slate-800/60 to-slate-700/60'
              } backdrop-blur-sm`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold px-4 py-1">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center pb-8">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                  plan.id === 'starter' ? 'bg-gradient-to-br from-emerald-500 to-cyan-600' :
                  plan.id === 'professional' ? 'bg-gradient-to-br from-cyan-500 to-blue-600' :
                  'bg-gradient-to-br from-blue-500 to-purple-600'
                }`}>
                  {plan.id === 'starter' && <Zap className="w-8 h-8 text-white" />}
                  {plan.id === 'professional' && <Users className="w-8 h-8 text-white" />}
                  {plan.id === 'team' && <Crown className="w-8 h-8 text-white" />}
                </div>
                
                <CardTitle className="text-2xl font-bold text-white mb-2">{plan.name}</CardTitle>
                <CardDescription className="text-slate-300 mb-4">{plan.description}</CardDescription>
                
                <div className="text-center">
                  <span className="text-4xl font-black text-white">${plan.price}</span>
                  <span className="text-slate-300 ml-2">/{plan.interval}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-emerald-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-200 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>

              <CardFooter>
                <Button 
                  asChild
                  className={`w-full ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500' 
                      : 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600'
                  } text-white border-0 font-bold py-3`}
                >
                  <Link href={plan.name === 'Starter' ? '/checkout' : '/subscription'}>
                    {plan.price === 0 ? 'Get Started Free' : 'Get Started'}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="text-center mt-16">
          <p className="text-slate-400 mb-8">
            All plans include secure cloud storage, mobile access, and our evidence-based AI analysis engine
          </p>
          
          <div className="space-y-4">
            <p className="text-slate-300">
              Need a custom solution? <Link href="/auth" className="text-cyan-400 hover:text-cyan-300 underline">Contact our team</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}