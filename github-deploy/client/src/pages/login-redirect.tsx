import { useEffect } from "react";

export default function LoginRedirect() {
  useEffect(() => {
    // Redirect to login page
    window.location.href = "/login";
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Redirecting to login...</h2>
        <p className="text-gray-600">Please wait while we redirect you to the login page.</p>
      </div>
    </div>
  );
}