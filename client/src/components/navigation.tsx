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
          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified
          </Badge>
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
        return (
          <Badge 
            variant="secondary" 
            className="bg-orange-100 text-orange-800 border-orange-200 cursor-pointer hover:bg-orange-200"
            onClick={() => window.location.href = "/profile-verification"}
          >
            <AlertCircle className="w-3 h-3 mr-1" />
            Complete Profile
          </Badge>
        );
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
                {user && (!(user as any)?.isProfileComplete || (user as any)?.kycStatus !== "verified") && (
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
