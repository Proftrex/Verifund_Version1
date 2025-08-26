import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Shield, Mail } from "lucide-react";

export default function LoginPage() {
  const userOptions = [
    {
      email: "trexia.olaya@pdax.ph",
      firstName: "Trexia",
      lastName: "Olaya",
      isAdmin: true,
      description: "Authorized Administrator - Full access to admin panel and user features"
    },
  ];

  const [customEmail, setCustomEmail] = useState("");

  const handleLogin = (email: string) => {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('testUser', email);
    currentUrl.pathname = '/';
    window.location.href = currentUrl.toString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome to VeriFund</h1>
          <p className="text-gray-600">Sign in with your Replit account to continue</p>
        </div>

        {/* Production Login Only */}
        <Card className="mb-6 border-2 border-blue-200 bg-blue-50">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" />
              Secure Authentication
            </CardTitle>
            <CardDescription>
              Login with your Replit account for secure access to VeriFund
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              onClick={() => window.location.href = '/api/login'}
              className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg"
            >
              Sign in with Replit
            </Button>
            <p className="text-xs text-gray-500 mt-4">
              Your account type (admin or user) will be automatically determined based on your email address
            </p>
          </CardContent>
        </Card>

        <div className="text-center mt-8 space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-800 mb-2">How it works:</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Admin emails get full platform access</p>
              <p>• Regular users can create campaigns and contribute</p>
              <p>• All authentication is secure through Replit</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}