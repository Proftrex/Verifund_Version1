import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Shield } from "lucide-react";

export default function LoginPage() {
  const userOptions = [
    {
      email: "professortrex1995@gmail.com",
      firstName: "Trexie",
      lastName: "Olaya",
      isAdmin: false,
      description: "Regular User - Can create campaigns, contribute, and volunteer"
    },
    {
      email: "mtrexiaolaya@gmail.com", 
      firstName: "Trexia",
      lastName: "Olaya",
      isAdmin: false,
      description: "Regular User - Can create campaigns, contribute, and volunteer"
    },
    {
      email: "admin@test.com",
      firstName: "Admin",
      lastName: "User",
      isAdmin: true,
      description: "Administrator - Full access to admin panel and user features"
    },
  ];

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
          <p className="text-gray-600">Choose an account to continue</p>
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

        <div className="text-center mt-8 text-sm text-gray-500">
          <p>This is a development interface. In production, users would login with their Replit accounts.</p>
        </div>
      </div>
    </div>
  );
}