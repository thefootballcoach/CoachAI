import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Suspense, lazy } from "react";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";

// Loading component for Suspense fallback
const LoadingPage = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
  </div>
);

// Lazy load components to enable code splitting
const NotFound = lazy(() => import("@/pages/not-found"));
const HomePage = lazy(() => import("@/pages/home-page"));
const AuthPage = lazy(() => import("@/pages/auth-page"));
const VerifyEmailPage = lazy(() => import("@/pages/verify-email-page"));
const ForgotPasswordPage = lazy(() => import("@/pages/forgot-password-page"));
const ResetPasswordPage = lazy(() => import("@/pages/reset-password-page"));
const CompleteInvitationPage = lazy(() => import("@/pages/complete-invitation-page"));
const OnboardingPage = lazy(() => import("@/pages/onboarding-page"));
const DashboardPage = lazy(() => import("@/pages/dashboard-page"));
const UploadPage = lazy(() => import("@/pages/upload-page"));
const BatchUploadPage = lazy(() => import("@/pages/batch-upload-page"));
const AnalyticsPage = lazy(() => import("@/pages/analytics-page"));
const FeedbackPage = lazy(() => import("@/pages/feedback-page"));
const FeedbackListPage = lazy(() => import("@/pages/feedback-list-page"));
const ProfilePage = lazy(() => import("@/pages/profile-page"));
const PricingPage = lazy(() => import("@/pages/pricing-page"));
const CheckoutPage = lazy(() => import("@/pages/checkout-page"));
const SubscriptionPage = lazy(() => import("@/pages/subscription-page"));
const AdminPage = lazy(() => import("@/pages/admin-page"));
const AdminDatabasePage = lazy(() => import("@/pages/admin-database-page"));
const ClubDashboardPage = lazy(() => import("@/pages/club-dashboard-simple"));
const ClubStatisticsPage = lazy(() => import("@/pages/club-statistics-page"));
const CoachProfilePage = lazy(() => import("@/pages/coach-profile-page-simple"));
const SuperAdminPage = lazy(() => import("@/pages/super-admin-page"));
const ResearchPage = lazy(() => import("@/pages/research-page"));
const DiaryPage = lazy(() => import("@/pages/diary-page"));
const RecommendationsPage = lazy(() => import("@/pages/recommendations-page"));
const RegisterPage = lazy(() => import("@/pages/register-page"));
const CustomFeedbackReportsPage = lazy(() => import("@/pages/custom-feedback-reports-page"));
const DevelopmentPlanPage = lazy(() => import("@/pages/development-plan-page"));
const DevelopmentPlansListPage = lazy(() => import("@/pages/development-plans-list-page"));
const ErrorLogsPage = lazy(() => import("@/pages/error-logs-page"));
const MultiAIAnalysis = lazy(() => import("@/pages/MultiAIAnalysis"));


function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/verify-email" component={VerifyEmailPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/complete-invitation" component={CompleteInvitationPage} />
      <Route path="/onboarding" component={OnboardingPage} />
      <Route path="/pricing" component={PricingPage} />
      <ProtectedRoute path="/dashboard" component={DashboardPage} />
      <ProtectedRoute path="/upload" component={UploadPage} />
      <ProtectedRoute path="/batch-upload" component={BatchUploadPage} />
      <ProtectedRoute path="/analytics" component={AnalyticsPage} />
      <ProtectedRoute path="/feedback" component={FeedbackListPage} />
      <ProtectedRoute path="/feedback/:id" component={FeedbackPage} />
      <ProtectedRoute path="/analysis/:id" component={MultiAIAnalysis} />
      <ProtectedRoute path="/audios/:id" component={FeedbackPage} />
      <ProtectedRoute path="/recommendations/:id" component={RecommendationsPage} />
      <ProtectedRoute path="/research" component={ResearchPage} />
      <ProtectedRoute path="/diary" component={DiaryPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/checkout" component={CheckoutPage} />
      <ProtectedRoute path="/subscription" component={SubscriptionPage} />
      <ProtectedRoute path="/admin" component={AdminPage} />
      <ProtectedRoute path="/admin/database" component={AdminDatabasePage} />
      <ProtectedRoute path="/club-dashboard" component={ClubDashboardPage} />
      <ProtectedRoute path="/club-statistics" component={ClubStatisticsPage} />
      <ProtectedRoute path="/coach/:id" component={CoachProfilePage} />
      <ProtectedRoute path="/custom-feedback-reports" component={CustomFeedbackReportsPage} />
      <ProtectedRoute path="/development-plans" component={DevelopmentPlansListPage} />
      <ProtectedRoute path="/development-plan/:planId" component={DevelopmentPlanPage} />
      <ProtectedRoute path="/super-admin" component={SuperAdminPage} />
      <ProtectedRoute path="/error-logs" component={ErrorLogsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Suspense fallback={<LoadingPage />}>
          <Router />
        </Suspense>
      </TooltipProvider>
    </AuthProvider>
  );
}

export default App;
