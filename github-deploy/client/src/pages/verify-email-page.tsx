import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function VerifyEmailPage() {
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. No token provided.');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await apiRequest('GET', `/api/verify-email?token=${token}`);
        const result = await response.json();
        
        if (response.ok) {
          setStatus('success');
          setMessage('Your email has been verified successfully!');
        } else {
          setStatus('error');
          setMessage(result.message || 'Email verification failed.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('An error occurred while verifying your email.');
      }
    };

    verifyEmail();
  }, [token]);

  const handleContinue = () => {
    setLocation('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Email Verification</CardTitle>
          <CardDescription>
            Verifying your CoachAI account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            {status === 'loading' && (
              <>
                <Loader2 className="h-12 w-12 animate-spin text-cyan-600" />
                <p className="text-gray-600">Verifying your email address...</p>
              </>
            )}
            
            {status === 'success' && (
              <>
                <CheckCircle className="h-12 w-12 text-green-600" />
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold text-green-800">Verification Successful</h3>
                  <p className="text-gray-600">{message}</p>
                  <p className="text-sm text-gray-500">
                    You can now access all features of your CoachAI account.
                  </p>
                </div>
              </>
            )}
            
            {status === 'error' && (
              <>
                <XCircle className="h-12 w-12 text-red-600" />
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold text-red-800">Verification Failed</h3>
                  <p className="text-gray-600">{message}</p>
                  <p className="text-sm text-gray-500">
                    Please try again or contact support if the problem persists.
                  </p>
                </div>
              </>
            )}
          </div>
          
          {status !== 'loading' && (
            <Button 
              onClick={handleContinue} 
              className="w-full bg-cyan-600 hover:bg-cyan-700"
            >
              Continue to Login
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}