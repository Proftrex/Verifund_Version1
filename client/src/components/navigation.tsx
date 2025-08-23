import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import { Coins, Menu, X, AlertCircle, CheckCircle, Clock, Wallet, ArrowUpRight, Bell } from "lucide-react";
import { DepositModal } from "@/components/deposit-modal";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Notification } from "@shared/schema";

export default function Navigation() {
  const { isAuthenticated, user } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: isAuthenticated && !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return await apiRequest("PATCH", `/api/notifications/${notificationId}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("PATCH", "/api/notifications/mark-all-read", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

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
    { href: "/browse-campaigns", label: "Campaign Opportunities" },
    { href: "/campaigns", label: "My Campaigns" },
    { href: "/volunteer", label: "Volunteer Opportunities" },
    { href: "/my-profile", label: "My Profile" },
  ];

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center gap-2">
              <img 
                src="/verifund-logo.png"
                alt="VeriFund Logo" 
                className="w-8 h-8 object-contain"
              />
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
                {/* Notification Bell */}
                <Popover open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="relative p-2"
                      data-testid="button-notifications"
                    >
                      <Bell className="w-4 h-4" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="end">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Notifications</h3>
                        {unreadCount > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAllAsReadMutation.mutate()}
                            disabled={markAllAsReadMutation.isPending}
                            className="text-xs"
                            data-testid="button-mark-all-read"
                          >
                            Mark all read
                          </Button>
                        )}
                      </div>
                      
                      <div className="max-h-80 overflow-y-auto space-y-2">
                        {notifications.length === 0 ? (
                          <div className="text-center py-6 text-muted-foreground">
                            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No notifications yet</p>
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors ${
                                !notification.isRead ? 'bg-blue-50 border-blue-200' : 'bg-white'
                              }`}
                              onClick={() => {
                                if (!notification.isRead) {
                                  markAsReadMutation.mutate(notification.id);
                                }
                              }}
                              data-testid={`notification-${notification.id}`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium text-sm">{notification.title}</h4>
                                    {!notification.isRead && (
                                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : 'Unknown time'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Profile Picture with Verification Badge */}
                <div className="relative">
                  <div className="w-8 h-8 bg-gray-300 rounded-full overflow-hidden flex items-center justify-center">
                    {(user as any)?.profileImageUrl ? (
                      <img 
                        src={`/public-objects${(user as any).profileImageUrl.replace('/objects', '')}`} 
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to initials if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const nextSibling = target.nextElementSibling as HTMLElement;
                          if (nextSibling) {
                            nextSibling.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <span 
                      className={`text-sm font-medium text-gray-600 ${(user as any)?.profileImageUrl ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}
                      style={{display: (user as any)?.profileImageUrl ? 'none' : 'flex'}}
                    >
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
                    ₱{parseFloat((user as any).phpBalance || "0").toLocaleString()}
                  </span>
                  <Badge variant="secondary" className="text-xs">PHP</Badge>
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
                    ₱{parseFloat((user as any).phpBalance || "0").toLocaleString()}
                  </span>
                  <Badge variant="secondary" className="text-xs">PHP</Badge>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
