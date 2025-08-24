import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import { Coins, Menu, X, Bell, ChevronDown, MessageCircle } from "lucide-react";
import { DepositModal } from "@/components/deposit-modal";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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


  const navItems = [
    { href: "/my-profile", label: "My Profile" },
    { href: "/support/tickets/new", label: "File Support Ticket", icon: MessageCircle },
  ];

  return (
    <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 w-full max-w-7xl mx-auto z-50 px-4">
      <div className="bg-white/95 backdrop-blur-sm shadow-lg rounded-2xl border border-gray-200/50">
        <div className="flex justify-between items-center h-16 px-6">
          <div className="flex items-center">
            <Link 
              href={isAuthenticated && ((user as any)?.isAdmin || (user as any)?.isSupport) ? "/admin?tab=profile" : "/"} 
              className="flex-shrink-0 flex items-center gap-2"
            >
              <img 
                src="/verifund-logo.png"
                alt="VeriFund Logo" 
                className="w-8 h-8 object-contain"
              />
              <span className="text-2xl font-bold text-primary">VeriFund</span>
            </Link>
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                {isAuthenticated && !(user as any)?.isAdmin && !(user as any)?.isSupport && (
                  <>
                    {/* My Opportunities Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
                            location === "/browse-campaigns" || location === "/volunteer"
                              ? "text-primary bg-primary/10"
                              : "text-gray-700 hover:text-primary"
                          }`}
                        >
                          My Opportunities
                          <ChevronDown className="w-4 h-4 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem asChild>
                          <Link href="/browse-campaigns" className="w-full cursor-pointer">
                            Campaign Opportunities
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/volunteer" className="w-full cursor-pointer">
                            Volunteer Opportunities
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* My Campaigns Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
                            location === "/campaigns" || location === "/volunteer-applications"
                              ? "text-primary bg-primary/10"
                              : "text-gray-700 hover:text-primary"
                          }`}
                        >
                          My Campaigns
                          <ChevronDown className="w-4 h-4 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem asChild>
                          <Link href="/campaigns" className="w-full cursor-pointer">
                            Campaign Overview
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/volunteer-applications" className="w-full cursor-pointer">
                            Volunteer Applications
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Regular Navigation Items */}
                    {navItems.map((item) => (
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
                  </>
                )}
                
                {/* Admin/Support Only Navigation */}
                {isAuthenticated && ((user as any)?.isAdmin || (user as any)?.isSupport) && (
                  <>
                    <Link 
                      href="/admin?tab=my-works"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        location === "/admin" && (window.location.search.includes('tab=my-works') || !window.location.search)
                          ? "text-primary bg-primary/10"
                          : "text-gray-700 hover:text-primary"
                      }`}
                    >
                      My Works
                    </Link>
                    <Link 
                      href="/admin?tab=kyc"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        location === "/admin" && window.location.search.includes('tab=kyc')
                          ? "text-primary bg-primary/10"
                          : "text-gray-700 hover:text-primary"
                      }`}
                    >
                      KYC
                    </Link>
                    <Link 
                      href="/admin?tab=campaigns"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        location === "/admin" && window.location.search.includes('tab=campaigns')
                          ? "text-primary bg-primary/10"
                          : "text-gray-700 hover:text-primary"
                      }`}
                    >
                      Campaigns
                    </Link>
                    <Link 
                      href="/admin?tab=volunteers"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        location === "/admin" && window.location.search.includes('tab=volunteers')
                          ? "text-primary bg-primary/10"
                          : "text-gray-700 hover:text-primary"
                      }`}
                    >
                      Volunteers
                    </Link>
                    <Link 
                      href="/admin?tab=financial"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        location === "/admin" && window.location.search.includes('tab=financial')
                          ? "text-primary bg-primary/10"
                          : "text-gray-700 hover:text-primary"
                      }`}
                    >
                      Financial
                    </Link>
                    <Link 
                      href="/admin?tab=reports"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        location === "/admin" && window.location.search.includes('tab=reports')
                          ? "text-primary bg-primary/10"
                          : "text-gray-700 hover:text-primary"
                      }`}
                    >
                      Reports
                    </Link>
                    <Link 
                      href="/admin?tab=tickets"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        location === "/admin" && window.location.search.includes('tab=tickets')
                          ? "text-primary bg-primary/10"
                          : "text-gray-700 hover:text-primary"
                      }`}
                    >
                      Tickets
                    </Link>
                    <Link 
                      href="/admin?tab=stories"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        location === "/admin" && window.location.search.includes('tab=stories')
                          ? "text-primary bg-primary/10"
                          : "text-gray-700 hover:text-primary"
                      }`}
                    >
                      Stories
                    </Link>
                    {(user as any)?.isAdmin && (
                      <>
                        <Link 
                          href="/admin?tab=access"
                          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            location === "/admin" && window.location.search.includes('tab=access')
                              ? "text-primary bg-primary/10"
                              : "text-gray-700 hover:text-primary"
                          }`}
                          data-testid="nav-access"
                        >
                          Access
                        </Link>
                      </>
                    )}
                  </>
                )}
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
                        <Link href="/notifications">
                          <Button variant="ghost" size="sm" className="text-xs" data-testid="button-view-all-notifications">
                            View all
                          </Button>
                        </Link>
                      </div>
                      
                      <div className="max-h-80 overflow-y-auto space-y-2">
                        {notifications.length === 0 ? (
                          <div className="text-center py-6 text-muted-foreground">
                            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No notifications yet</p>
                          </div>
                        ) : (
                          notifications.slice(0, 5).map((notification) => (
                            <div
                              key={notification.id}
                              className={`p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors ${
                                !notification.isRead ? 'bg-blue-50 border-blue-200' : 'bg-white'
                              }`}
                              onClick={() => {
                                if (!notification.isRead) {
                                  markAsReadMutation.mutate(notification.id);
                                }
                                // Navigate to action URL if available
                                if (notification.actionUrl) {
                                  window.location.href = notification.actionUrl;
                                } else {
                                  // Fallback to notifications page
                                  window.location.href = '/notifications';
                                }
                                setIsNotificationOpen(false);
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
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
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
                        {notifications.length > 5 && (
                          <div className="text-center py-2 border-t">
                            <Link href="/notifications">
                              <Button variant="ghost" size="sm" className="text-xs">
                                View {notifications.length - 5} more notifications
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                
                {/* Show peso balance and deposit only for regular users, not admin/support */}
                {!(user as any)?.isAdmin && !(user as any)?.isSupport && (
                  <>
                    <div className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg">
                      <Coins className="text-accent w-4 h-4" />
                      <span className="text-sm font-medium">
                        ₱{parseFloat((user as any).phpBalance || "0").toLocaleString()}
                      </span>
                      <Badge variant="secondary" className="text-xs">PHP</Badge>
                    </div>
                    <DepositModal />
                  </>
                )}
              </div>
            )}

            {!isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  className="bg-primary text-white hover:bg-primary/90 rounded-lg px-6"
                  onClick={() => window.location.href = "/api/login"}
                  data-testid="button-sign-in"
                >
                  Sign In
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
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
          <div className="md:hidden border-t py-4 rounded-b-2xl bg-white/95">
            <div className="flex flex-col space-y-2">
              {/* Regular User Mobile Menu */}
              {!(user as any)?.isAdmin && !(user as any)?.isSupport && (
                <>
                  {/* My Opportunities - Mobile */}
                  <div className="px-3 py-2 text-sm font-medium text-gray-700">
                    My Opportunities
                  </div>
              <div className="ml-4 space-y-1">
                <Link 
                  href="/browse-campaigns"
                  className={`block px-3 py-2 rounded-md text-sm ${
                    location === "/browse-campaigns"
                      ? "text-primary bg-primary/10"
                      : "text-gray-600"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Campaign Opportunities
                </Link>
                <Link 
                  href="/volunteer"
                  className={`block px-3 py-2 rounded-md text-sm ${
                    location === "/volunteer"
                      ? "text-primary bg-primary/10"
                      : "text-gray-600"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Volunteer Opportunities
                </Link>
              </div>

              {/* My Campaigns - Mobile */}
              <div className="px-3 py-2 text-sm font-medium text-gray-700">
                My Campaigns
              </div>
              <div className="ml-4 space-y-1">
                <Link 
                  href="/campaigns"
                  className={`block px-3 py-2 rounded-md text-sm ${
                    location === "/campaigns"
                      ? "text-primary bg-primary/10"
                      : "text-gray-600"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Campaign Overview
                </Link>
                <Link 
                  href="/volunteer-applications"
                  className={`block px-3 py-2 rounded-md text-sm ${
                    location === "/volunteer-applications"
                      ? "text-primary bg-primary/10"
                      : "text-gray-600"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Volunteer Applications
                </Link>
              </div>

                  {/* Regular Navigation Items */}
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
                </>
              )}

              {/* Admin/Support Mobile Menu */}
              {((user as any)?.isAdmin || (user as any)?.isSupport) && (
                <>
                  <div className="px-3 py-2 text-sm font-medium text-gray-700">
                    Admin Functions
                  </div>
                  <div className="ml-4 space-y-1">
                    <Link 
                      href="/admin?tab=insights"
                      className={`block px-3 py-2 rounded-md text-sm ${
                        location === "/admin" && (window.location.search.includes('tab=insights') || !window.location.search)
                          ? "text-primary bg-primary/10"
                          : "text-gray-600"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Insights
                    </Link>
                    <Link 
                      href="/admin?tab=kyc"
                      className={`block px-3 py-2 rounded-md text-sm ${
                        location === "/admin" && window.location.search.includes('tab=kyc')
                          ? "text-primary bg-primary/10"
                          : "text-gray-600"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      KYC
                    </Link>
                    <Link 
                      href="/admin?tab=campaigns"
                      className={`block px-3 py-2 rounded-md text-sm ${
                        location === "/admin" && window.location.search.includes('tab=campaigns')
                          ? "text-primary bg-primary/10"
                          : "text-gray-600"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Campaigns
                    </Link>
                    <Link 
                      href="/admin?tab=volunteers"
                      className={`block px-3 py-2 rounded-md text-sm ${
                        location === "/admin" && window.location.search.includes('tab=volunteers')
                          ? "text-primary bg-primary/10"
                          : "text-gray-600"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Volunteers
                    </Link>
                    <Link 
                      href="/admin?tab=reports"
                      className={`block px-3 py-2 rounded-md text-sm ${
                        location === "/admin" && window.location.search.includes('tab=reports')
                          ? "text-primary bg-primary/10"
                          : "text-gray-600"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Reports
                    </Link>
                    <Link 
                      href="/admin?tab=financial"
                      className={`block px-3 py-2 rounded-md text-sm ${
                        location === "/admin" && window.location.search.includes('tab=financial')
                          ? "text-primary bg-primary/10"
                          : "text-gray-600"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Financial
                    </Link>
                    {(user as any)?.isAdmin && (
                      <>
                        <Link 
                          href="/admin?tab=access"
                          className={`block px-3 py-2 rounded-md text-sm ${
                            location === "/admin" && window.location.search.includes('tab=access')
                              ? "text-primary bg-primary/10"
                              : "text-gray-600"
                          }`}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Access
                        </Link>
                        <Link 
                          href="/admin?tab=invite"
                          className={`block px-3 py-2 rounded-md text-sm ${
                            location === "/admin" && window.location.search.includes('tab=invite')
                              ? "text-primary bg-primary/10"
                              : "text-gray-600"
                          }`}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Invite
                        </Link>
                      </>
                    )}
                  </div>
                </>
              )}

              {/* Wallet Balance for regular users only, not admin/support */}
              {user && !(user as any)?.isAdmin && !(user as any)?.isSupport && (
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
