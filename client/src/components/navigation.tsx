import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import { Coins, Menu, X, AlertCircle, CheckCircle, Clock, Wallet, ArrowUpRight } from "lucide-react";
import { DepositModal } from "@/components/deposit-modal";
import { useState } from "react";

export default function Navigation() {
  const { isAuthenticated, user } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getKycStatusBadge = () => {
    if (!user) return null;
    
    const status = (user as any).kycStatus;
    switch (status) {
      case "verified":
        return (
          <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-2 py-1 rounded-full border border-green-200">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs font-medium">VERIFIED</span>
          </div>
        );
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return null; // Don't show badge for unverified users - Complete Profile button handles this
    }
  };

  const navItems = [
    { href: "/campaigns", label: "Campaigns" },
    { href: "/create-campaign", label: "Start Campaign" },
    { href: "/volunteer", label: "Volunteer" },
  ];

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <span className="text-2xl font-bold text-primary">VeriFund</span>
            </Link>
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                {isAuthenticated && navItems.map((item) => (
                  <Link 
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location === item.href
                        ? "text-primary bg-primary/10"
                        : "text-gray-700 hover:text-primary"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated && user && (
              <div className="hidden md:flex items-center space-x-3">
                {/* Profile Picture with Verification Badge */}
                <div className="relative">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {(user as any)?.firstName?.charAt(0) || 'U'}
                    </span>
                  </div>
                  {(user as any)?.kycStatus === "verified" && (
                    <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5">
                      <CheckCircle className="w-3 h-3 text-white" fill="currentColor" />
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg">
                  <Coins className="text-accent w-4 h-4" />
                  <span className="text-sm font-medium">
                    ₱{parseFloat((user as any).pusoBalance || "0").toLocaleString()}
                  </span>
                  <Badge variant="secondary" className="text-xs">PUSO</Badge>
                </div>
                <DepositModal />
                {getKycStatusBadge()}
              </div>
            )}

            {!isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = "/api/login"}
                  data-testid="button-signin"
                >
                  Sign In
                </Button>
                <Button
                  size="sm"
                  onClick={() => window.location.href = "/api/login"}
                  data-testid="button-signup"
                >
                  Sign Up
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                {/* Show Complete Profile button for users who need to complete verification */}
                {/* Show Complete Profile button only for unverified users */}
                {user && (user as any)?.kycStatus !== "verified" && (
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="bg-orange-600 hover:bg-orange-700" 
                    onClick={() => window.location.href = "/profile-verification"}
                    data-testid="button-complete-profile"
                  >
                    Complete Profile
                  </Button>
                )}
                {(user as any)?.isAdmin && (
                  <Link href="/admin">
                    <Button variant="outline" size="sm" data-testid="button-admin">
                      Admin
                    </Button>
                  </Link>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = "/api/logout"}
                  data-testid="button-logout"
                >
                  Logout
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && isAuthenticated && (
          <div className="md:hidden border-t py-4">
            <div className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location === item.href
                      ? "text-primary bg-primary/10"
                      : "text-gray-700"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              {user && (
                <div className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg mt-2">
                  <Coins className="text-accent w-4 h-4" />
                  <span className="text-sm font-medium">
                    ₱{parseFloat((user as any).pusoBalance || "0").toLocaleString()}
                  </span>
                  <Badge variant="secondary" className="text-xs">PUSO</Badge>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
