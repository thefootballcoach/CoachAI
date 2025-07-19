import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Upload, 
  BarChart3, 
  BookOpen, 
  ArrowRight,
  Play,
  Trophy,
  Target,
  MessageSquare
} from "lucide-react";

const steps = [
  {
    id: 1,
    title: "Welcome to CoachAI",
    description: "Your AI-powered coaching analysis platform",
    content: "WelcomeStep"
  },
  {
    id: 2,
    title: "Upload Your First Session",
    description: "Start analyzing your coaching sessions",
    content: "UploadStep"
  },
  {
    id: 3,
    title: "Understanding Your Analysis",
    description: "Learn how to interpret AI feedback",
    content: "AnalysisStep"
  },
  {
    id: 4,
    title: "Track Your Progress",
    description: "Monitor your coaching development",
    content: "ProgressStep"
  }
];

const WelcomeStep = ({ onNext }: { onNext: () => void }) => {
  const { user } = useAuth();
  
  return (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto flex items-center justify-center">
        <Trophy className="w-8 h-8 text-white" />
      </div>
      <div>
        <h2 className="text-2xl font-bold mb-2">Welcome, {user?.name || user?.username}!</h2>
        <p className="text-muted-foreground mb-6">
          You're now part of an elite community of coaches using AI-powered analysis to elevate their performance. 
          Let's get you started with evidence-based coaching development.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
        <div className="p-4 border rounded-lg">
          <MessageSquare className="w-8 h-8 text-blue-500 mb-2" />
          <h3 className="font-semibold mb-1">AI Analysis</h3>
          <p className="text-sm text-muted-foreground">
            Get comprehensive feedback on your coaching sessions across 7 key categories
          </p>
        </div>
        <div className="p-4 border rounded-lg">
          <Target className="w-8 h-8 text-green-500 mb-2" />
          <h3 className="font-semibold mb-1">Evidence-Based</h3>
          <p className="text-sm text-muted-foreground">
            Research-backed insights from top coaches, clubs and coach developers
          </p>
        </div>
        <div className="p-4 border rounded-lg">
          <BarChart3 className="w-8 h-8 text-purple-500 mb-2" />
          <h3 className="font-semibold mb-1">Progress Tracking</h3>
          <p className="text-sm text-muted-foreground">
            Monitor your development with detailed analytics and progress reports
          </p>
        </div>
      </div>
      
      <Button onClick={onNext} className="w-full md:w-auto">
        Let's Get Started
        <ArrowRight className="ml-2 w-4 h-4" />
      </Button>
    </div>
  );
};

const UploadStep = ({ onNext }: { onNext: () => void }) => {
  const [, navigate] = useLocation();
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <Upload className="w-12 h-12 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Upload Your First Session</h2>
        <p className="text-muted-foreground">
          Upload an audio or video recording of your coaching session to receive comprehensive AI analysis.
        </p>
      </div>
      
      <div className="bg-muted p-6 rounded-lg">
        <h3 className="font-semibold mb-3">Supported Formats:</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Audio Files</h4>
            <div className="space-y-1">
              <Badge variant="outline">MP3</Badge>
              <Badge variant="outline">WAV</Badge>
              <Badge variant="outline">M4A</Badge>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">Video Files</h4>
            <div className="space-y-1">
              <Badge variant="outline">MP4</Badge>
              <Badge variant="outline">MOV</Badge>
              <Badge variant="outline">AVI</Badge>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Pro Tip:</h4>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          For best results, ensure your recording has clear audio quality and is at least 5 minutes long. 
          The AI can analyze sessions up to 2 hours in length.
        </p>
      </div>
      
      <div className="flex gap-3">
        <Button onClick={() => navigate('/upload')} className="flex-1">
          <Upload className="mr-2 w-4 h-4" />
          Upload Session Now
        </Button>
        <Button variant="outline" onClick={onNext}>
          Skip for Now
        </Button>
      </div>
    </div>
  );
};

