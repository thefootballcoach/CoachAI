export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  credits: number;
  maxUploads: number;
  analysisTypes: string[];
  stripePriceId?: string;
  popular?: boolean;
}

export const SUBSCRIPTION_PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for individual coaches getting started',
    price: 29,
    currency: 'usd',
    interval: 'month',
    credits: 10,
    maxUploads: 5,
    features: [
      '10 coaching session analyses per month',
      'Basic AI feedback reports',
      'Email support',
      'Mobile app access'
    ],
    analysisTypes: ['basic']
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Advanced features for serious coaching development',
    price: 79,
    currency: 'usd',
    interval: 'month',
    credits: 50,
    maxUploads: 25,
    features: [
      '50 coaching session analyses per month',
      'Advanced AI feedback with research insights',
      'Progress tracking and analytics',
      'Priority email support',
      'Export reports to PDF',
      'Custom coaching frameworks'
    ],
    analysisTypes: ['basic', 'advanced'],
    popular: true
  },
  {
    id: 'team',
    name: 'Team',
    description: 'Collaborative coaching development for organizations',
    price: 199,
    currency: 'usd',
    interval: 'month',
    credits: 200,
    maxUploads: 100,
    features: [
      '200 coaching session analyses per month',
      'Team collaboration tools',
      'Advanced analytics dashboard',
      'Custom branding',
      'Priority phone support',
      'Dedicated account manager',
      'API access',
      'Custom integrations'
    ],
    analysisTypes: ['basic', 'advanced', 'premium']
  }
];

export const CREDIT_PACKAGES = [
  {
    id: 'credits_10',
    name: '10 Credits',
    description: 'Additional session analyses',
    price: 15,
    credits: 10
  },
  {
    id: 'credits_25',
    name: '25 Credits',
    description: 'Extended analysis package',
    price: 35,
    credits: 25
  },
  {
    id: 'credits_50',
    name: '50 Credits',
    description: 'Professional analysis package',
    price: 65,
    credits: 50
  }
];

export function getPlanById(planId: string): Plan | undefined {
  return SUBSCRIPTION_PLANS.find(plan => plan.id === planId);
}

export function canUserAccessFeature(userPlan: string, feature: string): boolean {
  const plan = getPlanById(userPlan);
  if (!plan) return false;
  
  const featureMap: Record<string, string[]> = {
    'basic_analysis': ['starter', 'professional', 'team'],
    'advanced_analysis': ['professional', 'team'],
    'premium_analysis': ['team'],
    'progress_tracking': ['professional', 'team'],
    'team_collaboration': ['team'],
    'custom_branding': ['team'],
    'api_access': ['team']
  };
  
  return featureMap[feature]?.includes(userPlan) || false;
}

export function getUserPlanLimits(userPlan: string) {
  const plan = getPlanById(userPlan);
  if (!plan) {
    return {
      credits: 0,
      maxUploads: 0,
      analysisTypes: []
    };
  }
  
  return {
    credits: plan.credits,
    maxUploads: plan.maxUploads,
    analysisTypes: plan.analysisTypes
  };
}