import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, 
  TrendingUp, 
  DollarSign,
  FileText,
  Shield,
  UserPlus,
  Flag,
  MessageSquare,
  BookOpen,
  Settings,
  Target,
  Star,
  Award,
  BarChart3,
  Crown,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  UserX,
  Heart,
  BarChart,
  Check,
  X,
  Camera,
  ThumbsUp
} from "lucide-react";
import type { User } from "@shared/schema";
import verifundLogoV2 from "@assets/VeriFund v2-03_1756102873849.png";
import { ObjectUploader } from "@/components/ObjectUploader";

// Real-time Admin Milestones Component
function AdminMilestones() {
  const { data: milestonesData, isLoading } = useQuery({
    queryKey: ['/api/admin/milestones'],
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
  });

  const getIcon = (iconName: string) => {
    const icons = {
      CheckCircle,
      ThumbsUp,
      Users,
      Crown,
      Award,
      Clock
    };
    const IconComponent = icons[iconName as keyof typeof icons] || CheckCircle;
    return IconComponent;
  };

  const getBorderColor = (achieved: boolean, progress: number, target: number) => {
    if (achieved) return 'border-green-200';
    if (progress > 0) return 'border-yellow-200';
    return 'border-gray-200';
  };

  const getIconColor = (achieved: boolean, progress: number) => {
    if (achieved) return 'text-green-500';
    if (progress > 0) return 'text-yellow-500';
    return 'text-gray-400';
  };

  const getBadge = (achieved: boolean, progress: number, target: number) => {
    if (achieved) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
          Achieved
        </Badge>
      );
    }
    if (progress > 0) {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 text-xs">
          {progress}/{target}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-gray-50 text-gray-500 text-xs">
        0/{target}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm animate-pulse">
            <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="w-16 h-6 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const milestones = milestonesData?.milestones || [];

  return (
    <div className="space-y-3">
      {milestones.map((milestone: any) => {
        const IconComponent = getIcon(milestone.icon);
        return (
          <div 
            key={milestone.id}
            className={`flex items-center gap-3 p-3 bg-white rounded-lg border shadow-sm ${getBorderColor(milestone.achieved, milestone.progress, milestone.target)} ${!milestone.achieved && milestone.progress === 0 ? 'opacity-60' : ''}`}
          >
            <div className="flex-shrink-0">
              <IconComponent className={`h-6 w-6 ${getIconColor(milestone.achieved, milestone.progress)}`} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-800 text-sm">{milestone.title}</p>
              <p className="text-xs text-gray-500">{milestone.description}</p>
              {milestone.progress > 0 && !milestone.achieved && (
                <div className="mt-1">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-yellow-500 h-1.5 rounded-full transition-all duration-300" 
                      style={{ width: `${(milestone.progress / milestone.target) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
            {getBadge(milestone.achieved, milestone.progress, milestone.target)}
          </div>
        );
      })}
      
      {milestonesData?.stats && (
        <div className="mt-4 p-3 bg-white rounded-lg border border-purple-200 shadow-sm">
          <h4 className="font-medium text-gray-800 text-sm mb-2">Current Stats</h4>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div>KYC Verified: <span className="font-medium text-purple-600">{milestonesData.stats.kycVerifiedCount}</span></div>
            <div>Campaigns Approved: <span className="font-medium text-purple-600">{milestonesData.stats.campaignsApprovedCount}</span></div>
            <div>Total Users: <span className="font-medium text-purple-600">{milestonesData.stats.totalUsersCount}</span></div>
            <div>Admin Since: <span className="font-medium text-purple-600">{new Date(milestonesData.stats.adminSince).toLocaleDateString()}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}

// VeriFund Main Page Component - Admin Dashboard
function VeriFundMainPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    middleInitial: '',
    lastName: '',
    contactNumber: '',
    email: '',
    birthday: '',
    address: '',
    education: '',
    funFacts: ''
  });
  const queryClient = useQueryClient();
  
  const { data: analytics } = useQuery({
    queryKey: ['/api/admin/analytics'],
    retry: false,
  });

  // Initialize form data with user data
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: (user as any)?.firstName || '',
        middleInitial: (user as any)?.middleInitial || '',
        lastName: (user as any)?.lastName || '',
        contactNumber: (user as any)?.contactNumber || (user as any)?.phoneNumber || '',
        email: (user as any)?.email || '',
        birthday: (user as any)?.birthday ? new Date((user as any).birthday).toISOString().split('T')[0] : '',
        address: (user as any)?.address || '',
        education: (user as any)?.education || '',
        funFacts: (user as any)?.funFacts || ''
      });
    }
  }, [user]);

  // Profile picture upload handlers
  const handleGetProfilePictureUpload = async () => {
    const response = await apiRequest('POST', '/api/user/profile-picture/upload');
    const data = await response.json();
    return { method: 'PUT' as const, url: data.uploadURL };
  };

  const handleProfilePictureComplete = async (files: { uploadURL: string; name: string }[]) => {
    if (files.length === 0) return;
    
    try {
      const uploadURL = files[0].uploadURL;
      const response = await apiRequest('PUT', '/api/user/profile-picture', { profileImageUrl: uploadURL });
      const updatedUser = await response.json();
      
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Profile Picture Updated",
        description: "Your profile picture has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating profile picture:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update profile picture. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Mutation to update profile
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof profileData) => {
      console.log('Submitting profile data:', data);
      const payload = {
        ...data,
        birthday: data.birthday ? data.birthday : null, // Keep as string, backend will handle conversion
        isProfileComplete: true
      };
      console.log('API payload:', payload);
      const response = await apiRequest('PUT', '/api/user/profile', payload);
      console.log('API response:', response);
      return await response.json();
    },
    onSuccess: (data) => {
      console.log('Profile update successful:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      setShowCompleteProfile(false);
      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = () => {
    console.log('Save button clicked, current profile data:', profileData);
    
    // Basic validation
    if (!profileData.firstName || !profileData.lastName || !profileData.email) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in first name, last name, and email before saving.",
        variant: "destructive",
      });
      return;
    }
    
    updateProfileMutation.mutate(profileData);
  };


  return (
    <div className="space-y-6">
      {/* Top Section: Profile Info (Left) + Milestones & Analytics (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Panel - Profile Info */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Profile Picture & Tag */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={(user as any)?.profileImageUrl} />
                  <AvatarFallback className="text-lg">
                    {(user as any)?.firstName?.[0]}{(user as any)?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={5242880} // 5MB
                  onGetUploadParameters={handleGetProfilePictureUpload}
                  onComplete={handleProfilePictureComplete}
                  buttonClassName="absolute -bottom-1 -right-1 h-6 w-6 rounded-full p-0 text-xs"
                >
                  <Camera className="h-3 w-3" />
                </ObjectUploader>
              </div>
              <div>
                <h3 className="font-semibold text-lg">{(user as any)?.firstName} {(user as any)?.lastName}</h3>
                <Badge variant={(user as any)?.isAdmin ? "default" : "secondary"} className="mt-1">
                  {(user as any)?.isAdmin ? "Admin" : "Support"}
                </Badge>
                <p className="text-xs text-gray-500 mt-1">Click camera to edit profile picture</p>
              </div>
            </div>
            
            {/* Complete Profile Link */}
            <div className="pt-2">
              <button
                onClick={() => setShowCompleteProfile(!showCompleteProfile)}
                className="text-blue-600 hover:text-blue-800 underline text-sm font-medium transition-colors"
                data-testid="button-complete-profile"
              >
                Complete Profile
              </button>
            </div>

            {/* Complete Profile Form */}
            {showCompleteProfile && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                <h4 className="font-semibold text-sm mb-4 text-gray-800">Complete Your Profile Information</h4>
                <div className="space-y-4">
                  {/* Name Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">First Name</label>
                      <Input 
                        placeholder="Enter first name" 
                        value={profileData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className="text-sm"
                        data-testid="input-first-name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Middle Initial <span className="text-gray-400">(optional)</span></label>
                      <Input 
                        placeholder="M.I." 
                        value={profileData.middleInitial}
                        onChange={(e) => handleInputChange('middleInitial', e.target.value)}
                        className="text-sm"
                        maxLength={2}
                        data-testid="input-middle-initial"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Last Name</label>
                      <Input 
                        placeholder="Enter last name" 
                        value={profileData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className="text-sm"
                        data-testid="input-last-name"
                      />
                    </div>
                  </div>

                  {/* Contact & Email */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Contact Number</label>
                      <Input 
                        placeholder="+63 XXX XXX XXXX" 
                        value={profileData.contactNumber}
                        onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                        className="text-sm"
                        data-testid="input-contact-number"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Email Address</label>
                      <Input 
                        placeholder="email@example.com" 
                        value={profileData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="text-sm"
                        data-testid="input-email"
                      />
                    </div>
                  </div>

                  {/* Birthday */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Birthday</label>
                    <Input 
                      type="date" 
                      value={profileData.birthday}
                      onChange={(e) => handleInputChange('birthday', e.target.value)}
                      className="text-sm"
                      data-testid="input-birthday"
                    />
                  </div>

                  {/* Complete Address */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Complete Address</label>
                    <Input 
                      placeholder="Street, Barangay, City, Province, ZIP Code" 
                      value={profileData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="text-sm"
                      data-testid="input-address"
                    />
                  </div>

                  {/* Education Background */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Education Background</label>
                    <Input 
                      placeholder="Degree, School/University, Year" 
                      value={profileData.education}
                      onChange={(e) => handleInputChange('education', e.target.value)}
                      className="text-sm"
                      data-testid="input-education"
                    />
                  </div>

                  {/* Fun Facts */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Fun Facts about Me</label>
                    <Input 
                      placeholder="Share something interesting about yourself..." 
                      value={profileData.funFacts}
                      onChange={(e) => handleInputChange('funFacts', e.target.value)}
                      className="text-sm"
                      data-testid="input-fun-facts"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      className="text-xs" 
                      onClick={handleSaveProfile}
                      disabled={updateProfileMutation.isPending}
                      data-testid="button-save-profile"
                    >
                      {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs"
                      onClick={() => setShowCompleteProfile(false)}
                      data-testid="button-cancel-profile"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Basic Profile Details */}
            {!showCompleteProfile && (
              <div className="space-y-3 pt-4 border-t">
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div><span className="font-medium text-gray-600">Full Name:</span> {(user as any)?.firstName} {(user as any)?.middleInitial ? `${(user as any).middleInitial}.` : ''} {(user as any)?.lastName}</div>
                  <div><span className="font-medium text-gray-600">Email:</span> {(user as any)?.email || 'Not specified'}</div>
                  <div><span className="font-medium text-gray-600">Contact:</span> {(user as any)?.contactNumber || (user as any)?.phoneNumber || 'Not specified'}</div>
                  <div><span className="font-medium text-gray-600">Birthday:</span> {(user as any)?.birthday ? new Date((user as any).birthday).toLocaleDateString() : 'Not specified'}</div>
                  <div><span className="font-medium text-gray-600">Address:</span> {(user as any)?.address || 'Not specified'}</div>
                  <div><span className="font-medium text-gray-600">Education:</span> {(user as any)?.education || 'Not specified'}</div>
                  <div><span className="font-medium text-gray-600">Fun Facts:</span> {(user as any)?.funFacts || 'Not specified'}</div>
                  <div><span className="font-medium text-gray-600">Join Date:</span> {(user as any)?.createdAt ? new Date((user as any).createdAt).toLocaleDateString() : 'Not specified'}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Panel - Real-time Milestones */}
        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <Star className="h-5 w-5 text-purple-600" />
              Milestones Achievement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AdminMilestones />
          </CardContent>
        </Card>
      </div>

      {/* Analytics Section - Separate row */}
      <div className="mt-6">
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Platform Analytics Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* User Management Analytics */}
              <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <h5 className="font-semibold text-sm text-blue-800">User Management</h5>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Verified Users</span>
                    <span className="font-medium text-blue-700">{analytics?.verifiedUsers || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Suspended Accounts</span>
                    <span className="font-medium text-red-600">{analytics?.suspendedUsers || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pending KYC</span>
                    <span className="font-medium text-yellow-600">{analytics?.pendingKYC || '0'}</span>
                  </div>
                </div>
              </div>

              {/* Reports Analytics */}
              <div className="bg-white p-4 rounded-lg border border-green-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  <h5 className="font-semibold text-sm text-green-800">Reports</h5>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Volunteer Reports</span>
                    <span className="font-medium text-green-700">{analytics?.volunteerReports || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Creator Reports</span>
                    <span className="font-medium text-green-700">{analytics?.creatorReports || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fraud Reports</span>
                    <span className="font-medium text-red-600">{analytics?.fraudReports || '0'}</span>
                  </div>
                </div>
              </div>

              {/* Financial Analytics */}
              <div className="bg-white p-4 rounded-lg border border-emerald-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  <h5 className="font-semibold text-sm text-emerald-800">Financial</h5>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Deposits</span>
                    <span className="font-medium text-emerald-700">{analytics?.deposits || '₱0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Withdrawals</span>
                    <span className="font-medium text-emerald-700">{analytics?.withdrawals || '₱0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Contributions</span>
                    <span className="font-medium text-emerald-700">{analytics?.totalContributions || '₱0'}</span>
                  </div>
                </div>
              </div>

              {/* Platform Activity */}
              <div className="bg-white p-4 rounded-lg border border-purple-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <h5 className="font-semibold text-sm text-purple-800">Activity</h5>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Campaigns</span>
                    <span className="font-medium text-purple-700">{analytics?.activeCampaigns || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tips Collected</span>
                    <span className="font-medium text-purple-700">{analytics?.totalTips || '₱0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Claims Processed</span>
                    <span className="font-medium text-purple-700">{analytics?.claimsProcessed || '0'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Analytics Summary */}
            <div className="mt-4 pt-4 border-t border-blue-100">
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-600">System Health: </span>
                  <span className="font-medium text-green-600">Excellent</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">Response Time: </span>
                  <span className="font-medium text-green-600">Fast</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-600">Load: </span>
                  <span className="font-medium text-yellow-600">Moderate</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section: 3 Real Leaderboard Panels Side by Side */}
      <AdminLeaderboards />
    </div>
  );
}

// Real Admin Leaderboards Component
function AdminLeaderboards() {
  const { data: leaderboards, isLoading } = useQuery({
    queryKey: ['/api/admin/leaderboards'],
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base animate-pulse">
                <div className="w-6 h-6 bg-gray-200 rounded"></div>
                <div className="w-32 h-4 bg-gray-200 rounded"></div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="flex justify-between items-center text-sm py-1 animate-pulse">
                    <div className="w-24 h-3 bg-gray-200 rounded"></div>
                    <div className="w-8 h-3 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* KYC Evaluations Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            🏆 Most KYC Evaluations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {leaderboards?.kycEvaluations?.length > 0 ? (
              leaderboards.kycEvaluations.map((admin: any, index: number) => (
                <div 
                  key={admin.id} 
                  className={`flex justify-between items-center text-sm py-1 px-2 rounded ${
                    admin.isCurrentUser ? 'bg-blue-50 border border-blue-200' : ''
                  }`}
                >
                  <span className={`${admin.isCurrentUser ? 'font-medium text-blue-700' : 'text-gray-600'}`}>
                    #{index + 1} {admin.name}
                    {admin.isCurrentUser && ' (You)'}
                  </span>
                  <span className="font-medium">{admin.count}</span>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500 text-center py-4">
                No KYC evaluations yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reports Accommodated Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            📋 Most Reports Accommodated
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {leaderboards?.reportsAccommodated?.length > 0 ? (
              leaderboards.reportsAccommodated.map((admin: any, index: number) => (
                <div 
                  key={admin.id} 
                  className={`flex justify-between items-center text-sm py-1 px-2 rounded ${
                    admin.isCurrentUser ? 'bg-green-50 border border-green-200' : ''
                  }`}
                >
                  <span className={`${admin.isCurrentUser ? 'font-medium text-green-700' : 'text-gray-600'}`}>
                    #{index + 1} {admin.name}
                    {admin.isCurrentUser && ' (You)'}
                  </span>
                  <span className="font-medium">{admin.count}</span>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500 text-center py-4">
                Report system coming soon
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Fastest Resolve Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            ⚡ Fastest to Resolve Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {leaderboards?.fastestResolve?.length > 0 ? (
              leaderboards.fastestResolve.map((admin: any, index: number) => (
                <div 
                  key={admin.id} 
                  className={`flex justify-between items-center text-sm py-1 px-2 rounded ${
                    admin.isCurrentUser ? 'bg-purple-50 border border-purple-200' : ''
                  }`}
                >
                  <span className={`${admin.isCurrentUser ? 'font-medium text-purple-700' : 'text-gray-600'}`}>
                    #{index + 1} {admin.name}
                    {admin.isCurrentUser && ' (You)'}
                  </span>
                  <span className="font-medium">{admin.avgTime}</span>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500 text-center py-4">
                Report timing coming soon
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// My Works Section Component - Section 2
function MyWorksSection() {
  const [activeTab, setActiveTab] = useState("pending-kyc");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: analytics } = useQuery({
    queryKey: ['/api/admin/my-works/analytics'],
    retry: false,
  });

  const { data: claimedKyc = [] } = useQuery({
    queryKey: ['/api/admin/my-works/kyc-claimed'],
    retry: false,
  });

  const { data: claimedReports = [] } = useQuery({
    queryKey: ['/api/admin/my-works/reports-claimed'],
    retry: false,
  });

  const { data: claimedCampaigns = [] } = useQuery({
    queryKey: ['/api/admin/my-works/campaigns'],
    retry: false,
  });

  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [approvalDialog, setApprovalDialog] = useState<{
    open: boolean;
    type: 'approve' | 'reject' | null;
    itemId: string;
    itemType: 'kyc' | 'campaign' | 'report';
    reason: string;
    customReason: string;
  }>({
    open: false,
    type: null,
    itemId: '',
    itemType: 'kyc',
    reason: '',
    customReason: ''
  });

  const approvalReasons = {
    approve: {
      kyc: [
        "All documents verified and authentic",
        "Identity confirmed through verification process",
        "Meets all KYC requirements",
        "Additional verification completed successfully"
      ],
      campaign: [
        "Campaign meets all platform guidelines",
        "Legitimate fundraising purpose confirmed",
        "Creator verification completed",
        "All required documentation provided"
      ],
      report: [
        "Report resolved - no violations found",
        "Issue addressed and corrected",
        "Valid concern resolved satisfactorily"
      ]
    },
    reject: {
      kyc: [
        "Invalid or fraudulent documents submitted",
        "Identity verification failed",
        "Incomplete documentation provided",
        "Suspicious activity detected",
        "Does not meet platform requirements"
      ],
      campaign: [
        "Violates platform community guidelines",
        "Insufficient or misleading information",
        "Duplicate or spam campaign",
        "Inappropriate content or purpose",
        "Missing required documentation"
      ],
      report: [
        "Report confirmed - violations found",
        "Policy violation identified",
        "Requires further investigation",
        "Immediate action required"
      ]
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const openApprovalDialog = (type: 'approve' | 'reject', itemId: string, itemType: 'kyc' | 'campaign' | 'report') => {
    setApprovalDialog({
      open: true,
      type,
      itemId,
      itemType,
      reason: '',
      customReason: ''
    });
  };

  const closeApprovalDialog = () => {
    setApprovalDialog({
      open: false,
      type: null,
      itemId: '',
      itemType: 'kyc',
      reason: '',
      customReason: ''
    });
  };

  // Approval/Rejection mutations
  const approveItemMutation = useMutation({
    mutationFn: async ({ itemId, itemType, reason }: { itemId: string; itemType: string; reason: string }) => {
      const endpoint = itemType === 'kyc' ? `/api/admin/kyc/${itemId}/approve` : `/api/admin/campaigns/${itemId}/approve`;
      return apiRequest(endpoint, 'POST', { reason });
    },
    onSuccess: () => {
      toast({
        title: "Approved Successfully",
        description: "The request has been approved.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/kyc-claimed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/campaigns'] });
      closeApprovalDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Approval Failed",
        description: "Failed to approve the request. Please try again.",
        variant: "destructive",
      });
    }
  });

  const rejectItemMutation = useMutation({
    mutationFn: async ({ itemId, itemType, reason }: { itemId: string; itemType: string; reason: string }) => {
      const endpoint = itemType === 'kyc' ? `/api/admin/kyc/${itemId}/reject` : `/api/admin/campaigns/${itemId}/reject`;
      return apiRequest(endpoint, 'POST', { reason });
    },
    onSuccess: () => {
      toast({
        title: "Rejected Successfully",
        description: "The request has been rejected.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/kyc-claimed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/campaigns'] });
      closeApprovalDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Rejection Failed",
        description: "Failed to reject the request. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleApprovalSubmit = () => {
    const finalReason = approvalDialog.reason === 'custom' ? approvalDialog.customReason : approvalDialog.reason;
    
    if (!finalReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please select or enter a reason for your decision.",
        variant: "destructive",
      });
      return;
    }

    if (approvalDialog.type === 'approve') {
      approveItemMutation.mutate({
        itemId: approvalDialog.itemId,
        itemType: approvalDialog.itemType,
        reason: finalReason
      });
    } else {
      rejectItemMutation.mutate({
        itemId: approvalDialog.itemId,
        itemType: approvalDialog.itemType,
        reason: finalReason
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="text-center pb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">My Works</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Track and manage all your claimed assignments including KYC verifications, reports reviews, 
          and various administrative tasks. Monitor your productivity and claimed workload.
        </p>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 text-blue-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">KYC</p>
            <p className="text-xl font-bold">{analytics?.kyc || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Document Reports</p>
            <p className="text-xl font-bold">{analytics?.documents || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-6 w-6 text-purple-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Creator Reports</p>
            <p className="text-xl font-bold">{analytics?.campaigns || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 text-orange-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Volunteer Reports</p>
            <p className="text-xl font-bold">{analytics?.volunteers || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Flag className="h-6 w-6 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">User Reports</p>
            <p className="text-xl font-bold">{analytics?.userReports || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Transaction Reports</p>
            <p className="text-xl font-bold">{analytics?.financial || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tab Section for Claimed Items */}
      <Card>
        <CardHeader>
          <CardTitle>Claimed Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7">
              <TabsTrigger value="pending-kyc">Pending KYC</TabsTrigger>
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="document-reports">Document Reports</TabsTrigger>
              <TabsTrigger value="creator-reports">Creator Reports</TabsTrigger>
              <TabsTrigger value="volunteer-reports">Volunteer Reports</TabsTrigger>
              <TabsTrigger value="user-reports">User Reports</TabsTrigger>
              <TabsTrigger value="transaction-reports">Transaction Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="pending-kyc" className="mt-4">
              <div className="space-y-3">
                {claimedKyc.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No pending KYC requests claimed</p>
                ) : (
                  claimedKyc.map((kyc: any) => (
                    <div key={kyc.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{kyc.firstName} {kyc.lastName}</h4>
                          <p className="text-sm text-gray-600">User ID: {kyc.userDisplayId}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{kyc.status}</Badge>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => toggleExpanded(kyc.id)}
                          >
                            {expandedItems.includes(kyc.id) ? "Hide Details" : "View Details"}
                          </Button>
                        </div>
                      </div>
                      {expandedItems.includes(kyc.id) && (
                        <div className="mt-3 pt-3 border-t space-y-4">
                          {/* Comprehensive User Profile Information */}
                          <div className="bg-gray-50 rounded-lg p-4 space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                              {/* Profile Information */}
                              <div>
                                <h4 className="font-semibold mb-3 text-green-700">Personal Information</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center gap-3 mb-3">
                                    <Avatar className="h-12 w-12">
                                      <AvatarImage src={kyc.profileImageUrl} />
                                      <AvatarFallback>{kyc.firstName?.[0]}{kyc.lastName?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-medium">{kyc.firstName} {kyc.middleInitial && kyc.middleInitial + '. '}{kyc.lastName}</p>
                                      <p className="text-gray-600">{kyc.email}</p>
                                    </div>
                                  </div>
                                  <p><strong>User ID:</strong> {kyc.userDisplayId || kyc.id}</p>
                                  <p><strong>Contact Number:</strong> {kyc.contactNumber || kyc.phoneNumber || 'Not provided'}</p>
                                  <p><strong>Address:</strong> {kyc.address || 'Not provided'}</p>
                                  <p><strong>Birthday:</strong> {kyc.birthday ? new Date(kyc.birthday).toLocaleDateString() : 'Not provided'}</p>
                                  <p><strong>Registration Date:</strong> {new Date(kyc.createdAt).toLocaleDateString()}</p>
                                  <p><strong>KYC Status:</strong> <Badge variant={kyc.kycStatus === 'verified' ? 'default' : kyc.kycStatus === 'pending' ? 'secondary' : 'destructive'}>{kyc.kycStatus || 'pending'}</Badge></p>
                                </div>
                              </div>

                              {/* Professional & Additional Information */}
                              <div>
                                <h4 className="font-semibold mb-3 text-blue-700">Professional Details</h4>
                                <div className="space-y-2 text-sm">
                                  <p><strong>Education:</strong> {kyc.education || 'Not provided'}</p>
                                  <p><strong>Profession:</strong> {kyc.profession || 'Not provided'}</p>
                                  <p><strong>Work Experience:</strong> {kyc.workExperience || 'Not provided'}</p>
                                  <p><strong>Organization Name:</strong> {kyc.organizationName || 'Not provided'}</p>
                                  <p><strong>Organization Type:</strong> {kyc.organizationType || 'Not provided'}</p>
                                  <p><strong>LinkedIn Profile:</strong> {kyc.linkedinProfile ? (<a href={kyc.linkedinProfile} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Profile</a>) : 'Not provided'}</p>
                                  <p><strong>Fun Facts:</strong> {kyc.funFacts || 'Not provided'}</p>
                                </div>
                              </div>
                            </div>

                            {/* Account Activity & Platform Information */}
                            <div className="grid md:grid-cols-2 gap-6 pt-4 border-t">
                              <div>
                                <h4 className="font-semibold mb-3 text-purple-700">Platform Activity</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between items-center">
                                    <span>Creator Rating:</span>
                                    <div className="flex items-center gap-1">
                                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                      <span className="font-medium">{kyc.creatorRating || '0.0'}</span>
                                    </div>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span>Credit Score:</span>
                                    <Badge variant="outline">{kyc.creditScore || '0'}</Badge>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span>Reliability Score:</span>
                                    <Badge variant="outline">{kyc.reliabilityScore || '0'}</Badge>
                                  </div>
                                  <p><strong>Account Balance:</strong> ₱{parseFloat(kyc.pusoBalance || '0').toLocaleString()}</p>
                                </div>
                              </div>

                              <div>
                                <h4 className="font-semibold mb-3 text-orange-700">Verification Details</h4>
                                <div className="space-y-2 text-sm">
                                  <p><strong>Profile Complete:</strong> <Badge variant={kyc.isProfileComplete ? 'default' : 'secondary'}>{kyc.isProfileComplete ? 'Yes' : 'No'}</Badge></p>
                                  <p><strong>Email Verified:</strong> <Badge variant={kyc.emailVerified ? 'default' : 'secondary'}>{kyc.emailVerified ? 'Yes' : 'No'}</Badge></p>
                                  <p><strong>Phone Verified:</strong> <Badge variant={kyc.phoneVerified ? 'default' : 'secondary'}>{kyc.phoneVerified ? 'Yes' : 'No'}</Badge></p>
                                  <p><strong>Submitted:</strong> {new Date(kyc.createdAt).toLocaleDateString()}</p>
                                  {kyc.processedByAdmin && (
                                    <p><strong>Processed By:</strong> {kyc.processedByAdmin}</p>
                                  )}
                                  {kyc.processedAt && (
                                    <p><strong>Processed Date:</strong> {new Date(kyc.processedAt).toLocaleDateString()}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Approve/Reject Actions */}
                          <div className="flex gap-2 pt-2 border-t">
                            <Button 
                              size="sm" 
                              variant="default"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => openApprovalDialog('approve', kyc.id, 'kyc')}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => openApprovalDialog('reject', kyc.id, 'kyc')}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="campaigns" className="mt-4">
              <div className="space-y-3">
                {claimedCampaigns.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No campaign requests claimed</p>
                ) : (
                  claimedCampaigns.map((campaign: any) => (
                    <div key={campaign.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{campaign.title}</h4>
                          <p className="text-sm text-gray-600">Campaign ID: {campaign.campaignDisplayId || `CAM-${campaign.id.slice(0, 6)}`}</p>
                          <p className="text-sm text-gray-500">Creator: {campaign.creator?.firstName} {campaign.creator?.lastName}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{campaign.status}</Badge>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => toggleExpanded(campaign.id)}
                          >
                            {expandedItems.includes(campaign.id) ? "Hide Details" : "View Details"}
                          </Button>
                        </div>
                      </div>
                      {expandedItems.includes(campaign.id) && (
                        <div className="mt-3 pt-3 border-t space-y-3">
                          <div className="text-sm text-gray-600 space-y-1">
                            <p><strong>Description:</strong> {campaign.description}</p>
                            <p><strong>Goal Amount:</strong> ₱{parseFloat(campaign.goalAmount).toLocaleString()}</p>
                            <p><strong>Category:</strong> {campaign.category}</p>
                            <p><strong>Location:</strong> {[campaign.city, campaign.province].filter(Boolean).join(', ')}</p>
                            <p><strong>Claimed:</strong> {new Date(campaign.claimedAt).toLocaleDateString()}</p>
                            <p><strong>Created:</strong> {new Date(campaign.createdAt).toLocaleDateString()}</p>
                          </div>
                          
                          {/* Approve/Reject Actions */}
                          <div className="flex gap-2 pt-2 border-t">
                            <Button 
                              size="sm" 
                              variant="default"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => openApprovalDialog('approve', campaign.id, 'campaign')}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => openApprovalDialog('reject', campaign.id, 'campaign')}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="document-reports" className="mt-4">
              <div className="space-y-3">
                {claimedReports.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No document reports claimed</p>
                ) : (
                  claimedReports.map((report: any) => (
                    <div key={report.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">Document Report #{report.id.slice(0, 8)}</h4>
                          <p className="text-sm text-gray-600">Type: {report.reportType || 'Document'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{report.status}</Badge>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => toggleExpanded(report.id)}
                          >
                            {expandedItems.includes(report.id) ? "Hide Details" : "View Details"}
                          </Button>
                        </div>
                      </div>
                      {expandedItems.includes(report.id) && (
                        <div className="mt-3 pt-3 border-t text-sm text-gray-600">
                          <p><strong>Description:</strong> Document verification report</p>
                          <p><strong>Priority:</strong> Normal</p>
                          <p><strong>Created:</strong> {new Date().toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="creator-reports" className="mt-4">
              <div className="space-y-3">
                <p className="text-center text-gray-500 py-8">No creator reports claimed</p>
              </div>
            </TabsContent>

            <TabsContent value="volunteer-reports" className="mt-4">
              <div className="space-y-3">
                <p className="text-center text-gray-500 py-8">No volunteer reports claimed</p>
              </div>
            </TabsContent>

            <TabsContent value="user-reports" className="mt-4">
              <div className="space-y-3">
                <p className="text-center text-gray-500 py-8">No user reports claimed</p>
              </div>
            </TabsContent>

            <TabsContent value="transaction-reports" className="mt-4">
              <div className="space-y-3">
                <p className="text-center text-gray-500 py-8">No transaction reports claimed</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Approval/Rejection Dialog */}
      <Dialog open={approvalDialog.open} onOpenChange={(open) => !open && closeApprovalDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {approvalDialog.type === 'approve' ? 'Approve' : 'Reject'} {approvalDialog.itemType === 'kyc' ? 'KYC Request' : 'Campaign Request'}
            </DialogTitle>
            <DialogDescription>
              Please select a reason for your decision. This will be recorded for audit purposes.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reason</label>
              <Select
                value={approvalDialog.reason}
                onValueChange={(value) => 
                  setApprovalDialog(prev => ({ ...prev, reason: value, customReason: '' }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason..." />
                </SelectTrigger>
                <SelectContent>
                  {approvalDialog.type && approvalDialog.itemType && 
                    approvalReasons[approvalDialog.type][approvalDialog.itemType].map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {reason}
                      </SelectItem>
                    ))
                  }
                  <SelectItem value="custom">Custom reason...</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {approvalDialog.reason === 'custom' && (
              <div>
                <label className="text-sm font-medium">Custom Reason</label>
                <Textarea
                  placeholder="Enter your custom reason..."
                  value={approvalDialog.customReason}
                  onChange={(e) => 
                    setApprovalDialog(prev => ({ ...prev, customReason: e.target.value }))
                  }
                  className="mt-1"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeApprovalDialog}>
              Cancel
            </Button>
            <Button 
              onClick={handleApprovalSubmit}
              disabled={approveItemMutation.isPending || rejectItemMutation.isPending}
              className={approvalDialog.type === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
              variant={approvalDialog.type === 'approve' ? 'default' : 'destructive'}
            >
              {(approveItemMutation.isPending || rejectItemMutation.isPending) ? 'Processing...' : 
               approvalDialog.type === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// KYC Management Section - Section 3
function KYCSection() {
  const [activeKycTab, setActiveKycTab] = useState("basic");
  const [expandedUsers, setExpandedUsers] = useState<string[]>([]);
  const { toast } = useToast();

  const { data: basicUsers = [] } = useQuery({
    queryKey: ['/api/admin/users/basic'],
    retry: false,
  });

  const { data: pendingKyc = [] } = useQuery({
    queryKey: ['/api/admin/kyc/pending'],
    retry: false,
  });

  const { data: verifiedKyc = [] } = useQuery({
    queryKey: ['/api/admin/kyc/verified'],
    retry: false,
  });

  const { data: rejectedKyc = [] } = useQuery({
    queryKey: ['/api/admin/kyc/rejected'],
    retry: false,
  });

  const { data: suspendedUsers = [] } = useQuery({
    queryKey: ['/api/admin/users/suspended'],
    retry: false,
  });

  const toggleUserExpanded = (userId: string) => {
    setExpandedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const renderUserProfile = (user: any) => (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Profile Information */}
        <div>
          <h4 className="font-semibold mb-3">Profile Information</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.profileImageUrl} />
                <AvatarFallback>{user.firstName?.[0]}{user.lastName?.[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user.firstName} {user.lastName}</p>
                <p className="text-gray-600">{user.email}</p>
              </div>
            </div>
            <p><strong>User ID:</strong> {user.userDisplayId || user.id}</p>
            <p><strong>Phone:</strong> {user.phone || 'Not provided'}</p>
            <p><strong>Address:</strong> {user.address || 'Not provided'}</p>
            <p><strong>Date of Birth:</strong> {user.dateOfBirth || 'Not provided'}</p>
            <p><strong>Registration Date:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
            <p><strong>KYC Status:</strong> <Badge variant={user.kycStatus === 'verified' ? 'default' : 'outline'}>{user.kycStatus || 'pending'}</Badge></p>
          </div>
        </div>

        {/* Platform Scores */}
        <div>
          <h4 className="font-semibold mb-3">Platform Scores</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Creator Rating:</span>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                <span className="font-medium">{user.creatorRating || '0.0'}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Credit Score:</span>
              <Badge variant="outline">{user.creditScore || '0'}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Reliability Score:</span>
              <Badge variant="outline">{user.reliabilityScore || '0'}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Social Score:</span>
              <Badge variant="outline">{user.socialScore || '0'}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Total Contributions:</span>
              <span className="font-medium">₱{user.totalContributions || '0'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* KYC Documents */}
      <div>
        <h4 className="font-semibold mb-3">KYC Documents</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-3">
            <p className="text-sm font-medium mb-2">Government ID</p>
            {user.governmentIdUrl ? (
              <img src={user.governmentIdUrl} alt="Government ID" className="w-full h-32 object-cover rounded" />
            ) : (
              <div className="w-full h-32 bg-gray-200 rounded flex items-center justify-center text-gray-500">
                No document uploaded
              </div>
            )}
          </div>
          <div className="border rounded-lg p-3">
            <p className="text-sm font-medium mb-2">Proof of Address</p>
            {user.proofOfAddressUrl ? (
              <img src={user.proofOfAddressUrl} alt="Proof of Address" className="w-full h-32 object-cover rounded" />
            ) : (
              <div className="w-full h-32 bg-gray-200 rounded flex items-center justify-center text-gray-500">
                No document uploaded
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activity Summary */}
      <div>
        <h4 className="font-semibold mb-3">Activity Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <p className="font-medium">{user.campaignsCreated || 0}</p>
            <p className="text-gray-600">Campaigns Created</p>
          </div>
          <div className="text-center">
            <p className="font-medium">{user.contributionsMade || 0}</p>
            <p className="text-gray-600">Contributions Made</p>
          </div>
          <div className="text-center">
            <p className="font-medium">{user.volunteersJoined || 0}</p>
            <p className="text-gray-600">Volunteer Activities</p>
          </div>
          <div className="text-center">
            <p className="font-medium">{user.reportsSubmitted || 0}</p>
            <p className="text-gray-600">Reports Submitted</p>
          </div>
        </div>
      </div>
    </div>
  );

  const handleClaimKyc = async (userId: string) => {
    try {
      // Add claim logic here
      toast({
        title: "KYC Request Claimed",
        description: "You have successfully claimed this KYC request for review.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to claim KYC request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderUserList = (users: any[], showKycStatus = true, showClaimButton = false) => (
    <div className="space-y-3">
      {users.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No users found</p>
      ) : (
        users.map((user: any) => (
          <div key={user.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.profileImageUrl} />
                  <AvatarFallback>{user.firstName?.[0]}{user.lastName?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-medium">{user.firstName} {user.lastName}</h4>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {showKycStatus && (
                  <Badge variant={user.kycStatus === 'verified' ? 'default' : user.kycStatus === 'rejected' ? 'destructive' : 'outline'}>
                    {user.kycStatus || 'pending'}
                  </Badge>
                )}
                {showClaimButton && (
                  <Button 
                    size="sm" 
                    variant="default"
                    onClick={() => handleClaimKyc(user.id)}
                  >
                    CLAIM
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => toggleUserExpanded(user.id)}
                >
                  {expandedUsers.includes(user.id) ? "Hide Details" : "VIEW USER DETAILS"}
                </Button>
              </div>
            </div>
            {expandedUsers.includes(user.id) && renderUserProfile(user)}
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">KYC Management</h2>
      
      {/* KYC Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-800" data-testid="stat-basic-users">
                  {basicUsers.length}
                </div>
                <div className="text-sm text-blue-600">Basic Users</div>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-800" data-testid="stat-pending-kyc">
                  {pendingKyc.length}
                </div>
                <div className="text-sm text-yellow-600">Pending KYC</div>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-800" data-testid="stat-verified-users">
                  {verifiedKyc.length}
                </div>
                <div className="text-sm text-green-600">Verified Users</div>
              </div>
              <Shield className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-800" data-testid="stat-rejected-users">
                  {rejectedKyc.length}
                </div>
                <div className="text-sm text-red-600">Rejected Users</div>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-800" data-testid="stat-suspended-users">
                  {suspendedUsers.length}
                </div>
                <div className="text-sm text-gray-600">Suspended Users</div>
              </div>
              <UserX className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeKycTab} onValueChange={setActiveKycTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Basic ({basicUsers.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({pendingKyc.length})</TabsTrigger>
              <TabsTrigger value="verified">Verified ({verifiedKyc.length})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({rejectedKyc.length})</TabsTrigger>
              <TabsTrigger value="suspended">Suspended ({suspendedUsers.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="mt-4">
              {renderUserList(basicUsers)}
            </TabsContent>

            <TabsContent value="pending" className="mt-4">
              {renderUserList(pendingKyc, true, true)}
            </TabsContent>

            <TabsContent value="verified" className="mt-4">
              {renderUserList(verifiedKyc)}
            </TabsContent>

            <TabsContent value="rejected" className="mt-4">
              {renderUserList(rejectedKyc)}
            </TabsContent>

            <TabsContent value="suspended" className="mt-4">
              {renderUserList(suspendedUsers, false)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Campaign Management Section - Section 4
function CampaignsSection() {
  const [activeCampaignTab, setActiveCampaignTab] = useState("requests");
  const [expandedCampaigns, setExpandedCampaigns] = useState<string[]>([]);
  const { toast } = useToast();

  const { data: pendingCampaigns = [] } = useQuery({
    queryKey: ['/api/admin/campaigns/pending'],
    retry: false,
  });

  const { data: activeCampaigns = [] } = useQuery({
    queryKey: ['/api/admin/campaigns/active'],
    retry: false,
  });

  const { data: inProgressCampaigns = [] } = useQuery({
    queryKey: ['/api/admin/campaigns/in-progress'],
    retry: false,
  });

  const { data: completedCampaigns = [] } = useQuery({
    queryKey: ['/api/admin/campaigns/completed'],
    retry: false,
  });

  const { data: closedCampaigns = [] } = useQuery({
    queryKey: ['/api/admin/campaigns/closed'],
    retry: false,
  });

  const { data: rejectedCampaigns = [] } = useQuery({
    queryKey: ['/api/admin/campaigns/rejected'],
    retry: false,
  });

  const toggleCampaignExpanded = (campaignId: string) => {
    setExpandedCampaigns(prev => 
      prev.includes(campaignId) 
        ? prev.filter(id => id !== campaignId)
        : [...prev, campaignId]
    );
  };

  const handleClaimCampaign = async (campaignId: string) => {
    try {
      // Add claim logic here
      toast({
        title: "Campaign Claimed",
        description: "You have successfully claimed this campaign for review.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to claim campaign. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderCreatorDetails = (creator: any) => (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
      <h5 className="font-semibold mb-3">Creator Profile</h5>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={creator?.profileImageUrl} />
              <AvatarFallback>{creator?.firstName?.[0]}{creator?.lastName?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{creator?.firstName} {creator?.lastName}</p>
              <p className="text-gray-600">{creator?.email}</p>
            </div>
          </div>
          <p><strong>User ID:</strong> {creator?.userDisplayId || creator?.id}</p>
          <p><strong>Phone:</strong> {creator?.phone || 'Not provided'}</p>
          <p><strong>KYC Status:</strong> <Badge variant={creator?.kycStatus === 'verified' ? 'default' : 'outline'}>{creator?.kycStatus || 'pending'}</Badge></p>
        </div>
        <div className="space-y-2 text-sm">
          <p><strong>Creator Rating:</strong> 
            <span className="flex items-center gap-1 ml-2">
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
              {creator?.creatorRating || '0.0'}
            </span>
          </p>
          <p><strong>Credit Score:</strong> {creator?.creditScore || '0'}</p>
          <p><strong>Campaigns Created:</strong> {creator?.campaignsCreated || 0}</p>
          <p><strong>Total Raised:</strong> ₱{creator?.totalRaised || '0'}</p>
        </div>
      </div>
    </div>
  );

  const renderCampaignDetails = (campaign: any) => (
    <div className="mt-4 p-4 bg-green-50 rounded-lg">
      <h5 className="font-semibold mb-3">Campaign Details</h5>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2 text-sm">
          <p><strong>Title:</strong> {campaign.title}</p>
          <p><strong>Category:</strong> <Badge variant="outline">{campaign.category || 'General'}</Badge></p>
          <p><strong>Goal Amount:</strong> ₱{campaign.goalAmount?.toLocaleString() || '0'}</p>
          <p><strong>Current Amount:</strong> ₱{campaign.currentAmount?.toLocaleString() || '0'}</p>
          <p><strong>Created:</strong> {new Date(campaign.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="space-y-2 text-sm">
          <p><strong>Status:</strong> <Badge variant={campaign.status === 'active' ? 'default' : 'outline'}>{campaign.status}</Badge></p>
          <p><strong>Contributors:</strong> {campaign.contributorsCount || 0}</p>
          <p><strong>End Date:</strong> {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : 'No end date'}</p>
          <p><strong>Progress:</strong> {campaign.goalAmount ? Math.round((campaign.currentAmount / campaign.goalAmount) * 100) : 0}%</p>
        </div>
      </div>
      <div className="mt-3">
        <p><strong>Description:</strong></p>
        <p className="text-sm text-gray-600 mt-1">{campaign.description?.substring(0, 200)}...</p>
      </div>
    </div>
  );

  const renderCampaignList = (campaigns: any[], showClaimButton = false) => (
    <div className="space-y-3">
      {campaigns.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No campaigns found</p>
      ) : (
        campaigns.map((campaign: any) => (
          <div key={campaign.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-medium mb-1">{campaign.title}</h4>
                <p className="text-sm text-gray-600 mb-2">{campaign.description?.substring(0, 100)}...</p>
                <div className="flex items-center gap-4 text-sm">
                  <span>Goal: ₱{campaign.goalAmount?.toLocaleString() || '0'}</span>
                  <span>Current: ₱{campaign.currentAmount?.toLocaleString() || '0'}</span>
                  <Badge variant="outline">{campaign.category || 'General'}</Badge>
                </div>
              </div>
              <div className="flex flex-col gap-2 ml-4">
                {showClaimButton && (
                  <Button 
                    size="sm" 
                    variant="default"
                    onClick={() => handleClaimCampaign(campaign.id)}
                  >
                    CLAIM
                  </Button>
                )}
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => toggleCampaignExpanded(`creator-${campaign.id}`)}
                  >
                    {expandedCampaigns.includes(`creator-${campaign.id}`) ? "Hide Creator" : "View Creator Details"}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => toggleCampaignExpanded(`campaign-${campaign.id}`)}
                  >
                    {expandedCampaigns.includes(`campaign-${campaign.id}`) ? "Hide Campaign" : "View Campaign Details"}
                  </Button>
                </div>
              </div>
            </div>
            {expandedCampaigns.includes(`creator-${campaign.id}`) && renderCreatorDetails(campaign.creator)}
            {expandedCampaigns.includes(`campaign-${campaign.id}`) && renderCampaignDetails(campaign)}
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Campaign Management</h2>
      
      {/* Campaign Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-800" data-testid="stat-pending-campaigns">
                  {pendingCampaigns.length}
                </div>
                <div className="text-sm text-yellow-600">Pending</div>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-800" data-testid="stat-active-campaigns">
                  {activeCampaigns.length}
                </div>
                <div className="text-sm text-green-600">Active</div>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-800" data-testid="stat-inprogress-campaigns">
                  {inProgressCampaigns.length}
                </div>
                <div className="text-sm text-blue-600">In Progress</div>
              </div>
              <BarChart className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-800" data-testid="stat-completed-campaigns">
                  {completedCampaigns.length}
                </div>
                <div className="text-sm text-purple-600">Completed</div>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-800" data-testid="stat-rejected-campaigns">
                  {rejectedCampaigns.length}
                </div>
                <div className="text-sm text-red-600">Rejected</div>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-800" data-testid="stat-cancelled-campaigns">
                  {closedCampaigns.length}
                </div>
                <div className="text-sm text-gray-600">Cancelled</div>
              </div>
              <XCircle className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Campaign Administration</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeCampaignTab} onValueChange={setActiveCampaignTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="requests">Pending ({pendingCampaigns.length})</TabsTrigger>
              <TabsTrigger value="active">Active ({activeCampaigns.length})</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress ({inProgressCampaigns.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({completedCampaigns.length})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({rejectedCampaigns.length})</TabsTrigger>
              <TabsTrigger value="closed">Closed ({closedCampaigns.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="requests" className="mt-4">
              {renderCampaignList(pendingCampaigns, true)}
            </TabsContent>

            <TabsContent value="active" className="mt-4">
              {renderCampaignList(activeCampaigns)}
            </TabsContent>

            <TabsContent value="in-progress" className="mt-4">
              {renderCampaignList(inProgressCampaigns)}
            </TabsContent>

            <TabsContent value="completed" className="mt-4">
              {renderCampaignList(completedCampaigns)}
            </TabsContent>

            <TabsContent value="rejected" className="mt-4">
              {renderCampaignList(rejectedCampaigns)}
            </TabsContent>

            <TabsContent value="closed" className="mt-4">
              {renderCampaignList(closedCampaigns)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Volunteer Management Section - Section 5
function VolunteersSection() {
  const [activeVolunteerTab, setActiveVolunteerTab] = useState("opportunities");
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const { data: opportunities = [] } = useQuery({
    queryKey: ['/api/admin/volunteer/opportunities'],
    retry: false,
  });

  const { data: applications = [] } = useQuery({
    queryKey: ['/api/admin/volunteer/applications'],
    retry: false,
  });

  const { data: favoriteOpportunities = [] } = useQuery({
    queryKey: ['/api/admin/volunteer/favorites'],
    retry: false,
  });

  const toggleItemExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const renderVolunteerOpportunityDetails = (opportunity: any) => (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
      <h5 className="font-semibold mb-3">Volunteer Opportunity Details</h5>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2 text-sm">
          <p><strong>Title:</strong> {opportunity.title}</p>
          <p><strong>Campaign:</strong> {opportunity.campaignTitle || 'N/A'}</p>
          <p><strong>Description:</strong> {opportunity.description?.substring(0, 150)}...</p>
          <p><strong>Location:</strong> {opportunity.location || 'Remote'}</p>
          <p><strong>Duration:</strong> {opportunity.duration || 'Flexible'}</p>
        </div>
        <div className="space-y-2 text-sm">
          <p><strong>Slots Needed:</strong> {opportunity.slotsNeeded || 0}</p>
          <p><strong>Slots Filled:</strong> {opportunity.slotsFilled || 0}</p>
          <p><strong>Status:</strong> <Badge variant="outline">{opportunity.status}</Badge></p>
          <p><strong>Start Date:</strong> {opportunity.startDate ? new Date(opportunity.startDate).toLocaleDateString() : 'TBD'}</p>
          <p><strong>End Date:</strong> {opportunity.endDate ? new Date(opportunity.endDate).toLocaleDateString() : 'TBD'}</p>
        </div>
      </div>
      <div className="mt-3">
        <p><strong>Requirements:</strong></p>
        <p className="text-sm text-gray-600 mt-1">{opportunity.requirements || 'No specific requirements listed'}</p>
      </div>
      <div className="mt-3">
        <p><strong>Creator Information:</strong></p>
        <div className="flex items-center gap-3 mt-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={opportunity.creator?.profileImageUrl} />
            <AvatarFallback>{opportunity.creator?.firstName?.[0]}{opportunity.creator?.lastName?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{opportunity.creator?.firstName} {opportunity.creator?.lastName}</p>
            <p className="text-xs text-gray-600">{opportunity.creator?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderOpportunitiesList = (opportunities: any[]) => (
    <div className="space-y-3">
      {opportunities.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No volunteer opportunities found</p>
      ) : (
        opportunities.map((opportunity: any) => (
          <div key={opportunity.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-medium mb-1">{opportunity.title}</h4>
                <p className="text-sm text-gray-600 mb-2">{opportunity.description?.substring(0, 100)}...</p>
                <div className="flex items-center gap-4 text-sm">
                  <span>Slots: {opportunity.slotsFilled || 0}/{opportunity.slotsNeeded || 0}</span>
                  <span>Location: {opportunity.location || 'Remote'}</span>
                  <Badge variant="outline">{opportunity.status}</Badge>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => toggleItemExpanded(`opp-${opportunity.id}`)}
                >
                  {expandedItems.includes(`opp-${opportunity.id}`) ? "Hide Details" : "View Volunteer Opportunity Details"}
                </Button>
              </div>
            </div>
            {expandedItems.includes(`opp-${opportunity.id}`) && renderVolunteerOpportunityDetails(opportunity)}
          </div>
        ))
      )}
    </div>
  );

  const renderApplicationsList = (applications: any[]) => (
    <div className="space-y-3">
      {applications.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No volunteer applications found</p>
      ) : (
        applications.map((application: any) => (
          <div key={application.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={application.volunteer?.profileImageUrl} />
                    <AvatarFallback>{application.volunteer?.firstName?.[0]}{application.volunteer?.lastName?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium">{application.volunteerFirstName} {application.volunteerLastName}</h4>
                    <p className="text-sm text-gray-600">{application.volunteer?.email}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">Applied for: {application.campaignTitle || application.opportunityTitle}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span>Applied: {new Date(application.createdAt).toLocaleDateString()}</span>
                  <Badge variant={
                    application.status === 'approved' ? 'default' : 
                    application.status === 'rejected' ? 'destructive' : 'outline'
                  }>
                    {application.status}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => toggleItemExpanded(`app-${application.id}`)}
                >
                  {expandedItems.includes(`app-${application.id}`) ? "Hide Details" : "View Volunteer Opportunity Details"}
                </Button>
              </div>
            </div>
            {expandedItems.includes(`app-${application.id}`) && renderVolunteerOpportunityDetails(application.opportunity || application)}
          </div>
        ))
      )}
    </div>
  );

  const renderFavoritesList = (favorites: any[]) => (
    <div className="space-y-3">
      {favorites.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No popular volunteer opportunities found</p>
      ) : (
        favorites.map((favorite: any) => (
          <div key={favorite.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-medium mb-1">{favorite.title}</h4>
                <p className="text-sm text-gray-600 mb-2">{favorite.description?.substring(0, 100)}...</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-medium text-green-600">
                    🔥 {favorite.applicationCount || 0} applications
                  </span>
                  <span>Slots: {favorite.slotsFilled || 0}/{favorite.slotsNeeded || 0}</span>
                  <Badge variant="outline">{favorite.status}</Badge>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => toggleItemExpanded(`fav-${favorite.id}`)}
                >
                  {expandedItems.includes(`fav-${favorite.id}`) ? "Hide Details" : "View Volunteer Opportunity Details"}
                </Button>
              </div>
            </div>
            {expandedItems.includes(`fav-${favorite.id}`) && renderVolunteerOpportunityDetails(favorite)}
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Volunteer Management</h2>
      
      {/* Volunteer Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-800" data-testid="stat-total-opportunities">
                  {opportunities.length}
                </div>
                <div className="text-sm text-blue-600">Total Volunteer Opportunities</div>
              </div>
              <Heart className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-800" data-testid="stat-total-applications">
                  {applications.length}
                </div>
                <div className="text-sm text-green-600">Total Volunteer Applications</div>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Volunteer Administration</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeVolunteerTab} onValueChange={setActiveVolunteerTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="opportunities">Opportunities ({opportunities.length})</TabsTrigger>
              <TabsTrigger value="applications">Applications ({applications.length})</TabsTrigger>
              <TabsTrigger value="favorites">Favorites ({favoriteOpportunities.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="opportunities" className="mt-4">
              {renderOpportunitiesList(opportunities)}
            </TabsContent>

            <TabsContent value="applications" className="mt-4">
              {renderApplicationsList(applications)}
            </TabsContent>

            <TabsContent value="favorites" className="mt-4">
              {renderFavoritesList(favoriteOpportunities)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Financial Management Section - Section 6
function FinancialSection() {
  const [activeFinancialTab, setActiveFinancialTab] = useState("deposits");
  const [expandedTransactions, setExpandedTransactions] = useState<string[]>([]);

  const { data: deposits = [] } = useQuery({
    queryKey: ['/api/admin/financial/deposits'],
    retry: false,
  });

  const { data: withdrawals = [] } = useQuery({
    queryKey: ['/api/admin/financial/withdrawals'],
    retry: false,
  });

  const { data: contributions = [] } = useQuery({
    queryKey: ['/api/admin/financial/contributions'],
    retry: false,
  });

  const { data: tips = [] } = useQuery({
    queryKey: ['/api/admin/financial/tips'],
    retry: false,
  });

  const { data: claimedContributions = [] } = useQuery({
    queryKey: ['/api/admin/financial/claimed-contributions'],
    retry: false,
  });

  const { data: claimedTips = [] } = useQuery({
    queryKey: ['/api/admin/financial/claimed-tips'],
    retry: false,
  });

  const { data: pendingTransactions = [] } = useQuery({
    queryKey: ['/api/admin/financial/pending-transactions'],
    retry: false,
  });

  const { data: completedTransactions = [] } = useQuery({
    queryKey: ['/api/admin/financial/completed-transactions'],
    retry: false,
  });

  const { data: failedTransactions = [] } = useQuery({
    queryKey: ['/api/admin/financial/failed-transactions'],
    retry: false,
  });

  const toggleTransactionExpanded = (transactionId: string) => {
    setExpandedTransactions(prev => 
      prev.includes(transactionId) 
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  const renderTransactionDetails = (transaction: any) => (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
      <h5 className="font-semibold mb-3">Transaction Details</h5>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2 text-sm">
          <p><strong>Full Transaction ID:</strong> {transaction.transactionId || transaction.blockchainTxId || transaction.id}</p>
          <p><strong>Transaction Type:</strong> {transaction.transactionType || transaction.type || 'N/A'}</p>
          <p><strong>Amount:</strong> ₱{transaction.amount || '0.00'}</p>
          <p><strong>Fee:</strong> ₱{transaction.fee || '0.00'}</p>
          <p><strong>Net Amount:</strong> ₱{(parseFloat(transaction.amount || '0') - parseFloat(transaction.fee || '0')).toFixed(2)}</p>
          <p><strong>Currency:</strong> {transaction.currency || 'PUSO'}</p>
        </div>
        <div className="space-y-2 text-sm">
          <p><strong>Status:</strong> <Badge variant={
            transaction.status === 'completed' || transaction.status === 'success' ? 'default' :
            transaction.status === 'failed' || transaction.status === 'rejected' ? 'destructive' :
            transaction.status === 'pending' ? 'outline' : 'secondary'
          }>{transaction.status || 'unknown'}</Badge></p>
          <p><strong>Created:</strong> {transaction.createdAt ? new Date(transaction.createdAt).toLocaleString() : 'N/A'}</p>
          <p><strong>Updated:</strong> {transaction.updatedAt ? new Date(transaction.updatedAt).toLocaleString() : 'N/A'}</p>
          <p><strong>Block Number:</strong> {transaction.blockNumber || 'N/A'}</p>
          <p><strong>Gas Used:</strong> {transaction.gasUsed || 'N/A'}</p>
          <p><strong>Gas Price:</strong> {transaction.gasPrice || 'N/A'}</p>
        </div>
      </div>
      <div className="mt-3">
        <p><strong>User Information:</strong></p>
        <div className="flex items-center gap-3 mt-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={transaction.user?.profileImageUrl} />
            <AvatarFallback>{transaction.user?.firstName?.[0]}{transaction.user?.lastName?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{transaction.user?.firstName} {transaction.user?.lastName}</p>
            <p className="text-xs text-gray-600">{transaction.user?.email}</p>
            <p className="text-xs text-gray-500">User ID: {transaction.userId || 'N/A'}</p>
          </div>
        </div>
      </div>
      {transaction.description && (
        <div className="mt-3">
          <p><strong>Description:</strong></p>
          <p className="text-sm text-gray-600 mt-1">{transaction.description}</p>
        </div>
      )}
      {transaction.campaignId && (
        <div className="mt-3">
          <p><strong>Related Campaign:</strong></p>
          <p className="text-sm text-gray-600 mt-1">Campaign ID: {transaction.campaignId}</p>
          <p className="text-sm text-gray-600">Campaign: {transaction.campaign?.title || 'N/A'}</p>
        </div>
      )}
    </div>
  );

  const renderTransactionList = (transactions: any[], title: string) => (
    <div className="space-y-3">
      <h4 className="font-medium text-lg mb-4">{title}</h4>
      {transactions.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No transactions found</p>
      ) : (
        <div className="space-y-2">
          {transactions.map((transaction: any) => (
            <div key={transaction.id} className="border rounded-lg p-4 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                <div>
                  <p className="font-medium text-sm">{transaction.transactionType || transaction.type || 'N/A'}</p>
                  <p className="text-xs text-gray-500">Type</p>
                </div>
                <div>
                  <p className="text-sm">
                    {transaction.createdAt ? new Date(transaction.createdAt).toLocaleString() : 
                     transaction.transactionDate ? new Date(transaction.transactionDate).toLocaleString() : 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500">Date & Time</p>
                </div>
                <div>
                  <p className="text-sm font-mono">
                    {(transaction.transactionId || transaction.blockchainTxId || transaction.id || 'N/A').substring(0, 12)}...
                  </p>
                  <p className="text-xs text-gray-500">Transaction ID</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    ₱{transaction.amount || '0.00'}
                  </p>
                  <p className="text-xs text-gray-500">Amount</p>
                </div>
                <div>
                  <Badge variant={
                    transaction.status === 'completed' || transaction.status === 'success' ? 'default' :
                    transaction.status === 'failed' || transaction.status === 'rejected' ? 'destructive' :
                    transaction.status === 'pending' ? 'outline' : 'secondary'
                  }>
                    {transaction.status || 'unknown'}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">Status</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => toggleTransactionExpanded(transaction.id)}
                  >
                    {expandedTransactions.includes(transaction.id) ? "Hide Details" : "VIEW TRANSACTION DETAILS"}
                  </Button>
                </div>
              </div>
              {expandedTransactions.includes(transaction.id) && renderTransactionDetails(transaction)}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Calculate analytics totals
  const totalDeposits = deposits.reduce((sum: number, t: any) => sum + parseFloat(t.amount || '0'), 0);
  const totalWithdrawals = withdrawals.reduce((sum: number, t: any) => sum + parseFloat(t.amount || '0'), 0);
  const totalContributions = contributions.reduce((sum: number, t: any) => sum + parseFloat(t.amount || '0'), 0);
  const totalTips = tips.reduce((sum: number, t: any) => sum + parseFloat(t.amount || '0'), 0);
  const totalPending = pendingTransactions.reduce((sum: number, t: any) => sum + parseFloat(t.amount || '0'), 0);
  const totalCompleted = completedTransactions.reduce((sum: number, t: any) => sum + parseFloat(t.amount || '0'), 0);
  const totalFailed = failedTransactions.reduce((sum: number, t: any) => sum + parseFloat(t.amount || '0'), 0);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Financial Management</h2>
      
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-center">Total Deposits</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">₱{totalDeposits.toFixed(2)}</p>
              <p className="text-xs text-gray-500">{deposits.length} transactions</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-center">Total Withdrawals</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">₱{totalWithdrawals.toFixed(2)}</p>
              <p className="text-xs text-gray-500">{withdrawals.length} transactions</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-center">Total Contributions</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">₱{totalContributions.toFixed(2)}</p>
              <p className="text-xs text-gray-500">{contributions.length} transactions</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-center">Total Tips</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">₱{totalTips.toFixed(2)}</p>
              <p className="text-xs text-gray-500">{tips.length} transactions</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-center">Total Pending</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">₱{totalPending.toFixed(2)}</p>
              <p className="text-xs text-gray-500">{pendingTransactions.length} transactions</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-center">Total Successful</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">₱{totalCompleted.toFixed(2)}</p>
              <p className="text-xs text-gray-500">{completedTransactions.length} transactions</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-center">Total Failed</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">₱{totalFailed.toFixed(2)}</p>
              <p className="text-xs text-gray-500">{failedTransactions.length} transactions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Blockchain Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeFinancialTab} onValueChange={setActiveFinancialTab}>
            <TabsList className="grid w-full grid-cols-7 text-xs">
              <TabsTrigger value="deposits">Deposits ({deposits.length})</TabsTrigger>
              <TabsTrigger value="withdrawals">Withdrawals ({withdrawals.length})</TabsTrigger>
              <TabsTrigger value="contributions-tips">Contributions & Tips ({contributions.length + tips.length})</TabsTrigger>
              <TabsTrigger value="claimed">Claimed ({claimedContributions.length + claimedTips.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({pendingTransactions.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({completedTransactions.length})</TabsTrigger>
              <TabsTrigger value="failed">Failed ({failedTransactions.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="deposits" className="mt-4">
              {renderTransactionList(deposits, 'Deposit Transactions')}
            </TabsContent>

            <TabsContent value="withdrawals" className="mt-4">
              {renderTransactionList(withdrawals, 'Withdrawal Transactions')}
            </TabsContent>

            <TabsContent value="contributions-tips" className="mt-4">
              {renderTransactionList([...contributions, ...tips], 'Contributions & Tips Transactions')}
            </TabsContent>

            <TabsContent value="claimed" className="mt-4">
              {renderTransactionList([...claimedContributions, ...claimedTips], 'Claimed Contributions & Tips')}
            </TabsContent>

            <TabsContent value="pending" className="mt-4">
              {renderTransactionList(pendingTransactions, 'All Pending Transactions')}
            </TabsContent>

            <TabsContent value="completed" className="mt-4">
              {renderTransactionList(completedTransactions, 'All Completed Transactions')}
            </TabsContent>

            <TabsContent value="failed" className="mt-4">
              {renderTransactionList(failedTransactions, 'All Failed Transactions')}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Reports Management Section - Section 7
function ReportsSection() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeReportsTab, setActiveReportsTab] = useState("document");
  const [expandedReports, setExpandedReports] = useState<string[]>([]);
  const { toast } = useToast();

  const { data: documentReports = [] } = useQuery({
    queryKey: ['/api/admin/reports/document'],
    retry: false,
  });

  const { data: campaignReports = [] } = useQuery({
    queryKey: ['/api/admin/reports/campaigns'],
    retry: false,
  });

  const { data: volunteerReports = [] } = useQuery({
    queryKey: ['/api/admin/reports/volunteers'],
    retry: false,
  });

  const { data: creatorReports = [] } = useQuery({
    queryKey: ['/api/admin/reports/creators'],
    retry: false,
  });

  const { data: userReports = [] } = useQuery({
    queryKey: ['/api/admin/reports/users'],
    retry: false,
  });

  const { data: transactionReports = [] } = useQuery({
    queryKey: ['/api/admin/reports/transactions'],
    retry: false,
  });

  const toggleReportExpanded = (reportId: string) => {
    setExpandedReports(prev => 
      prev.includes(reportId) 
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  const handleClaimReport = async (reportId: string, reportType: string) => {
    try {
      // Add claim logic here
      toast({
        title: "Report Claimed",
        description: `You have successfully claimed this ${reportType} report for review.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to claim report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filterReports = (reports: any[]) => {
    if (!searchTerm) return reports;
    return reports.filter((report: any) =>
      report.documentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.campaignId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reportId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const renderReportDetails = (report: any) => (
    <div className="mt-4 p-4 bg-red-50 rounded-lg">
      <h5 className="font-semibold mb-3">Complete Report Details</h5>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2 text-sm">
          <p><strong>Report ID:</strong> {report.reportId || report.id}</p>
          <p><strong>Report Type:</strong> {report.reportType || 'N/A'}</p>
          <p><strong>Category:</strong> {report.category || 'N/A'}</p>
          <p><strong>Priority:</strong> <Badge variant={report.priority === 'high' ? 'destructive' : report.priority === 'medium' ? 'outline' : 'secondary'}>{report.priority || 'low'}</Badge></p>
          <p><strong>Status:</strong> <Badge variant={report.status === 'pending' ? 'destructive' : 'default'}>{report.status}</Badge></p>
          <p><strong>Tags:</strong> {report.tags?.join(', ') || 'No tags'}</p>
        </div>
        <div className="space-y-2 text-sm">
          <p><strong>Related ID:</strong> {report.documentId || report.campaignId || report.userId || report.transactionId || 'N/A'}</p>
          <p><strong>Created:</strong> {report.createdAt ? new Date(report.createdAt).toLocaleString() : 'N/A'}</p>
          <p><strong>Updated:</strong> {report.updatedAt ? new Date(report.updatedAt).toLocaleString() : 'N/A'}</p>
          <p><strong>Severity:</strong> {report.severity || 'Normal'}</p>
          <p><strong>Location:</strong> {report.location || 'Platform'}</p>
        </div>
      </div>
      <div className="mt-3">
        <p><strong>Report Description:</strong></p>
        <p className="text-sm text-gray-600 mt-1 p-2 bg-white rounded border">{report.description || 'No description provided'}</p>
      </div>
      {report.evidenceFiles && report.evidenceFiles.length > 0 && (
        <div className="mt-3">
          <p><strong>Evidence Files:</strong></p>
          <div className="flex flex-wrap gap-2 mt-2">
            {report.evidenceFiles.map((file: any, index: number) => (
              <Badge key={index} variant="outline" className="cursor-pointer hover:bg-gray-100">
                📎 {file.name || `Evidence ${index + 1}`}
              </Badge>
            ))}
          </div>
        </div>
      )}
      <div className="mt-4 grid md:grid-cols-2 gap-4">
        <div>
          <p><strong>Reported User Profile:</strong></p>
          <div className="flex items-center gap-3 mt-2 p-2 bg-white rounded border">
            <Avatar className="h-8 w-8">
              <AvatarImage src={report.reportedUser?.profileImageUrl} />
              <AvatarFallback>{report.reportedUser?.firstName?.[0]}{report.reportedUser?.lastName?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{report.reportedUser?.firstName} {report.reportedUser?.lastName}</p>
              <p className="text-xs text-gray-600">{report.reportedUser?.email}</p>
              <p className="text-xs text-gray-500">ID: {report.reportedUser?.id || 'N/A'}</p>
              <p className="text-xs text-gray-500">KYC: {report.reportedUser?.kycStatus || 'N/A'}</p>
            </div>
          </div>
        </div>
        <div>
          <p><strong>Reporter Profile:</strong></p>
          <div className="flex items-center gap-3 mt-2 p-2 bg-white rounded border">
            <Avatar className="h-8 w-8">
              <AvatarImage src={report.reporter?.profileImageUrl} />
              <AvatarFallback>{report.reporter?.firstName?.[0]}{report.reporter?.lastName?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{report.reporter?.firstName} {report.reporter?.lastName}</p>
              <p className="text-xs text-gray-600">{report.reporter?.email}</p>
              <p className="text-xs text-gray-500">ID: {report.reporterId || report.reporter?.id}</p>
              <p className="text-xs text-gray-500">KYC: {report.reporter?.kycStatus || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderReportsList = (reports: any[], reportType: string) => {
    const filteredReports = filterReports(reports);
    
    return (
      <div className="space-y-3">
        {filteredReports.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No {reportType} reports found</p>
        ) : (
          filteredReports.map((report: any) => (
            <div key={report.id} className="border rounded-lg p-4 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                <div>
                  <p className="font-medium text-sm">{report.reportId || report.id}</p>
                  <p className="text-xs text-gray-500">Report ID</p>
                </div>
                <div>
                  <p className="text-sm">
                    {report.createdAt ? new Date(report.createdAt).toLocaleString() : 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500">Date & Time</p>
                </div>
                <div>
                  <div className="flex flex-wrap gap-1">
                    {report.tags?.slice(0, 2).map((tag: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">{tag}</Badge>
                    )) || <Badge variant="outline" className="text-xs">No tags</Badge>}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Tags</p>
                </div>
                <div>
                  <Badge variant={report.status === 'pending' ? 'destructive' : report.status === 'resolved' ? 'default' : 'outline'}>
                    {report.status || 'pending'}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">Status</p>
                </div>
                <div>
                  <p className="text-sm font-medium">{report.reporterId || 'N/A'}</p>
                  <p className="text-xs text-gray-500">Reporter ID</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => toggleReportExpanded(report.id)}
                  >
                    {expandedReports.includes(report.id) ? "Hide Details" : "VIEW REPORT DETAILS"}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="default"
                    onClick={() => handleClaimReport(report.id, reportType)}
                  >
                    CLAIM
                  </Button>
                </div>
              </div>
              {expandedReports.includes(report.id) && renderReportDetails(report)}
            </div>
          ))
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Reports Management</h2>
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Document ID, Campaign ID, User ID, Transaction ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-96"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Administration</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeReportsTab} onValueChange={setActiveReportsTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="document">Document ({documentReports.length})</TabsTrigger>
              <TabsTrigger value="campaigns">Campaigns ({campaignReports.length})</TabsTrigger>
              <TabsTrigger value="volunteers">Volunteers ({volunteerReports.length})</TabsTrigger>
              <TabsTrigger value="creators">Creators ({creatorReports.length})</TabsTrigger>
              <TabsTrigger value="users">Users ({userReports.length})</TabsTrigger>
              <TabsTrigger value="transactions">Transactions ({transactionReports.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="document" className="mt-4">
              {renderReportsList(documentReports, 'document')}
            </TabsContent>

            <TabsContent value="campaigns" className="mt-4">
              {renderReportsList(campaignReports, 'campaign')}
            </TabsContent>

            <TabsContent value="volunteers" className="mt-4">
              {renderReportsList(volunteerReports, 'volunteer')}
            </TabsContent>

            <TabsContent value="creators" className="mt-4">
              {renderReportsList(creatorReports, 'creator')}
            </TabsContent>

            <TabsContent value="users" className="mt-4">
              {renderReportsList(userReports, 'user')}
            </TabsContent>

            <TabsContent value="transactions" className="mt-4">
              {renderReportsList(transactionReports, 'transaction')}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Support Tickets Section - Section 8
function TicketsSection() {
  const [activeTicketTab, setActiveTicketTab] = useState("pending");
  const [expandedTickets, setExpandedTickets] = useState<string[]>([]);
  const { toast } = useToast();

  const { data: pendingTickets = [] } = useQuery({
    queryKey: ['/api/admin/tickets/pending'],
    retry: false,
  });

  const { data: inProgressTickets = [] } = useQuery({
    queryKey: ['/api/admin/tickets/in-progress'],
    retry: false,
  });

  const { data: resolvedTickets = [] } = useQuery({
    queryKey: ['/api/admin/tickets/resolved'],
    retry: false,
  });

  const toggleTicketExpanded = (ticketId: string) => {
    setExpandedTickets(prev => 
      prev.includes(ticketId) 
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  const handleClaimTicket = async (ticketId: string) => {
    try {
      // Add claim logic here
      toast({
        title: "Ticket Claimed",
        description: "You have successfully claimed this support ticket for review.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to claim ticket. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderTicketDetails = (ticket: any) => (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
      <h5 className="font-semibold mb-3">Complete Email Information</h5>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2 text-sm">
          <p><strong>Ticket Number:</strong> {ticket.ticketNumber || ticket.id}</p>
          <p><strong>Subject:</strong> {ticket.subject || ticket.title}</p>
          <p><strong>Sender Email:</strong> {ticket.senderEmail || ticket.email}</p>
          <p><strong>Priority:</strong> <Badge variant={ticket.priority === 'high' ? 'destructive' : ticket.priority === 'medium' ? 'outline' : 'secondary'}>{ticket.priority || 'normal'}</Badge></p>
          <p><strong>Category:</strong> {ticket.category || 'General Support'}</p>
          <p><strong>Status:</strong> <Badge variant={ticket.status === 'pending' ? 'destructive' : ticket.status === 'resolved' ? 'default' : 'outline'}>{ticket.status}</Badge></p>
        </div>
        <div className="space-y-2 text-sm">
          <p><strong>Received:</strong> {ticket.emailReceivedAt ? new Date(ticket.emailReceivedAt).toLocaleString() : ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : 'N/A'}</p>
          <p><strong>Last Updated:</strong> {ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString() : 'N/A'}</p>
          <p><strong>Response Time:</strong> {ticket.responseTime || 'N/A'}</p>
          <p><strong>Assigned To:</strong> {ticket.assignedTo || 'Unassigned'}</p>
          <p><strong>Source:</strong> {ticket.source || 'trexiaamable@gmail.com'}</p>
        </div>
      </div>
      <div className="mt-3">
        <p><strong>Email Content:</strong></p>
        <div className="text-sm text-gray-600 mt-1 p-3 bg-white rounded border max-h-48 overflow-y-auto">
          {ticket.content || ticket.message || ticket.description || 'No content available'}
        </div>
      </div>
      {ticket.attachments && ticket.attachments.length > 0 && (
        <div className="mt-3">
          <p><strong>Attachments:</strong></p>
          <div className="flex flex-wrap gap-2 mt-2">
            {ticket.attachments.map((attachment: any, index: number) => (
              <Badge key={index} variant="outline" className="cursor-pointer hover:bg-gray-100">
                📎 {attachment.name || `Attachment ${index + 1}`}
              </Badge>
            ))}
          </div>
        </div>
      )}
      {ticket.senderInfo && (
        <div className="mt-3">
          <p><strong>Sender Information:</strong></p>
          <div className="text-sm text-gray-600 mt-1 p-2 bg-white rounded border">
            <p>Name: {ticket.senderInfo.name || 'N/A'}</p>
            <p>Phone: {ticket.senderInfo.phone || 'N/A'}</p>
            <p>User ID: {ticket.senderInfo.userId || 'N/A'}</p>
            <p>Location: {ticket.senderInfo.location || 'N/A'}</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderTicketsList = (tickets: any[], showClaimButton = false) => (
    <div className="space-y-3">
      {tickets.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No tickets found</p>
      ) : (
        tickets.map((ticket: any) => (
          <div key={ticket.id} className="border rounded-lg p-4 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
              <div>
                <p className="font-medium text-sm">{ticket.ticketNumber || ticket.id}</p>
                <p className="text-xs text-gray-500">Ticket Number</p>
              </div>
              <div>
                <p className="text-sm">{ticket.senderEmail || ticket.email}</p>
                <p className="text-xs text-gray-500">Email of Sender</p>
              </div>
              <div>
                <p className="text-sm font-medium">{ticket.subject || ticket.title}</p>
                <p className="text-xs text-gray-500">Title of Email</p>
              </div>
              <div>
                <p className="text-sm">
                  {ticket.emailReceivedAt ? new Date(ticket.emailReceivedAt).toLocaleString() : 
                   ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : 'N/A'}
                </p>
                <p className="text-xs text-gray-500">Date & Time Filed</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => toggleTicketExpanded(ticket.id)}
                >
                  {expandedTickets.includes(ticket.id) ? "Hide Details" : "VIEW TICKET DETAILS"}
                </Button>
                {showClaimButton && (
                  <Button 
                    size="sm" 
                    variant="default"
                    onClick={() => handleClaimTicket(ticket.id)}
                  >
                    CLAIM
                  </Button>
                )}
              </div>
            </div>
            {expandedTickets.includes(ticket.id) && renderTicketDetails(ticket)}
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Ticket Management</h2>
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-blue-500" />
          <span className="text-sm text-muted-foreground">trexiaamable@gmail.com</span>
        </div>
      </div>

      {/* Ticket Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-800" data-testid="stat-pending-tickets">
                  {pendingTickets.length}
                </div>
                <div className="text-sm text-yellow-600">Total Pending Tickets</div>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-800" data-testid="stat-active-tickets">
                  {inProgressTickets.length}
                </div>
                <div className="text-sm text-blue-600">Total Active Tickets</div>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-800" data-testid="stat-resolved-tickets">
                  {resolvedTickets.length}
                </div>
                <div className="text-sm text-green-600">Total Resolved</div>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Support Ticket Administration</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTicketTab} onValueChange={setActiveTicketTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending">Pending ({pendingTickets.length})</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress ({inProgressTickets.length})</TabsTrigger>
              <TabsTrigger value="resolved">Resolved ({resolvedTickets.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-4">
              {renderTicketsList(pendingTickets, true)}
            </TabsContent>

            <TabsContent value="in-progress" className="mt-4">
              {renderTicketsList(inProgressTickets)}
            </TabsContent>

            <TabsContent value="resolved" className="mt-4">
              {renderTicketsList(resolvedTickets)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Stories Management Section - Section 9
function StoriesSection() {
  const [activeStoriesTab, setActiveStoriesTab] = useState("create");
  const [expandedStories, setExpandedStories] = useState<string[]>([]);
  const [expandedAuthors, setExpandedAuthors] = useState<string[]>([]);
  const [createStoryForm, setCreateStoryForm] = useState({
    title: '',
    coverMedia: '',
    coverType: 'image', // 'image' or 'video'
    body: '',
    summary: ''
  });
  const { toast } = useToast();

  const { data: stories = [] } = useQuery({
    queryKey: ['/api/admin/stories/all'],
    retry: false,
  });

  const { data: authors = [] } = useQuery({
    queryKey: ['/api/admin/authors'],
    retry: false,
  });

  const toggleStoryExpanded = (storyId: string) => {
    setExpandedStories(prev => 
      prev.includes(storyId) 
        ? prev.filter(id => id !== storyId)
        : [...prev, storyId]
    );
  };

  const toggleAuthorExpanded = (authorId: string) => {
    setExpandedAuthors(prev => 
      prev.includes(authorId) 
        ? prev.filter(id => id !== authorId)
        : [...prev, authorId]
    );
  };

  const handleCreateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Add story creation logic here
      toast({
        title: "Story Created",
        description: "Your story has been successfully created and published.",
      });
      setCreateStoryForm({
        title: '',
        coverMedia: '',
        coverType: 'image',
        body: '',
        summary: ''
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create story. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderStoryDetails = (story: any) => (
    <div className="mt-4 p-4 bg-green-50 rounded-lg">
      <h5 className="font-semibold mb-3">Published Story Details</h5>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2 text-sm">
          <p><strong>Story ID:</strong> {story.id}</p>
          <p><strong>Title:</strong> {story.title}</p>
          <p><strong>Author:</strong> {story.authorName}</p>
          <p><strong>Author Email:</strong> <span className="text-blue-600">{story.authorEmail}</span> <Badge variant="outline" className="text-xs">Admin Only</Badge></p>
          <p><strong>Published:</strong> {story.publishedAt ? new Date(story.publishedAt).toLocaleString() : 'N/A'}</p>
          <p><strong>Status:</strong> <Badge variant={story.status === 'published' ? 'default' : 'secondary'}>{story.status}</Badge></p>
        </div>
        <div className="space-y-2 text-sm">
          <p><strong>Reactions:</strong> {story.reactionsCount || 0}</p>
          <p><strong>Shares:</strong> {story.sharesCount || 0}</p>
          <p><strong>Comments:</strong> {story.commentsCount || 0}</p>
          <p><strong>Views:</strong> {story.viewsCount || 0}</p>
          <p><strong>Category:</strong> {story.category || 'General'}</p>
          <p><strong>Reading Time:</strong> {story.readingTime || '5'} min</p>
        </div>
      </div>
      {story.coverUrl && (
        <div className="mt-3">
          <p><strong>Cover Media:</strong></p>
          <div className="mt-2">
            {story.coverType === 'video' ? (
              <video className="w-48 h-32 object-cover rounded border" controls>
                <source src={story.coverUrl} type="video/mp4" />
              </video>
            ) : (
              <img src={story.coverUrl} alt="Story cover" className="w-48 h-32 object-cover rounded border" />
            )}
          </div>
        </div>
      )}
      <div className="mt-3">
        <p><strong>Summary:</strong></p>
        <p className="text-sm text-gray-600 mt-1 p-2 bg-white rounded border">{story.summary || 'No summary available'}</p>
      </div>
      <div className="mt-3">
        <p><strong>Body Content:</strong></p>
        <div className="text-sm text-gray-600 mt-1 p-3 bg-white rounded border max-h-48 overflow-y-auto">
          {story.body || 'No content available'}
        </div>
      </div>
      <div className="mt-3 p-2 bg-yellow-100 rounded border">
        <p className="text-xs text-yellow-800"><strong>Note:</strong> You are viewing in admin mode. Users cannot react, share, or comment in this view.</p>
      </div>
    </div>
  );

  const renderAuthorDetails = (author: any) => (
    <div className="mt-4 p-4 bg-purple-50 rounded-lg">
      <h5 className="font-semibold mb-3">Complete Author Profile</h5>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2 text-sm">
          <p><strong>Author ID:</strong> {author.id}</p>
          <p><strong>Full Name:</strong> {author.firstName} {author.lastName}</p>
          <p><strong>Email:</strong> {author.email}</p>
          <p><strong>Phone:</strong> {author.phone || 'N/A'}</p>
          <p><strong>KYC Status:</strong> <Badge variant={author.kycStatus === 'verified' ? 'default' : 'destructive'}>{author.kycStatus || 'pending'}</Badge></p>
          <p><strong>Joined:</strong> {author.createdAt ? new Date(author.createdAt).toLocaleDateString() : 'N/A'}</p>
        </div>
        <div className="space-y-2 text-sm">
          <p><strong>Total Stories:</strong> {author.storiesCount || 0}</p>
          <p><strong>Total Views:</strong> {author.totalViews || 0}</p>
          <p><strong>Total Reactions:</strong> {author.totalReactions || 0}</p>
          <p><strong>Average Rating:</strong> {author.averageRating || 'N/A'}</p>
          <p><strong>Status:</strong> <Badge variant={author.status === 'active' ? 'default' : 'secondary'}>{author.status || 'active'}</Badge></p>
          <p><strong>Verification:</strong> <Badge variant={author.isVerified ? 'default' : 'outline'}>{author.isVerified ? 'Verified' : 'Unverified'}</Badge></p>
        </div>
      </div>
      <div className="mt-3">
        <p><strong>Bio:</strong></p>
        <p className="text-sm text-gray-600 mt-1 p-2 bg-white rounded border">{author.bio || 'No bio available'}</p>
      </div>
      <div className="mt-3">
        <p><strong>Professional Information:</strong></p>
        <div className="text-sm text-gray-600 mt-1 p-2 bg-white rounded border">
          <p>Occupation: {author.occupation || 'N/A'}</p>
          <p>Education: {author.education || 'N/A'}</p>
          <p>Experience: {author.experience || 'N/A'} years</p>
          <p>Specialization: {author.specialization || 'N/A'}</p>
        </div>
      </div>
      <div className="mt-3">
        <p><strong>Analytics Scores:</strong></p>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div className="p-2 bg-white rounded border text-center">
            <p className="text-xs text-gray-500">Engagement Rate</p>
            <p className="font-medium">{author.engagementRate || '0'}%</p>
          </div>
          <div className="p-2 bg-white rounded border text-center">
            <p className="text-xs text-gray-500">Quality Score</p>
            <p className="font-medium">{author.qualityScore || '0'}/10</p>
          </div>
        </div>
      </div>
      {author.publishedArticles && author.publishedArticles.length > 0 && (
        <div className="mt-3">
          <p><strong>Published Articles:</strong></p>
          <div className="mt-2 space-y-1">
            {author.publishedArticles.slice(0, 5).map((article: any, index: number) => (
              <div key={index} className="p-2 bg-white rounded border text-sm">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{article.title}</span>
                  <span className="text-xs text-gray-500">{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : 'N/A'}</span>
                </div>
                <p className="text-xs text-gray-600">{article.viewsCount || 0} views • {article.reactionsCount || 0} reactions</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderStoriesList = (stories: any[]) => (
    <div className="space-y-3">
      {stories.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No stories found</p>
      ) : (
        stories.map((story: any) => (
          <div key={story.id} className="border rounded-lg p-4 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
              <div>
                <p className="font-medium text-sm">{story.title}</p>
                <p className="text-xs text-gray-500">Title</p>
              </div>
              <div>
                <p className="text-sm">
                  {story.publishedAt ? new Date(story.publishedAt).toLocaleString() : 'N/A'}
                </p>
                <p className="text-xs text-gray-500">Date & Time Published</p>
              </div>
              <div>
                <p className="text-sm text-blue-600">{story.authorEmail}</p>
                <p className="text-xs text-gray-500">Writer Email <Badge variant="outline" className="text-xs ml-1">Admin Only</Badge></p>
              </div>
              <div>
                {story.coverUrl && (
                  story.coverType === 'video' ? (
                    <video className="w-16 h-12 object-cover rounded" controls>
                      <source src={story.coverUrl} type="video/mp4" />
                    </video>
                  ) : (
                    <img src={story.coverUrl} alt="Cover" className="w-16 h-12 object-cover rounded" />
                  )
                )}
                <p className="text-xs text-gray-500 mt-1">Cover</p>
              </div>
              <div className="grid grid-cols-3 gap-1 text-center">
                <div>
                  <p className="text-xs font-medium">{story.reactionsCount || 0}</p>
                  <p className="text-xs text-gray-500">Reacts</p>
                </div>
                <div>
                  <p className="text-xs font-medium">{story.sharesCount || 0}</p>
                  <p className="text-xs text-gray-500">Shares</p>
                </div>
                <div>
                  <p className="text-xs font-medium">{story.commentsCount || 0}</p>
                  <p className="text-xs text-gray-500">Comments</p>
                </div>
              </div>
              <div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => toggleStoryExpanded(story.id)}
                >
                  {expandedStories.includes(story.id) ? "Hide Details" : "VIEW PUBLISHED STORY"}
                </Button>
              </div>
            </div>
            {expandedStories.includes(story.id) && renderStoryDetails(story)}
          </div>
        ))
      )}
    </div>
  );

  const renderAuthorsList = (authors: any[]) => (
    <div className="space-y-3">
      {authors.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No authors found</p>
      ) : (
        authors.map((author: any) => (
          <div key={author.id} className="border rounded-lg p-4 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
              <div>
                <p className="font-medium text-sm">{author.firstName} {author.lastName}</p>
                <p className="text-xs text-gray-500">Author Name</p>
              </div>
              <div>
                <p className="text-sm">{author.email}</p>
                <p className="text-xs text-gray-500">Email</p>
              </div>
              <div>
                <p className="text-sm font-medium">{author.storiesCount || 0}</p>
                <p className="text-xs text-gray-500">Published Articles</p>
              </div>
              <div>
                <Badge variant={author.status === 'active' ? 'default' : 'secondary'}>
                  {author.status || 'active'}
                </Badge>
                <p className="text-xs text-gray-500 mt-1">Status</p>
              </div>
              <div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => toggleAuthorExpanded(author.id)}
                >
                  {expandedAuthors.includes(author.id) ? "Hide Details" : "VIEW AUTHOR DETAILS"}
                </Button>
              </div>
            </div>
            {expandedAuthors.includes(author.id) && renderAuthorDetails(author)}
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Stories Management</h2>

      <Card>
        <CardHeader>
          <CardTitle>Story Administration</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeStoriesTab} onValueChange={setActiveStoriesTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="create">Create Stories</TabsTrigger>
              <TabsTrigger value="stories">Stories ({stories.length})</TabsTrigger>
              <TabsTrigger value="authors">Authors ({authors.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="mt-4">
              <form onSubmit={handleCreateStory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <Input
                    type="text"
                    placeholder="Enter story title..."
                    value={createStoryForm.title}
                    onChange={(e) => setCreateStoryForm({...createStoryForm, title: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Cover Media</label>
                  <div className="flex gap-2 mb-2">
                    <Badge 
                      variant={createStoryForm.coverType === 'image' ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setCreateStoryForm({...createStoryForm, coverType: 'image'})}
                    >
                      Image Upload
                    </Badge>
                    <Badge 
                      variant={createStoryForm.coverType === 'video' ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setCreateStoryForm({...createStoryForm, coverType: 'video'})}
                    >
                      Video Link
                    </Badge>
                  </div>
                  <Input
                    type={createStoryForm.coverType === 'image' ? 'file' : 'url'}
                    placeholder={createStoryForm.coverType === 'image' ? 'Upload cover image...' : 'Enter video URL...'}
                    accept={createStoryForm.coverType === 'image' ? 'image/*' : undefined}
                    onChange={(e) => setCreateStoryForm({...createStoryForm, coverMedia: e.target.value})}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {createStoryForm.coverType === 'image' ? 'Upload an image file for the cover' : 'Enter a video URL - it will be displayed as a preview with consistent cover photo size'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Body</label>
                  <textarea
                    className="w-full p-3 border rounded-md resize-y min-h-48"
                    placeholder="Write your story content here..."
                    value={createStoryForm.body}
                    onChange={(e) => setCreateStoryForm({...createStoryForm, body: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Summary</label>
                  <textarea
                    className="w-full p-3 border rounded-md resize-y min-h-20"
                    placeholder="Write a brief summary of your story..."
                    value={createStoryForm.summary}
                    onChange={(e) => setCreateStoryForm({...createStoryForm, summary: e.target.value})}
                    required
                  />
                </div>

                <Button type="submit" className="w-full">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Submit & Publish Story
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="stories" className="mt-4">
              {renderStoriesList(stories)}
            </TabsContent>

            <TabsContent value="authors" className="mt-4">
              {renderAuthorsList(authors)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Access Management Section - Section 10
function AccessSection() {
  const [activeAccessTab, setActiveAccessTab] = useState("administrators");
  const [expandedAdmins, setExpandedAdmins] = useState<string[]>([]);
  const [expandedSupport, setExpandedSupport] = useState<string[]>([]);
  const { toast } = useToast();

  const { data: adminUsers = [] } = useQuery({
    queryKey: ['/api/admin/access/admins'],
    retry: false,
  });

  const { data: supportUsers = [] } = useQuery({
    queryKey: ['/api/admin/access/support'],
    retry: false,
  });

  const toggleAdminExpanded = (adminId: string) => {
    setExpandedAdmins(prev => 
      prev.includes(adminId) 
        ? prev.filter(id => id !== adminId)
        : [...prev, adminId]
    );
  };

  const toggleSupportExpanded = (supportId: string) => {
    setExpandedSupport(prev => 
      prev.includes(supportId) 
        ? prev.filter(id => id !== supportId)
        : [...prev, supportId]
    );
  };

  const renderAdminDetails = (admin: any) => (
    <div className="mt-4 p-4 bg-red-50 rounded-lg">
      <h5 className="font-semibold mb-3">Complete Administrator Details</h5>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2 text-sm">
          <p><strong>Admin ID:</strong> {admin.id}</p>
          <p><strong>Full Name:</strong> {admin.firstName} {admin.lastName}</p>
          <p><strong>Email Address:</strong> {admin.email}</p>
          <p><strong>Phone:</strong> {admin.phone || 'N/A'}</p>
          <p><strong>Department:</strong> {admin.department || 'Administration'}</p>
          <p><strong>Permission Level:</strong> <Badge variant="destructive">{admin.permissionLevel || 'Super Admin'}</Badge></p>
        </div>
        <div className="space-y-2 text-sm">
          <p><strong>Permission Granted:</strong> {admin.permissionGrantedAt ? new Date(admin.permissionGrantedAt).toLocaleString() : admin.createdAt ? new Date(admin.createdAt).toLocaleString() : 'N/A'}</p>
          <p><strong>Last Login:</strong> {admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleString() : 'Never'}</p>
          <p><strong>Status:</strong> <Badge variant={admin.status === 'active' ? 'default' : 'secondary'}>{admin.status || 'active'}</Badge></p>
          <p><strong>Access Level:</strong> {admin.accessLevel || 'Full Access'}</p>
          <p><strong>Created By:</strong> {admin.createdBy || 'System'}</p>
          <p><strong>Two-Factor Auth:</strong> <Badge variant={admin.twoFactorEnabled ? 'default' : 'outline'}>{admin.twoFactorEnabled ? 'Enabled' : 'Disabled'}</Badge></p>
        </div>
      </div>
      <div className="mt-3">
        <p><strong>Permissions & Modules:</strong></p>
        <div className="flex flex-wrap gap-2 mt-2">
          {admin.permissions?.map((permission: string, index: number) => (
            <Badge key={index} variant="outline" className="text-xs">
              {permission}
            </Badge>
          )) || [
            <Badge key={0} variant="outline" className="text-xs">User Management</Badge>,
            <Badge key={1} variant="outline" className="text-xs">Financial Management</Badge>,
            <Badge key={2} variant="outline" className="text-xs">Reports</Badge>,
            <Badge key={3} variant="outline" className="text-xs">System Settings</Badge>
          ]}
        </div>
      </div>
      <div className="mt-3">
        <p><strong>Analytics & Performance:</strong></p>
        <div className="grid grid-cols-3 gap-2 mt-1">
          <div className="p-2 bg-white rounded border text-center">
            <p className="text-xs text-gray-500">Actions Performed</p>
            <p className="font-medium">{admin.actionsPerformed || '0'}</p>
          </div>
          <div className="p-2 bg-white rounded border text-center">
            <p className="text-xs text-gray-500">Login Sessions</p>
            <p className="font-medium">{admin.loginSessions || '0'}</p>
          </div>
          <div className="p-2 bg-white rounded border text-center">
            <p className="text-xs text-gray-500">System Changes</p>
            <p className="font-medium">{admin.systemChanges || '0'}</p>
          </div>
        </div>
      </div>
      <div className="mt-3">
        <p><strong>Recent Activity:</strong></p>
        <div className="text-sm text-gray-600 mt-1 p-2 bg-white rounded border max-h-32 overflow-y-auto">
          {admin.recentActivity || 'No recent activity logged'}
        </div>
      </div>
    </div>
  );

  const renderSupportDetails = (support: any) => (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
      <h5 className="font-semibold mb-3">Complete Support Staff Details</h5>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2 text-sm">
          <p><strong>Support ID:</strong> {support.id}</p>
          <p><strong>Full Name:</strong> {support.firstName} {support.lastName}</p>
          <p><strong>Email Address:</strong> {support.email}</p>
          <p><strong>Phone:</strong> {support.phone || 'N/A'}</p>
          <p><strong>Department:</strong> {support.department || 'Customer Support'}</p>
          <p><strong>Role:</strong> <Badge variant="secondary">{support.role || 'Support Agent'}</Badge></p>
        </div>
        <div className="space-y-2 text-sm">
          <p><strong>Permission Granted:</strong> {support.permissionGrantedAt ? new Date(support.permissionGrantedAt).toLocaleString() : support.createdAt ? new Date(support.createdAt).toLocaleString() : 'N/A'}</p>
          <p><strong>Last Login:</strong> {support.lastLoginAt ? new Date(support.lastLoginAt).toLocaleString() : 'Never'}</p>
          <p><strong>Status:</strong> <Badge variant={support.status === 'active' ? 'default' : 'secondary'}>{support.status || 'active'}</Badge></p>
          <p><strong>Shift Schedule:</strong> {support.shiftSchedule || 'Standard Hours'}</p>
          <p><strong>Supervisor:</strong> {support.supervisor || 'N/A'}</p>
          <p><strong>Specialization:</strong> {support.specialization || 'General Support'}</p>
        </div>
      </div>
      <div className="mt-3">
        <p><strong>Support Permissions:</strong></p>
        <div className="flex flex-wrap gap-2 mt-2">
          {support.permissions?.map((permission: string, index: number) => (
            <Badge key={index} variant="outline" className="text-xs">
              {permission}
            </Badge>
          )) || [
            <Badge key={0} variant="outline" className="text-xs">Ticket Management</Badge>,
            <Badge key={1} variant="outline" className="text-xs">User Support</Badge>,
            <Badge key={2} variant="outline" className="text-xs">KYC Review</Badge>,
            <Badge key={3} variant="outline" className="text-xs">Reports Access</Badge>
          ]}
        </div>
      </div>
      <div className="mt-3">
        <p><strong>Performance Analytics:</strong></p>
        <div className="grid grid-cols-4 gap-2 mt-1">
          <div className="p-2 bg-white rounded border text-center">
            <p className="text-xs text-gray-500">Tickets Handled</p>
            <p className="font-medium">{support.ticketsHandled || '0'}</p>
          </div>
          <div className="p-2 bg-white rounded border text-center">
            <p className="text-xs text-gray-500">Resolution Rate</p>
            <p className="font-medium">{support.resolutionRate || '0'}%</p>
          </div>
          <div className="p-2 bg-white rounded border text-center">
            <p className="text-xs text-gray-500">Avg Response Time</p>
            <p className="font-medium">{support.avgResponseTime || '0'}min</p>
          </div>
          <div className="p-2 bg-white rounded border text-center">
            <p className="text-xs text-gray-500">Customer Rating</p>
            <p className="font-medium">{support.customerRating || '0'}/5</p>
          </div>
        </div>
      </div>
      <div className="mt-3">
        <p><strong>Recent Support Activity:</strong></p>
        <div className="text-sm text-gray-600 mt-1 p-2 bg-white rounded border max-h-32 overflow-y-auto">
          {support.recentActivity || 'No recent support activity logged'}
        </div>
      </div>
    </div>
  );

  const renderAdminsList = (admins: any[]) => (
    <div className="space-y-3">
      {admins.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No administrators found</p>
      ) : (
        admins.map((admin: any) => (
          <div key={admin.id} className="border rounded-lg p-4 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              <div>
                <p className="font-medium text-sm">{admin.firstName} {admin.lastName}</p>
                <p className="text-xs text-gray-500">Full Name</p>
              </div>
              <div>
                <p className="text-sm">{admin.email}</p>
                <p className="text-xs text-gray-500">Email Address</p>
              </div>
              <div>
                <p className="text-sm">
                  {admin.permissionGrantedAt ? new Date(admin.permissionGrantedAt).toLocaleString() : 
                   admin.createdAt ? new Date(admin.createdAt).toLocaleString() : 'N/A'}
                </p>
                <p className="text-xs text-gray-500">Date of Permission</p>
              </div>
              <div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => toggleAdminExpanded(admin.id)}
                >
                  {expandedAdmins.includes(admin.id) ? "Hide Details" : "VIEW ADMIN"}
                </Button>
              </div>
            </div>
            {expandedAdmins.includes(admin.id) && renderAdminDetails(admin)}
          </div>
        ))
      )}
    </div>
  );

  const renderSupportList = (supportUsers: any[]) => (
    <div className="space-y-3">
      {supportUsers.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No support staff found</p>
      ) : (
        supportUsers.map((support: any) => (
          <div key={support.id} className="border rounded-lg p-4 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              <div>
                <p className="font-medium text-sm">{support.firstName} {support.lastName}</p>
                <p className="text-xs text-gray-500">Full Name</p>
              </div>
              <div>
                <p className="text-sm">{support.email}</p>
                <p className="text-xs text-gray-500">Email Address</p>
              </div>
              <div>
                <p className="text-sm">
                  {support.permissionGrantedAt ? new Date(support.permissionGrantedAt).toLocaleString() : 
                   support.createdAt ? new Date(support.createdAt).toLocaleString() : 'N/A'}
                </p>
                <p className="text-xs text-gray-500">Date of Permission</p>
              </div>
              <div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => toggleSupportExpanded(support.id)}
                >
                  {expandedSupport.includes(support.id) ? "Hide Details" : "VIEW SUPPORT"}
                </Button>
              </div>
            </div>
            {expandedSupport.includes(support.id) && renderSupportDetails(support)}
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Access Management</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff Access Administration</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeAccessTab} onValueChange={setActiveAccessTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="administrators">Administrators ({adminUsers.length})</TabsTrigger>
              <TabsTrigger value="support">Support Staff ({supportUsers.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="administrators" className="mt-4">
              {renderAdminsList(adminUsers)}
            </TabsContent>

            <TabsContent value="support" className="mt-4">
              {renderSupportList(supportUsers)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Invite System Section - Section 11
function InviteSection() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("support");
  const [activeInviteTab, setActiveInviteTab] = useState("pending");
  const { toast } = useToast();
  
  const { data: sentInvites = [] } = useQuery({
    queryKey: ['/api/admin/invites/sent'],
    retry: false,
  });

  const { data: pendingInvites = [] } = useQuery({
    queryKey: ['/api/admin/invites/pending'],
    retry: false,
  });

  const { data: rejectedInvites = [] } = useQuery({
    queryKey: ['/api/admin/invites/rejected'],
    retry: false,
  });

  const sendInvite = () => {
    try {
      // API call to send invite would go here
      toast({
        title: "Invite Sent",
        description: `Invitation sent to ${email} successfully.`,
      });
      setEmail("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderInvitesList = (invites: any[], type: string) => (
    <div className="space-y-3">
      {invites.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No {type.toLowerCase()} invites found</p>
      ) : (
        invites.map((invite: any) => (
          <div key={invite.id} className="border rounded-lg p-4 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div>
                <p className="font-medium text-sm">{invite.email}</p>
                <p className="text-xs text-gray-500">Email of Invited User</p>
              </div>
              <div>
                <p className="text-sm">
                  {invite.sentAt ? new Date(invite.sentAt).toLocaleString() : 
                   invite.invitedAt ? new Date(invite.invitedAt).toLocaleString() : 'N/A'}
                </p>
                <p className="text-xs text-gray-500">Date & Time Invited</p>
              </div>
              <div>
                <Badge variant={
                  invite.status === 'pending' ? 'outline' :
                  invite.status === 'accepted' ? 'default' :
                  invite.status === 'rejected' ? 'destructive' :
                  invite.status === 'sent' ? 'secondary' : 'outline'
                }>
                  {invite.status || type}
                </Badge>
                <p className="text-xs text-gray-500 mt-1">Status</p>
              </div>
            </div>
            {type === 'pending' && (
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline">
                  Resend Invite
                </Button>
                <Button size="sm" variant="destructive">
                  Cancel Invite
                </Button>
              </div>
            )}
            {type === 'sent' && invite.acceptedAt && (
              <div className="mt-3 p-2 bg-green-50 rounded border">
                <p className="text-xs text-green-800">
                  <strong>Accepted:</strong> {new Date(invite.acceptedAt).toLocaleString()}
                </p>
              </div>
            )}
            {type === 'rejected' && invite.rejectedAt && (
              <div className="mt-3 p-2 bg-red-50 rounded border">
                <p className="text-xs text-red-800">
                  <strong>Rejected:</strong> {new Date(invite.rejectedAt).toLocaleString()}
                </p>
                {invite.rejectionReason && (
                  <p className="text-xs text-red-700 mt-1">
                    <strong>Reason:</strong> {invite.rejectionReason}
                  </p>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Invite Management</h2>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-500" />
            Send New Invitation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">Email Address</label>
              <Input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Role</label>
              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="support">Support Staff</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <Button onClick={sendInvite} disabled={!email}>
              <UserPlus className="h-4 w-4 mr-2" />
              Send Invite
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invitation Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeInviteTab} onValueChange={setActiveInviteTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending">Pending Invites ({pendingInvites.length})</TabsTrigger>
              <TabsTrigger value="sent">Sent Invites ({sentInvites.length})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected Invites ({rejectedInvites.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-4">
              {renderInvitesList(pendingInvites, 'pending')}
            </TabsContent>

            <TabsContent value="sent" className="mt-4">
              {renderInvitesList(sentInvites, 'sent')}
            </TabsContent>

            <TabsContent value="rejected" className="mt-4">
              {renderInvitesList(rejectedInvites, 'rejected')}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Main Admin Component
export default function Admin() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("main");
  const [sidenavExpanded, setSidenavExpanded] = useState(false);
  const [sidenavHovered, setSidenavHovered] = useState(false);

  // Handle unauthorized access
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }

    if (!isLoading && isAuthenticated && !(user as any)?.isAdmin && !(user as any)?.isSupport) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin panel.",
        variant: "destructive",
      });
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  // Extract tab from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAuthenticated || (!(user as any)?.isAdmin && !(user as any)?.isSupport)) {
    return null;
  }

  const navigationItems = [
    { id: "main", label: "VeriFund", icon: Crown },
    { id: "my-works", label: "My Works", icon: FileText },
    { id: "kyc", label: "KYC", icon: Shield },
    { id: "campaigns", label: "Campaigns", icon: Target },
    { id: "reports", label: "Reports", icon: Flag },
    { id: "tickets", label: "Tickets", icon: MessageSquare },
  ];

  const sidenavItems = [
    { id: "volunteers", label: "Volunteers", icon: Users },
    { id: "financial", label: "Financial", icon: DollarSign },
    { id: "stories", label: "Stories", icon: BookOpen },
    { id: "access", label: "Access", icon: UserPlus },
    { id: "invite", label: "Invite", icon: Mail },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "main": return <VeriFundMainPage />;
      case "my-works": return <MyWorksSection />;
      case "kyc": return <KYCSection />;
      case "campaigns": return <CampaignsSection />;
      case "volunteers": return <VolunteersSection />;
      case "financial": return <FinancialSection />;
      case "reports": return <ReportsSection />;
      case "tickets": return <TicketsSection />;
      case "stories": return <StoriesSection />;
      case "access": return <AccessSection />;
      case "invite": return <InviteSection />;
      default: return <VeriFundMainPage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidenav Overlay - only on mobile when expanded */}
      {sidenavExpanded && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 lg:hidden"
          onClick={() => setSidenavExpanded(false)}
        />
      )}

      {/* Sidenav */}
      <div 
        className={`fixed top-0 left-0 h-full bg-white shadow-xl z-50 transition-all duration-300 ease-in-out border-r border-gray-100 ${
          sidenavExpanded || sidenavHovered ? 'w-80' : 'w-16'
        }`}
        onMouseEnter={() => setSidenavHovered(true)}
        onMouseLeave={() => setSidenavHovered(false)}
      >
        <div className="flex flex-col h-full">
          {/* Sidenav Header */}
          <div className={`flex items-center border-b border-gray-100 transition-all duration-300 ${
            sidenavExpanded || sidenavHovered ? 'justify-between p-6' : 'justify-center p-4'
          }`}>
            {sidenavExpanded || sidenavHovered ? (
              <>
                <div className="flex items-center gap-3">
                  <img 
                    src={verifundLogoV2} 
                    alt="VeriFund Logo" 
                    className="w-8 h-8 object-contain"
                  />
                  <div>
                    <p className="text-xs text-gray-500">Admin Panel</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidenavExpanded(false)}
                  className="text-gray-400 hover:text-gray-600 h-8 w-8 p-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Button>
              </>
            ) : (
              <button
                onClick={() => setSidenavExpanded(true)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <img 
                  src={verifundLogoV2} 
                  alt="VeriFund Logo" 
                  className="w-6 h-6 object-contain"
                />
              </button>
            )}
          </div>

          {/* Profile Section */}
          {(sidenavExpanded || sidenavHovered) && (
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 font-semibold text-sm">
                    {user?.firstName?.charAt(0) || 'A'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {(user as any)?.isAdmin ? 'Administrator' : 'Support Staff'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Content */}
          <div className={`flex-1 overflow-y-auto transition-all duration-300 ${
            sidenavExpanded || sidenavHovered ? 'px-4 py-4' : 'px-2 py-4'
          }`}>
            <div className="space-y-1">
              {(sidenavExpanded || sidenavHovered) && (
                <div className="px-3 py-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Management</h3>
                </div>
              )}
              
              {sidenavItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      if (window.innerWidth < 1024) {
                        setSidenavExpanded(false);
                      }
                    }}
                    className={`w-full flex items-center rounded-lg transition-all duration-150 group relative ${
                      sidenavExpanded || sidenavHovered 
                        ? `gap-3 px-3 py-2.5 text-sm font-medium text-left ${
                            isActive
                              ? "bg-green-50 text-green-700 border border-green-200 shadow-sm"
                              : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                          }`
                        : `justify-center p-2.5 ${
                            isActive
                              ? "bg-green-50 text-green-700"
                              : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                          }`
                    }`}
                    data-testid={`sidenav-${item.id}`}
                    title={!sidenavExpanded && !sidenavHovered ? item.label : undefined}
                  >
                    <div className={`flex items-center justify-center w-5 h-5 ${
                      isActive ? 'text-green-600' : 'text-gray-500 group-hover:text-gray-700'
                    }`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    {(sidenavExpanded || sidenavHovered) && (
                      <>
                        <span className="flex-1">{item.label}</span>
                        {item.id === 'volunteers' && (
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                        {item.id === 'financial' && (
                          <div className="px-1.5 py-0.5 bg-red-100 text-red-600 text-xs rounded-full font-medium">3</div>
                        )}
                      </>
                    )}
                    {!sidenavExpanded && !sidenavHovered && item.id === 'financial' && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          {(sidenavExpanded || sidenavHovered) && (
            <div className="p-4 border-t border-gray-100">
              <div className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-gray-300"></div>
                  <span className="text-xs text-gray-600">Light</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-gray-500 hover:text-gray-700 h-6 px-2"
                  onClick={() => setSidenavExpanded(false)}
                >
                  ← Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Navigation Menu */}
            <div className="flex items-center space-x-8">
              {/* Sidenav Toggle Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidenavExpanded(true)}
                className="text-gray-600 hover:text-gray-800 mr-4 lg:hidden"
              >
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 6h16M4 12h16M4 18h16" 
                  />
                </svg>
              </Button>

              <nav className="flex items-center space-x-6 overflow-x-auto">
                {navigationItems.map((item) => {
                  return (
                    <a
                      key={item.id}
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveTab(item.id);
                      }}
                      className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                        activeTab === item.id
                          ? "text-green-600 border-green-600"
                          : "text-gray-600 border-transparent hover:text-green-600 hover:border-green-300"
                      }`}
                      data-testid={`nav-${item.id}`}
                    >
                      {item.id === 'main' ? (
                        <img 
                          src={verifundLogoV2} 
                          alt="VeriFund" 
                          className="h-6"
                        />
                      ) : (
                        item.label
                      )}
                    </a>
                  );
                })}
              </nav>
            </div>

            {/* User Info & Logout */}
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = "/api/logout"}
                data-testid="button-logout"
              >
                Logout
              </Button>
            </div>
          </div>

        </div>
      </div>
      
      {/* Main Content */}
      <div className={`transition-all duration-300 ${
        sidenavExpanded || sidenavHovered ? 'lg:ml-80' : 'lg:ml-16'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}