const AnalysisStep = ({ onNext }: { onNext: () => void }) => {
  const analysisCategories = [
    {
      name: "Key Info",
      description: "Session overview, duration, and participant details",
      color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    },
    {
      name: "Questioning Techniques",
      description: "Quality and effectiveness of questions used",
      color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    },
    {
      name: "Language/Communication",
      description: "Communication style and clarity assessment",
      color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
    },
    {
      name: "Coach Behaviours",
      description: "Leadership approach and coaching methods",
      color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
    },
    {
      name: "Player Engagement",
      description: "Interaction quality and participation levels",
      color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    },
    {
      name: "Intended Outcomes",
      description: "Goal achievement and session effectiveness",
      color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    },
    {
      name: "Neuroscience Research",
      description: "Evidence-based coaching methodology comparison",
      color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
    }
  ];
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <BarChart3 className="w-12 h-12 text-purple-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Understanding Your Analysis</h2>
        <p className="text-muted-foreground">
          CoachAI provides comprehensive feedback across seven key coaching categories based on research methodology.
        </p>
      </div>
      
      <div className="grid gap-3">
        {analysisCategories.map((category, index) => (
          <div key={index} className="flex items-start p-4 border rounded-lg">
            <div className={`px-2 py-1 rounded text-xs font-medium mr-3 mt-0.5 ${category.color}`}>
              {index + 1}
            </div>
            <div>
              <h3 className="font-semibold mb-1">{category.name}</h3>
              <p className="text-sm text-muted-foreground">{category.description}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
        <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Analysis Complete in Minutes</h4>
        <p className="text-sm text-green-800 dark:text-green-200">
          Once uploaded, your session will be processed and analyzed within 3-5 minutes. 
          You'll receive detailed feedback with actionable insights for improvement.
        </p>
      </div>
      
      <Button onClick={onNext} className="w-full">
        Continue to Progress Tracking
        <ArrowRight className="ml-2 w-4 h-4" />
      </Button>
    </div>
  );
};

const ProgressStep = ({ onComplete }: { onComplete: () => void }) => {
  const [, navigate] = useLocation();
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Track Your Progress</h2>
        <p className="text-muted-foreground">
          Monitor your coaching development with detailed analytics and progress reports.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded-lg">
          <BarChart3 className="w-8 h-8 text-blue-500 mb-2" />
          <h3 className="font-semibold mb-1">Analytics Dashboard</h3>
          <p className="text-sm text-muted-foreground">
            View trends, improvements, and detailed session comparisons over time.
          </p>
        </div>
        <div className="p-4 border rounded-lg">
          <BookOpen className="w-8 h-8 text-green-500 mb-2" />
          <h3 className="font-semibold mb-1">Research Library</h3>
          <p className="text-sm text-muted-foreground">
            Access evidence-based coaching resources and development materials.
          </p>
        </div>
      </div>
      
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-6 rounded-lg border">
        <h3 className="font-semibold mb-2">Ready to Start Your Coaching Journey?</h3>
        <p className="text-sm text-muted-foreground mb-4">
          You're all set! Start uploading sessions and receive instant AI-powered feedback to elevate your coaching performance.
        </p>
        <div className="flex gap-3">
          <Button onClick={() => navigate('/upload')}>
            <Upload className="mr-2 w-4 h-4" />
            Upload First Session
          </Button>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
      
      <Button variant="ghost" onClick={onComplete} className="w-full">
        Complete Onboarding
      </Button>
    </div>
  );
};

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [, navigate] = useLocation();
  
  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const handleComplete = () => {
    navigate('/dashboard');
  };
  
  const progress = (currentStep / steps.length) * 100;
  const currentStepData = steps.find(step => step.id === currentStep);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Play className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">CoachAI Onboarding</h1>
            <p className="text-muted-foreground">Let's get you started with evidence-based coaching development</p>
          </div>
          
          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Step {currentStep} of {steps.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
            
            <div className="flex justify-between mt-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step.id < currentStep 
                      ? 'bg-green-500 text-white' 
                      : step.id === currentStep 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {step.id < currentStep ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      step.id
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-0.5 ml-2 ${
                      step.id < currentStep ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Content */}
          <Card>
            <CardHeader>
              <CardTitle>{currentStepData?.title}</CardTitle>
              <CardDescription>{currentStepData?.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {currentStep === 1 && <WelcomeStep onNext={handleNext} />}
              {currentStep === 2 && <UploadStep onNext={handleNext} />}
              {currentStep === 3 && <AnalysisStep onNext={handleNext} />}
              {currentStep === 4 && <ProgressStep onComplete={handleComplete} />}
            </CardContent>
          </Card>
          
          {/* Skip Option */}
          <div className="text-center mt-6">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              Skip Onboarding
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}