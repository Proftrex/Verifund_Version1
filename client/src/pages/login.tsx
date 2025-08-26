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
          <p className="text-gray-600">Choose an account to continue or login with any email</p>
        </div>

        {/* Custom Email Login */}
        <Card className="mb-6 border-2 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-green-600" />
              Login as Regular User
            </CardTitle>
            <CardDescription>
              Enter any email address to login as a regular user
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="custom-email">Email Address</Label>
                <Input
                  id="custom-email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button 
                onClick={() => customEmail && handleLogin(customEmail)}
                disabled={!customEmail || !customEmail.includes('@')}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Login as Regular User
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mb-4">
          <p className="text-sm text-gray-500">Or choose from predefined accounts:</p>
        </div>

        <div className="grid gap-4">
          {userOptions.map((user) => (
            <Card key={user.email} className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-full ${user.isAdmin ? 'bg-blue-100' : 'bg-green-100'}`}>
                      {user.isAdmin ? (
                        <Shield className="h-6 w-6 text-blue-600" />
                      ) : (
                        <User className="h-6 w-6 text-green-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {user.firstName} {user.lastName}
                      </h3>
                      <p className="text-gray-600 text-sm">{user.email}</p>
                      <p className="text-gray-500 text-xs mt-1">{user.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    {user.isAdmin && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        Administrator
                      </Badge>
                    )}
                    <Button 
                      onClick={() => handleLogin(user.email)}
                      className="min-w-[100px]"
                    >
                      Login as {user.firstName}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8 space-y-4">
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Production Login</p>
            <Button 
              onClick={() => window.location.href = '/api/login'}
              variant="outline"
              className="min-w-[200px]"
            >
              Login with Replit Account
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              Login with your Replit account (any email will be accepted as regular user)
            </p>
          </div>
          
          <div className="text-xs text-gray-500">
            <p>Development mode: Admin access restricted to authorized emails</p>
          </div>
        </div>
      </div>
    </div>
  );
}