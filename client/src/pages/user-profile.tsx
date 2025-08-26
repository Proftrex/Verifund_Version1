import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, User, Shield, DollarSign, Flag, Clock } from "lucide-react";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";

export default function UserProfile() {
  const { userId } = useParams();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Only allow admins and support to view user profiles
  const isAdminOrSupport = (user as any)?.isAdmin === true || (user as any)?.isSupport === true;

  const { data: userProfile, isLoading, error } = useQuery({
    queryKey: [`/api/admin/users/${userId}`],
    enabled: isAdminOrSupport && !!userId,
  });

  // Additional queries for comprehensive user data
  const { data: userCampaigns } = useQuery({
    queryKey: [`/api/admin/creator/${userId}/profile`],
    enabled: isAdminOrSupport && !!userId,
  });

  const { data: userTransactions } = useQuery({
    queryKey: [`/api/admin/users/${userId}/transactions`],
    enabled: false, // We'll add this endpoint later if needed
  });

  const profile = userProfile as any;

  if (!isAdminOrSupport) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">You don't have permission to view user profiles.</p>
            <Link href="/">
              <Button>Return Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-gray-200 rounded"></div>
                <div className="h-48 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-6">
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-48 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">User Not Found</h2>
            <p className="text-gray-600 mb-4">The user profile you're looking for doesn't exist.</p>
            <Button onClick={() => setLocation('/admin')} className="mr-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayName = `${profile?.firstName || 'Anonymous'} ${profile?.lastName || 'User'}`.trim();
  const initials = `${profile?.firstName?.[0] || 'U'}${profile?.lastName?.[0] || ''}`;
  
  const getKycStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadge = (isSuspended: boolean, isFlagged: boolean) => {
    if (isSuspended) return <Badge variant="destructive">Suspended</Badge>;
    if (isFlagged) return <Badge variant="outline" className="border-orange-500 text-orange-700">Flagged</Badge>;
    return <Badge variant="secondary">Active</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="mb-6">
          <Button 
            onClick={() => setLocation('/admin')} 
            variant="ghost" 
            className="mb-4"
            data-testid="button-back-admin"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin Panel
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
          <p className="text-gray-600">Administrative view of user information</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-400 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                    {profile.profilePictureUrl ? (
                      <img 
                        src={profile.profilePictureUrl} 
                        alt="Profile" 
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2" data-testid="text-user-name">
                      {displayName}
                    </h2>
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline" data-testid="text-user-id">
                        ID: {profile.userDisplayId || userId}
                      </Badge>
                      <Badge className={getKycStatusColor(profile.kycStatus)} data-testid="badge-kyc-status">
                        <Shield className="w-3 h-3 mr-1" />
                        KYC {profile.kycStatus || 'Not Started'}
                      </Badge>
                      {getStatusBadge(profile.isSuspended, profile.isFlagged)}
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Member since {profile.createdAt ? format(new Date(profile.createdAt), 'MMMM yyyy') : 'Unknown'}</p>
                      {profile.pusoBalance !== undefined && (
                        <p className="flex items-center gap-1 mt-1">
                          <DollarSign className="w-3 h-3" />
                          PUSO Balance: ₱{profile.pusoBalance.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-sm" data-testid="text-user-email">{profile.email || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-sm" data-testid="text-user-phone">{profile.contactNumber || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Address</label>
                    <p className="text-sm" data-testid="text-user-address">{profile.address || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Birthday</label>
                    <p className="text-sm" data-testid="text-user-birthday">
                      {profile.birthday ? format(new Date(profile.birthday), 'MMMM dd, yyyy') : 'Not provided'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Education</label>
                    <p className="text-sm">{profile.education || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Middle Initial</label>
                    <p className="text-sm">{profile.middleInitial || 'Not provided'}</p>
                  </div>
                  {profile.credibilityScore !== undefined && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Credibility Score</label>
                      <p className="text-sm font-semibold">{profile.credibilityScore}/100</p>
                    </div>
                  )}
                  {profile.volunteerScore !== undefined && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Volunteer Score</label>
                      <p className="text-sm font-semibold">{profile.volunteerScore}/100</p>
                    </div>
                  )}
                </div>
                
                {profile.funFacts && profile.funFacts.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Fun Facts</label>
                    <ul className="text-sm list-disc list-inside space-y-1">
                      {profile.funFacts.map((fact: string, index: number) => (
                        <li key={index}>{fact}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* User Campaigns */}
            {profile.campaigns && profile.campaigns.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Flag className="w-5 h-5" />
                    User Campaigns ({profile.campaigns.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {profile.campaigns.slice(0, 3).map((campaign: any) => (
                      <div key={campaign.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{campaign.title}</p>
                          <p className="text-xs text-gray-500">
                            Goal: ₱{campaign.goal?.toLocaleString()} | 
                            Raised: ₱{campaign.totalRaised?.toLocaleString() || 0} | 
                            Status: {campaign.status}
                          </p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(`/campaigns/${campaign.id}`, '_blank')}
                        >
                          View
                        </Button>
                      </div>
                    ))}
                    {profile.campaigns.length > 3 && (
                      <p className="text-xs text-gray-500 text-center">
                        And {profile.campaigns.length - 3} more campaigns...
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Financial Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Financial Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">PUSO Balance</p>
                    <p className="text-lg font-bold text-green-600">
                      ₱{(profile.pusoBalance || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Contributions</p>
                    <p className="text-lg font-bold text-blue-600">
                      ₱{(profile.contributionsBalance || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                {userCampaigns && (
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Creator Credibility</span>
                      <span className="font-medium">{(userCampaigns as any)?.averageRating || 0}/5 ⭐</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Ratings</span>
                      <span>{(userCampaigns as any)?.totalRatings || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Social Score</span>
                      <span>{(userCampaigns as any)?.socialScore || 0}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="w-5 h-5" />
                  Account Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.isSuspended && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800 font-medium">
                      <Flag className="w-4 h-4" />
                      Account Suspended
                    </div>
                    {profile.suspensionReason && (
                      <p className="text-sm text-red-700 mt-1">
                        Reason: {profile.suspensionReason}
                      </p>
                    )}
                  </div>
                )}
                
                {profile.isFlagged && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2 text-orange-800 font-medium">
                      <Flag className="w-4 h-4" />
                      Account Flagged
                    </div>
                    {profile.flagReason && (
                      <p className="text-sm text-orange-700 mt-1">
                        Reason: {profile.flagReason}
                      </p>
                    )}
                  </div>
                )}
                
                {!profile.isSuspended && !profile.isFlagged && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800 font-medium">
                      <Shield className="w-4 h-4" />
                      Account in Good Standing
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      No issues reported
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {profile.reportsCount !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Reports Filed</span>
                    <span className="font-semibold">{profile.reportsCount}</span>
                  </div>
                )}
                {profile.volunteerHours !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Volunteer Hours</span>
                    <span className="font-semibold">{profile.volunteerHours}</span>
                  </div>
                )}
                {profile.volunteerApplicationsCount !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Volunteer Applications</span>
                    <span className="font-semibold">{profile.volunteerApplicationsCount}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activity History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span>Member since</span>
                      <span>{profile.createdAt ? format(new Date(profile.createdAt), 'MMM dd, yyyy') : 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span>Last login</span>
                      <span>{profile.lastLoginAt ? format(new Date(profile.lastLoginAt), 'MMM dd, yyyy') : 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span>Total campaigns</span>
                      <span>{profile.campaigns?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span>Account notifications</span>
                      <span>{profile.notificationsCount || 0}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Admin Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Admin Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Flag className="w-4 h-4 mr-2" />
                  Flag Account
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Clock className="w-4 h-4 mr-2" />
                  View Activity Log
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}