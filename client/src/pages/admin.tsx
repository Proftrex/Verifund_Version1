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
  ExternalLink,
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
  Navigation,
  XCircle,
  Clock,
  Mail,
  UserX,
  Heart,
  BarChart,
  Check,
  X,
  Camera,
  ThumbsUp,
  AlertTriangle,
  AlertCircle,
  User as UserIcon,
  Video,
  Image as ImageIcon,
  Activity
} from "lucide-react";
import type { User } from "@shared/schema";
import { parseDisplayId, entityTypeMap, isStandardizedId, generateSearchSuggestions } from '@shared/idUtils';
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
    if (achieved) return 'border-green-200 bg-green-50';
    if (progress > 0) return 'border-yellow-200 bg-yellow-50';
    return 'border-gray-200 bg-gray-50';
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
          ✓ Done
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
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm animate-pulse">
              <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                <div className="h-2 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="w-12 h-5 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const milestones = milestonesData?.milestones || [];
  
  // Sort milestones: pending/in-progress first, then achieved at the end
  const sortedMilestones = [...milestones].sort((a, b) => {
    // First sort by achieved status (false first, true last)
    if (a.achieved !== b.achieved) {
      return a.achieved ? 1 : -1;
    }
    // Within same achievement status, sort by progress (higher progress first)
    return b.progress - a.progress;
  });

  return (
    <div className="h-full flex flex-col max-h-full">
      {/* Milestone List - Scrollable */}
      <div className="flex-1 overflow-y-auto pr-1 pb-2" style={{ maxHeight: 'calc(100% - 120px)' }}>
        <div className="space-y-3">
          {sortedMilestones.map((milestone: any) => {
            const IconComponent = getIcon(milestone.icon);
            return (
              <div 
                key={milestone.id}
                className={`flex items-start gap-3 p-3 rounded-lg border shadow-sm transition-all duration-200 hover:shadow-md ${getBorderColor(milestone.achieved, milestone.progress, milestone.target)} ${milestone.achieved ? 'opacity-75' : ''}`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <IconComponent className={`h-4 w-4 ${getIconColor(milestone.achieved, milestone.progress)}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-xs leading-tight mb-1">{milestone.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{milestone.description}</p>
                  {milestone.progress > 0 && !milestone.achieved && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div 
                          className="bg-yellow-500 h-1 rounded-full transition-all duration-300" 
                          style={{ width: `${(milestone.progress / milestone.target) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0">
                  {getBadge(milestone.achieved, milestone.progress, milestone.target)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Stats Footer - Fixed at bottom */}
      {milestonesData?.stats && (
        <div className="mt-auto pt-3 border-t border-purple-100">
          <div className="p-3 bg-white rounded-lg border border-purple-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-3 w-3 text-purple-600" />
              <h4 className="font-medium text-gray-800 text-xs">Progress Summary</h4>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
              <div>KYC: <span className="font-medium text-purple-600">{milestonesData.stats.kycVerifiedCount}</span></div>
              <div>Campaigns: <span className="font-medium text-purple-600">{milestonesData.stats.campaignsApprovedCount}</span></div>
              <div>Users: <span className="font-medium text-purple-600">{milestonesData.stats.totalUsersCount}</span></div>
              <div>Since: <span className="font-medium text-purple-600">{new Date(milestonesData.stats.adminSince).toLocaleDateString()}</span></div>
            </div>
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
    return { method: 'PUT' as const, url: data.url };
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
      // Force refetch user data immediately
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.refetchQueries({ queryKey: ['/api/auth/user'] });
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
    <div className="container mx-auto px-4 py-6 mt-24 space-y-8">
      {/* Top Section: Profile Info (Left) + Milestones (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Profile Info as Vertical Rectangle */}
        <Card className="flex flex-col" style={{
          aspectRatio: '3/4',
          borderRadius: '12px'
        }}>
          <CardHeader className="flex-shrink-0">
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto pb-3">
            <div className="space-y-4">
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
            
            {/* Complete/Edit Profile Link */}
            <div className="pt-2">
              <button
                onClick={() => setShowCompleteProfile(!showCompleteProfile)}
                className="text-blue-600 hover:text-blue-800 underline text-sm font-medium transition-colors"
                data-testid="button-complete-profile"
              >
                {(user as any)?.isProfileComplete ? "Edit Profile" : "Complete Profile"}
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
            </div>
          </CardContent>
        </Card>

        {/* Right Panel - Milestones Achievement */}
        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 aspect-square w-full flex flex-col">
          <CardHeader className="pb-2 flex-shrink-0">
            <CardTitle className="flex items-center gap-2 text-purple-800 text-base">
              <Star className="h-4 w-4 text-purple-600" />
              Milestones Achievement
            </CardTitle>
            <p className="text-xs text-purple-600 mt-1">Next goals appear first • Achieved goals at bottom</p>
          </CardHeader>
          <CardContent className="flex-1 pb-3 overflow-hidden">
            <AdminMilestones />
          </CardContent>
        </Card>
      </div>

      {/* Platform Analytics Overview Section */}
      <div className="w-full">
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 border-2 rounded-xl">
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

            {/* Real Platform Health Metrics */}
            <div className="mt-4 pt-4 border-t border-blue-100">
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    (analytics?.verifiedUsers || 0) > 0 && (analytics?.activeCampaigns || 0) >= 0 
                      ? 'bg-green-500' 
                      : 'bg-yellow-500'
                  }`}></div>
                  <span className="text-gray-600">System Health: </span>
                  <span className={`font-medium ${
                    (analytics?.verifiedUsers || 0) > 0 && (analytics?.activeCampaigns || 0) >= 0
                      ? 'text-green-600' 
                      : 'text-yellow-600'
                  }`}>
                    {(analytics?.verifiedUsers || 0) > 0 && (analytics?.activeCampaigns || 0) >= 0 
                      ? 'Healthy' 
                      : 'Starting Up'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    (analytics?.activeCampaigns || 0) <= 10 
                      ? 'bg-green-500' 
                      : (analytics?.activeCampaigns || 0) <= 50 
                        ? 'bg-yellow-500' 
                        : 'bg-red-500'
                  }`}></div>
                  <span className="text-gray-600">Response Time: </span>
                  <span className={`font-medium ${
                    (analytics?.activeCampaigns || 0) <= 10 
                      ? 'text-green-600' 
                      : (analytics?.activeCampaigns || 0) <= 50 
                        ? 'text-yellow-600' 
                        : 'text-red-600'
                  }`}>
                    {(analytics?.activeCampaigns || 0) <= 10 
                      ? 'Fast' 
                      : (analytics?.activeCampaigns || 0) <= 50 
                        ? 'Normal' 
                        : 'Slow'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    (analytics?.verifiedUsers || 0) <= 50 
                      ? 'bg-green-500' 
                      : (analytics?.verifiedUsers || 0) <= 200 
                        ? 'bg-yellow-500' 
                        : 'bg-red-500'
                  }`}></div>
                  <span className="text-gray-600">Load: </span>
                  <span className={`font-medium ${
                    (analytics?.verifiedUsers || 0) <= 50 
                      ? 'text-green-600' 
                      : (analytics?.verifiedUsers || 0) <= 200 
                        ? 'text-yellow-600' 
                        : 'text-red-600'
                  }`}>
                    {(analytics?.verifiedUsers || 0) <= 50 
                      ? 'Light' 
                      : (analytics?.verifiedUsers || 0) <= 200 
                        ? 'Moderate' 
                        : 'Heavy'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboards Section - Below all other sections */}
      <div className="w-full">
        <AdminLeaderboards />
      </div>
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-0">
      
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

// Shared Campaign Details Renderer - Used by both Campaign Management and My Works sections
const renderCampaignDetails = (campaign: any) => (
  <div className="mt-4 p-4 bg-green-50 rounded-lg">
    <h5 className="font-semibold mb-4 text-green-800">Complete Campaign Details</h5>
    
    <div className="grid md:grid-cols-2 gap-6">
      {/* Campaign Information */}
      <div className="space-y-4">
        <div>
          <h6 className="font-semibold text-blue-700 border-b border-blue-200 pb-1 mb-3">Campaign Information</h6>
          <div className="space-y-2 text-sm">
            <p><strong>Campaign ID:</strong> {campaign.campaignDisplayId || (campaign.id.slice(0, 8) + '...' + campaign.id.slice(-4))}</p>
            <p><strong>Title:</strong> {campaign.title}</p>
            <p><strong>Category:</strong> <Badge variant="outline">{campaign.category || 'General'}</Badge></p>
            <p><strong>Status:</strong> <Badge variant={campaign.status === 'active' ? 'default' : campaign.status === 'pending' ? 'secondary' : 'outline'}>{campaign.status}</Badge></p>
            <p><strong>Duration:</strong> {campaign.duration} days</p>
            <p><strong>Created:</strong> {new Date(campaign.createdAt).toLocaleDateString()}</p>
            <p><strong>Start Date:</strong> {campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : 'Not set'}</p>
            <p><strong>End Date:</strong> {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : 'Not set'}</p>
            <p><strong>TES Verified:</strong> <Badge variant={campaign.tesVerified ? 'default' : 'secondary'}>{campaign.tesVerified ? 'Yes' : 'No'}</Badge></p>
          </div>
        </div>

        {/* Processing Information */}
        {(campaign.status === 'active' || campaign.status === 'rejected' || campaign.status === 'on_progress') && (
          <div>
            <h6 className="font-semibold text-indigo-700 border-b border-indigo-200 pb-1 mb-3">Processing Information</h6>
            <div className="space-y-2 text-sm">
              {campaign.status === 'active' && campaign.approvedBy && (
                <>
                  <p><strong>Processed by:</strong> {campaign.approvedByEmail || campaign.approvedBy}</p>
                  <p><strong>Approved date & time:</strong> {campaign.approvedAt ? new Date(campaign.approvedAt).toLocaleString() : 'Not available'}</p>
                  <p><strong>Approval reason:</strong> {campaign.approvalReason || 'No reason provided'}</p>
                </>
              )}
              {campaign.status === 'rejected' && campaign.rejectedBy && (
                <>
                  <p><strong>Processed by:</strong> {campaign.rejectedByEmail || campaign.rejectedBy}</p>
                  <p><strong>Rejected date & time:</strong> {campaign.rejectedAt ? new Date(campaign.rejectedAt).toLocaleString() : 'Not available'}</p>
                  <p><strong>Rejection reason:</strong> {campaign.rejectionReason || 'No reason provided'}</p>
                </>
              )}
              {campaign.claimedBy && (
                <>
                  <p><strong>Claimed by:</strong> {campaign.claimedByEmail || campaign.claimedBy}</p>
                  <p><strong>Claimed date & time:</strong> {campaign.claimedAt ? new Date(campaign.claimedAt).toLocaleString() : 'Not available'}</p>
                </>
              )}
            </div>
          </div>
        )}

        <div>
          <h6 className="font-semibold text-purple-700 border-b border-purple-200 pb-1 mb-3">Financial Details</h6>
          <div className="space-y-2 text-sm">
            <p><strong>Goal Amount:</strong> ₱{campaign.goalAmount?.toLocaleString() || '0'}</p>
            <p><strong>Minimum Amount:</strong> ₱{campaign.minimumAmount?.toLocaleString() || '0'}</p>
            <p><strong>Current Amount:</strong> ₱{campaign.currentAmount?.toLocaleString() || '0'}</p>
            <p><strong>Claimed Amount:</strong> ₱{campaign.claimedAmount?.toLocaleString() || '0'}</p>
            <p><strong>Progress:</strong> 
              <span className="ml-2 font-semibold text-green-600">
                {campaign.goalAmount ? Math.round((campaign.currentAmount / campaign.goalAmount) * 100) : 0}%
              </span>
            </p>
            <p><strong>Contributors:</strong> {campaign.contributorsCount || 0}</p>
          </div>
        </div>

        <div>
          <h6 className="font-semibold text-orange-700 border-b border-orange-200 pb-1 mb-3">Location Details</h6>
          <div className="space-y-2 text-sm">
            <p><strong>Street:</strong> {campaign.street || 'Not provided'}</p>
            <p><strong>Barangay:</strong> {campaign.barangay || 'Not provided'}</p>
            <p><strong>City:</strong> {campaign.city || 'Not provided'}</p>
            <p><strong>Province:</strong> {campaign.province || 'Not provided'}</p>
            <p><strong>Region:</strong> {campaign.region || 'Not provided'}</p>
            <p><strong>Zipcode:</strong> {campaign.zipcode || 'Not provided'}</p>
            <p><strong>Landmark:</strong> {campaign.landmark || 'Not provided'}</p>
          </div>
        </div>

        {campaign.needsVolunteers && (
          <div>
            <h6 className="font-semibold text-red-700 border-b border-red-200 pb-1 mb-3">Volunteer Information</h6>
            <div className="space-y-2 text-sm">
              <p><strong>Needs Volunteers:</strong> <Badge variant="default">Yes</Badge></p>
              <p><strong>Volunteer Slots:</strong> {campaign.volunteerSlots}</p>
              <p><strong>Slots Filled:</strong> {campaign.volunteerSlotsFilledCount || 0}</p>
              <p><strong>Available Slots:</strong> {(campaign.volunteerSlots || 0) - (campaign.volunteerSlotsFilledCount || 0)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Campaign Images and Description */}
      <div className="space-y-4">
        <div>
          <h6 className="font-semibold text-green-700 border-b border-green-200 pb-1 mb-3">Campaign Images</h6>
          {campaign.images ? (
            <div className="grid grid-cols-2 gap-3">
              {(() => {
                try {
                  // Try to parse as JSON array first
                  const imageArray = JSON.parse(campaign.images);
                  return Array.isArray(imageArray) ? imageArray : [campaign.images];
                } catch {
                  // If parsing fails, treat as single URL string
                  return [campaign.images];
                }
              })().map((imageUrl: string, index: number) => (
                <div key={index} className="relative group">
                  <img 
                    src={imageUrl} 
                    alt={`Campaign image ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border hover:opacity-80 transition-opacity cursor-pointer"
                    onClick={() => window.open(imageUrl, '_blank')}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                    <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">Click to view full size</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No images uploaded</p>
          )}
        </div>

        <div>
          <h6 className="font-semibold text-gray-700 border-b border-gray-200 pb-1 mb-3">Full Description</h6>
          <div className="bg-white p-3 rounded-lg border max-h-64 overflow-y-auto">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{campaign.description || 'No description provided'}</p>
          </div>
        </div>

        {(campaign.claimedBy || campaign.claimedAt) && (
          <div>
            <h6 className="font-semibold text-blue-700 border-b border-blue-200 pb-1 mb-3">Admin Review Info</h6>
            <div className="space-y-2 text-sm bg-white p-3 rounded-lg border">
              {campaign.claimedBy && <p><strong>Claimed By:</strong> {campaign.claimedBy}</p>}
              {campaign.claimedAt && <p><strong>Claimed At:</strong> {new Date(campaign.claimedAt).toLocaleString()}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);

// My Works Section Component - Section 2
function MyWorksSection() {
  const [activeTab, setActiveTab] = useState("pending-kyc");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: analytics } = useQuery({
    queryKey: ['/api/admin/my-works/analytics'],
    retry: false,
  });

  const { data: claimedKyc = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/my-works/kyc-claimed'],
    retry: false,
  });

  const { data: claimedReports = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/my-works/documents'],
    retry: false,
  });

  const { data: claimedCampaignReports = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/my-works/campaigns-claimed'],
    retry: false,
  });

  const { data: claimedCampaigns = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/my-works/campaigns'],
    retry: false,
  });

  const { data: claimedCreatorReports = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/my-works/creators'],
    retry: false,
  });

  const { data: claimedVolunteerReports = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/my-works/volunteers'],
    retry: false,
  });

  const { data: claimedTransactionReports = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/my-works/transactions'],
    retry: false,
  });

  // Enhanced badge component with color coding
  const getStatusBadge = (status: string, type: 'kyc' | 'campaign' | 'report' = 'report') => {
    const statusLower = status?.toLowerCase().replace('_', '_') || '';
    
    // Color mapping based on status - Yellow for pending/in progress
    if (statusLower === 'pending' || statusLower === 'on_progress' || statusLower === 'claimed') {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">{status}</Badge>;
    }
    // Green for success states
    if (statusLower === 'approved' || statusLower === 'verified' || statusLower === 'resolved' || statusLower === 'completed' || statusLower === 'active') {
      return <Badge className="bg-green-100 text-green-800 border-green-300">{status}</Badge>;
    }
    // Red for negative states
    if (statusLower === 'rejected' || statusLower === 'declined' || statusLower === 'failed' || statusLower === 'suspended' || statusLower === 'flagged') {
      return <Badge className="bg-red-100 text-red-800 border-red-300">{status}</Badge>;
    }
    // Blue for closed/ended states
    if (statusLower === 'closed' || statusLower === 'closed_with_refund' || statusLower === 'ended') {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-300">{status}</Badge>;
    }
    // Default gray
    return <Badge className="bg-gray-100 text-gray-700 border-gray-300">{status}</Badge>;
  };

  // Sort function to prioritize pending reports
  const sortByPriority = (items: any[]) => {
    return [...items].sort((a, b) => {
      const statusA = (a.status || a.kycStatus || '').toLowerCase();
      const statusB = (b.status || b.kycStatus || '').toLowerCase();
      
      // Priority order: pending/in_progress -> flagged -> others
      const getPriority = (status: string) => {
        if (status === 'pending' || status === 'on_progress') return 1;
        if (status === 'flagged' || status === 'claimed') return 2;
        if (status === 'rejected' || status === 'failed') return 3;
        return 4;
      };
      
      const priorityA = getPriority(statusA);
      const priorityB = getPriority(statusB);
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // Secondary sort by creation date (newest first)
      const dateA = new Date(a.createdAt || a.claimedAt || 0).getTime();
      const dateB = new Date(b.createdAt || b.claimedAt || 0).getTime();
      return dateB - dateA;
    });
  };

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

  // Report details rendering will use the external ReportDetails component

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
      console.log("🚀 Admin Page: Starting approval for:", { itemId, itemType, reason });
      const endpoint = itemType === 'kyc' ? `/api/admin/kyc/${itemId}/approve` : `/api/admin/campaigns/${itemId}/approve`;
      console.log("📍 Admin Page: Calling endpoint:", endpoint);
      try {
        const response = await apiRequest('POST', endpoint, { reason });
        console.log("✅ Admin Page: Approval successful:", response);
        return response;
      } catch (error) {
        console.error("❌ Admin Page: Approval failed:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Approved Successfully",
        description: "The request has been approved.",
      });
      // Invalidate all campaign-related queries
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/kyc-claimed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/campaigns/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/campaigns/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/campaigns/rejected'] });
      closeApprovalDialog();
    },
    onError: (error: any) => {
      console.error("❌ Admin Page: Approval error:", error);
      toast({
        title: "Approval Failed",
        description: error.message || "Failed to approve request.",
        variant: "destructive",
      });
    },
  });

  const rejectItemMutation = useMutation({
    mutationFn: async ({ itemId, itemType, reason }: { itemId: string; itemType: string; reason: string }) => {
      console.log("🚀 Admin Page: Starting rejection for:", { itemId, itemType, reason });
      const endpoint = itemType === 'kyc' ? `/api/admin/kyc/${itemId}/reject` : `/api/admin/campaigns/${itemId}/reject`;
      console.log("📍 Admin Page: Calling endpoint:", endpoint);
      try {
        const response = await apiRequest('POST', endpoint, { reason });
        console.log("✅ Admin Page: Rejection successful:", response);
        return response;
      } catch (error) {
        console.error("❌ Admin Page: Rejection failed:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Rejected Successfully",
        description: "The request has been rejected.",
      });
      // Invalidate all campaign-related queries  
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/kyc-claimed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/campaigns/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/campaigns/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/campaigns/rejected'] });
      closeApprovalDialog();
    },
    onError: (error: any) => {
      console.error("❌ Admin Page: Rejection error:", error);
      toast({
        title: "Rejection Failed",
        description: error.message || "Failed to reject request.",
        variant: "destructive",
      });
    },
  });

  const handleApprovalSubmit = () => {
    if (!approvalDialog.itemId || !approvalDialog.type) return;
    
    const finalReason = approvalDialog.reason === 'custom' ? approvalDialog.customReason : approvalDialog.reason;
    
    if (approvalDialog.type === 'approve') {
      approveItemMutation.mutate({
        itemId: approvalDialog.itemId,
        itemType: approvalDialog.itemType,
        reason: finalReason
      });
    } else if (approvalDialog.type === 'reject') {
      rejectItemMutation.mutate({
        itemId: approvalDialog.itemId,
        itemType: approvalDialog.itemType,
        reason: finalReason
      });
    }
  };

  // KYC Section Component 
  const KycSection = () => {
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
            <p className="text-xl font-bold">{analytics?.kyc || '-'}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Document Reports</p>
            <p className="text-xl font-bold">{analytics?.documents || '-'}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-6 w-6 text-purple-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Creator Reports</p>
            <p className="text-xl font-bold">{analytics?.campaigns || '-'}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 text-orange-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Volunteer Reports</p>
            <p className="text-xl font-bold">{analytics?.volunteers || '-'}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Flag className="h-6 w-6 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">User Reports</p>
            <p className="text-xl font-bold">{analytics?.userReports || '-'}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Transaction Reports</p>
            <p className="text-xl font-bold">{analytics?.financial || '-'}</p>
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
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-1">
              <TabsTrigger value="pending-kyc" className="text-xs lg:text-sm px-1 lg:px-3">Pending KYC ({claimedKyc.length})</TabsTrigger>
              <TabsTrigger value="campaigns" className="text-xs lg:text-sm px-1 lg:px-3">Campaigns ({claimedCampaigns.length})</TabsTrigger>
              <TabsTrigger value="document-reports" className="text-xs lg:text-sm px-1 lg:px-3">Document Reports ({claimedReports.length})</TabsTrigger>
              <TabsTrigger value="campaign-reports" className="text-xs lg:text-sm px-1 lg:px-3">Campaign Reports ({claimedCampaignReports.length})</TabsTrigger>
              <TabsTrigger value="creator-reports" className="text-xs lg:text-sm px-1 lg:px-3">Creator Reports ({claimedCreatorReports.length})</TabsTrigger>
              <TabsTrigger value="volunteer-reports" className="text-xs lg:text-sm px-1 lg:px-3">Volunteer Reports ({claimedVolunteerReports.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pending-kyc" className="mt-4">
              <div className="space-y-3">
                {claimedKyc.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No pending KYC requests claimed</p>
                ) : (
                  sortByPriority(claimedKyc).map((kyc: any) => (
                    <div key={kyc.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{kyc.firstName} {kyc.lastName}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-gray-600">User ID:</span>
                            <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                              <span className="font-mono" data-testid={`user-display-id-${kyc.id}`}>
                                {kyc.userDisplayId}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(kyc.kycStatus || kyc.status, 'kyc')}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => toggleExpanded(kyc.id)}
                          >
                            {expandedItems.includes(kyc.id) ? "Hide Details" : "View Details"}
                          </Button>
                          {kyc.kycStatus === 'on_progress' && (
                            <>
                              <Button 
                                size="sm"
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
                            </>
                          )}
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
                                  <div className="flex items-center gap-2">
                                    <strong>User ID:</strong>
                                    <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                      <span className="font-mono">{kyc.userDisplayId || (kyc.id.slice(0, 8) + '...' + kyc.id.slice(-4))}</span>
                                      {!kyc.userDisplayId && (
                                        <button
                                          onClick={() => {
                                            navigator.clipboard.writeText(kyc.id);
                                          }}
                                          className="text-green-700 hover:text-green-900 text-xs underline ml-2"
                                          title="Click to copy full User ID"
                                        >
                                          Copy ID
                                        </button>
                                      )}
                                    </div>
                                  </div>
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

                          {/* KYC Documents Section */}
                          {kyc.kycDocuments && (
                            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                              <h4 className="font-semibold mb-3 text-red-700 flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                KYC Documents for Review
                              </h4>
                              <div className="grid md:grid-cols-2 gap-4">
                                {(() => {
                                  try {
                                    const docs = JSON.parse(kyc.kycDocuments);
                                    return (
                                      <>
                                        {/* Government ID */}
                                        {docs.valid_id && (
                                          <div className="space-y-2">
                                            <p className="font-medium text-sm text-gray-700">Government ID</p>
                                            <div className="border rounded-lg p-2 bg-white">
                                              <img 
                                                src={docs.valid_id} 
                                                alt="Government ID"
                                                className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => window.open(docs.valid_id, '_blank')}
                                              />
                                              <Button 
                                                size="sm" 
                                                variant="outline" 
                                                className="w-full mt-2"
                                                onClick={() => window.open(docs.valid_id, '_blank')}
                                              >
                                                <ExternalLink className="w-4 h-4 mr-1" />
                                                View Full Size
                                              </Button>
                                            </div>
                                          </div>
                                        )}

                                        {/* Proof of Address */}
                                        {docs.proof_of_address && (
                                          <div className="space-y-2">
                                            <p className="font-medium text-sm text-gray-700">Proof of Address</p>
                                            <div className="border rounded-lg p-2 bg-white">
                                              {docs.proof_of_address.toLowerCase().includes('.pdf') ? (
                                                <div className="flex items-center justify-center h-32 bg-gray-100 rounded">
                                                  <div className="text-center">
                                                    <FileText className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                                                    <p className="text-sm text-gray-600">PDF Document</p>
                                                  </div>
                                                </div>
                                              ) : (
                                                <img 
                                                  src={docs.proof_of_address} 
                                                  alt="Proof of Address"
                                                  className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                                                  onClick={() => window.open(docs.proof_of_address, '_blank')}
                                                />
                                              )}
                                              <Button 
                                                size="sm" 
                                                variant="outline" 
                                                className="w-full mt-2"
                                                onClick={() => window.open(docs.proof_of_address, '_blank')}
                                              >
                                                <ExternalLink className="w-4 h-4 mr-1" />
                                                View Document
                                              </Button>
                                            </div>
                                          </div>
                                        )}
                                      </>
                                    );
                                  } catch (e) {
                                    return <p className="text-sm text-gray-500">Unable to parse KYC documents</p>;
                                  }
                                })()}
                              </div>
                            </div>
                          )}
                          
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
                  sortByPriority(claimedCampaigns).map((campaign: any) => (
                    <div key={campaign.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{campaign.title}</h4>
                          <p className="text-sm text-gray-600">Campaign ID: {campaign.campaignDisplayId || `CAM-${campaign.id.slice(0, 6)}`}</p>
                          <p className="text-sm text-gray-500">Creator: {campaign.creator?.firstName} {campaign.creator?.lastName}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(campaign.status, 'campaign')}
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
                        <div>
                          {/* Full Campaign Details */}
                          {renderCampaignDetails(campaign)}
                          
                          {/* Approve/Reject Actions - Only show for pending campaigns */}
                          {campaign.status === 'pending' && (
                            <div className="flex gap-2 pt-4 mt-4 border-t">
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
                          )}
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
                  sortByPriority(claimedReports).map((report: any) => (
                    <div key={report.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">Document Report #{report.id.slice(0, 8)}</h4>
                          <p className="text-sm text-gray-600">Type: {report.reportType || 'Document'}</p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 flex-shrink-0">
                          {getStatusBadge(report.status, 'report')}
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-xs px-2 whitespace-nowrap"
                            onClick={() => toggleExpanded(report.id)}
                          >
                            {expandedItems.includes(report.id) ? "Hide" : "View"}
                          </Button>
                        </div>
                      </div>
                      {expandedItems.includes(report.id) && <ReportDetails report={report} />}
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="campaign-reports" className="mt-4">
              <div className="space-y-3">
                {claimedCampaignReports.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No campaign reports claimed</p>
                ) : (
                  sortByPriority(claimedCampaignReports).map((report: any) => (
                    <div key={report.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">Campaign Report #{report.id.slice(0, 8)}</h4>
                          <p className="text-sm text-gray-600">Type: {report.reportType || 'Campaign'}</p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 flex-shrink-0">
                          {getStatusBadge(report.status, 'report')}
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-xs px-2 whitespace-nowrap"
                            onClick={() => toggleExpanded(report.id)}
                          >
                            {expandedItems.includes(report.id) ? "Hide" : "View"}
                          </Button>
                        </div>
                      </div>
                      {expandedItems.includes(report.id) && <ReportDetails report={report} />}
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="creator-reports" className="mt-4">
              <div className="space-y-3">
                {claimedCreatorReports.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No creator reports claimed</p>
                ) : (
                  sortByPriority(claimedCreatorReports).map((report: any) => (
                      <div key={report.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">Creator Report #{report.id.slice(0, 8)}</h4>
                            <p className="text-sm text-gray-600">Type: {report.reportType || 'Creator'}</p>
                          </div>
                          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 flex-shrink-0">
                            {getStatusBadge(report.status, 'report')}
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-xs px-2 whitespace-nowrap"
                              onClick={() => toggleExpanded(report.id)}
                            >
                              {expandedItems.includes(report.id) ? "Hide" : "View"}
                            </Button>
                          </div>
                        </div>
                        {expandedItems.includes(report.id) && <ReportDetails report={report} />}
                      </div>
                    ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="volunteer-reports" className="mt-4">
              <div className="space-y-3">
                {claimedVolunteerReports.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No volunteer reports claimed</p>
                ) : (
                  sortByPriority(claimedVolunteerReports).map((report: any) => (
                      <div key={report.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">Volunteer Report #{report.id.slice(0, 8)}</h4>
                            <p className="text-sm text-gray-600">Type: {report.reportType || 'Volunteer'}</p>
                          </div>
                          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 flex-shrink-0">
                            {getStatusBadge(report.status, 'report')}
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-xs px-2 whitespace-nowrap"
                              onClick={() => toggleExpanded(report.id)}
                            >
                              {expandedItems.includes(report.id) ? "Hide" : "View"}
                            </Button>
                          </div>
                        </div>
                        {expandedItems.includes(report.id) && <ReportDetails report={report} />}
                      </div>
                    ))
                )}
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
  };

  return <KycSection />;
}

// KYC Management Section - Section 3
function KYCSection() {
  const [activeKycTab, setActiveKycTab] = useState("basic");
  const [expandedUsers, setExpandedUsers] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
            <div className="flex items-center gap-2 mb-2">
              <strong>User ID:</strong>
              <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                <span className="font-mono" data-testid={`user-display-id-${user.id}`}>{user.userDisplayId || user.id}</span>
              </div>
            </div>
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

  // KYC Claim Mutation
  const claimKycMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("POST", `/api/admin/kyc/${userId}/claim`, {});
    },
    onSuccess: () => {
      toast({
        title: "KYC Request Claimed",
        description: "You have successfully claimed this KYC request for review.",
      });
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kyc/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/my-works/kyc-claimed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/my-works/analytics"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to claim KYC request. Please try again.",
        variant: "destructive",
      });
    },
  });

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
                    onClick={() => claimKycMutation.mutate(user.id)}
                    disabled={claimKycMutation.isPending}
                    data-testid={`button-claim-kyc-${user.id}`}
                  >
                    {claimKycMutation.isPending ? "Claiming..." : "CLAIM"}
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
  const queryClient = useQueryClient();

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

  const claimCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      console.log("🚀 Claiming campaign:", campaignId);
      return await apiRequest('POST', `/api/admin/campaigns/${campaignId}/claim`, {});
    },
    onSuccess: () => {
      console.log("✅ Campaign claimed successfully");
      toast({
        title: "Campaign Claimed",
        description: "You have successfully claimed this campaign for review.",
      });
      // Force refresh campaign lists (refetch instead of just invalidate)
      queryClient.refetchQueries({ queryKey: ['/api/admin/campaigns/pending'] });
      queryClient.refetchQueries({ queryKey: ['/api/admin/my-works/campaigns'] });
      queryClient.refetchQueries({ queryKey: ['/api/admin/my-works/analytics'] });
      // Also invalidate for other components
      queryClient.invalidateQueries({ queryKey: ['/api/admin/campaigns'] });
    },
    onError: (error: any) => {
      console.error("❌ Failed to claim campaign:", error);
      toast({
        title: "Error",
        description: "Failed to claim campaign. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleClaimCampaign = (campaignId: string) => {
    claimCampaignMutation.mutate(campaignId);
  };

  const renderCreatorDetails = (creator: any) => (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
      <h5 className="font-semibold mb-4 text-blue-800">Complete Creator Profile</h5>
      
      {/* Main Profile Section */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={creator?.profileImageUrl} />
            <AvatarFallback className="text-lg">{creator?.firstName?.[0]}{creator?.lastName?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h6 className="text-lg font-semibold">{creator?.firstName} {creator?.middleInitial && creator?.middleInitial + '. '}{creator?.lastName}</h6>
            <p className="text-gray-600">{creator?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm"><strong>User ID:</strong></span>
              <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                <span className="font-mono" data-testid={`creator-display-id-${creator?.id}`}>{creator?.userDisplayId || creator?.id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Personal Information */}
        <div className="space-y-3">
          <h6 className="font-semibold text-green-700 border-b border-green-200 pb-1">Personal Information</h6>
          <div className="space-y-2 text-sm">
            <p><strong>Contact Number:</strong> {creator?.contactNumber || creator?.phoneNumber || 'Not provided'}</p>
            <p><strong>Address:</strong> {creator?.address || 'Not provided'}</p>
            <p><strong>Birthday:</strong> {creator?.birthday ? new Date(creator?.birthday).toLocaleDateString() : 'Not provided'}</p>
            <p><strong>Location:</strong> {creator?.location || 'Not provided'}</p>
            <p><strong>Languages:</strong> {creator?.languages || 'Not provided'}</p>
            <p><strong>Registration Date:</strong> {new Date(creator?.createdAt || Date.now()).toLocaleDateString()}</p>
            <p><strong>KYC Status:</strong> <Badge variant={creator?.kycStatus === 'verified' ? 'default' : creator?.kycStatus === 'pending' ? 'secondary' : 'destructive'}>{creator?.kycStatus || 'pending'}</Badge></p>
            {creator?.bio && (
              <div>
                <strong>Bio:</strong>
                <p className="text-gray-600 mt-1">{creator?.bio}</p>
              </div>
            )}
            {creator?.interests && (
              <div>
                <strong>Interests:</strong>
                <p className="text-gray-600 mt-1">{creator?.interests}</p>
              </div>
            )}
            {creator?.funFacts && (
              <div>
                <strong>Fun Facts:</strong>
                <p className="text-gray-600 mt-1">{creator?.funFacts}</p>
              </div>
            )}
          </div>
        </div>

        {/* Professional Information */}
        <div className="space-y-3">
          <h6 className="font-semibold text-blue-700 border-b border-blue-200 pb-1">Professional Details</h6>
          <div className="space-y-2 text-sm">
            <p><strong>Education:</strong> {creator?.education || 'Not provided'}</p>
            <p><strong>Profession:</strong> {creator?.profession || 'Not provided'}</p>
            <p><strong>Organization:</strong> {creator?.organizationName || 'Not provided'}</p>
            <p><strong>Organization Type:</strong> {creator?.organizationType || 'Not provided'}</p>
            {creator?.linkedinProfile && (
              <p><strong>LinkedIn:</strong> 
                <a href={creator?.linkedinProfile} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                  View Profile
                </a>
              </p>
            )}
            {creator?.workExperience && (
              <div>
                <strong>Work Experience:</strong>
                <p className="text-gray-600 mt-1">{creator?.workExperience}</p>
              </div>
            )}
            {creator?.workExperienceDetails && (
              <div>
                <strong>Work Experience Details:</strong>
                <p className="text-gray-600 mt-1">{creator?.workExperienceDetails}</p>
              </div>
            )}
            {creator?.skills && (
              <div>
                <strong>Skills:</strong>
                <p className="text-gray-600 mt-1">{creator?.skills}</p>
              </div>
            )}
            {creator?.certifications && (
              <div>
                <strong>Certifications:</strong>
                <p className="text-gray-600 mt-1">{creator?.certifications}</p>
              </div>
            )}
          </div>
        </div>

        {/* Platform Scores & Statistics */}
        <div className="space-y-3">
          <h6 className="font-semibold text-purple-700 border-b border-purple-200 pb-1">Platform Scores & Stats</h6>
          <div className="space-y-3 text-sm">
            <div className="bg-white p-3 rounded-lg border">
              <p className="font-medium mb-2">Credibility & Trust Scores</p>
              <div className="space-y-1">
                <p><strong>Credibility Score:</strong> 
                  <span className="text-lg font-semibold ml-2 text-purple-600">
                    {creator?.credibilityScore || '100.00'}
                  </span>
                </p>
                <p><strong>Social Score:</strong> 
                  <span className="ml-2 text-blue-600 font-semibold">
                    {creator?.socialScore || '0'} pts
                  </span>
                </p>
                <p><strong>Reliability Score:</strong> 
                  <span className="flex items-center gap-1 ml-2">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="font-semibold">{creator?.reliabilityScore || '0.00'}</span>
                    <span className="text-gray-500">({creator?.reliabilityRatingsCount || 0} ratings)</span>
                  </span>
                </p>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border">
              <p className="font-medium mb-2">Campaign Statistics</p>
              <div className="space-y-1">
                <p><strong>Campaigns Created:</strong> {creator?.campaignsCreated || 0}</p>
                <p><strong>Total Raised:</strong> ₱{creator?.totalRaised || '0'}</p>
                <p><strong>Campaign Chances Left:</strong> {creator?.remainingCampaignChances || 2}</p>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border">
              <p className="font-medium mb-2">Account Status</p>
              <div className="space-y-1">
                <p><strong>Account Status:</strong> 
                  <Badge variant={creator?.accountStatus === 'active' ? 'default' : 'destructive'} className="ml-2">
                    {creator?.accountStatus || 'active'}
                  </Badge>
                </p>
                <p><strong>Profile Complete:</strong> 
                  <Badge variant={creator?.isProfileComplete ? 'default' : 'secondary'} className="ml-2">
                    {creator?.isProfileComplete ? 'Yes' : 'No'}
                  </Badge>
                </p>
                {creator?.isFlagged && (
                  <div>
                    <p><strong>⚠️ Flagged:</strong> {creator?.flagReason}</p>
                    <p className="text-xs text-gray-500">Flagged on: {new Date(creator?.flaggedAt).toLocaleDateString()}</p>
                  </div>
                )}
                {creator?.isSuspended && (
                  <div>
                    <p><strong>🚫 Suspended:</strong> {creator?.suspensionReason}</p>
                    <p className="text-xs text-gray-500">Suspended on: {new Date(creator?.suspendedAt).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border">
              <p className="font-medium mb-2">Wallet Balances</p>
              <div className="space-y-1">
                <p><strong>PHP Balance:</strong> ₱{creator?.phpBalance || '0.00'}</p>
                <p><strong>Tips Balance:</strong> ₱{creator?.tipsBalance || '0.00'}</p>
                <p><strong>Contributions Balance:</strong> ₱{creator?.contributionsBalance || '0.00'}</p>
              </div>
            </div>
          </div>
        </div>
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
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-medium">{campaign.title}</h4>
                  {campaign.campaignDisplayId && (
                    <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                      <span className="font-mono" data-testid={`campaign-display-id-${campaign.id}`}>
                        {campaign.campaignDisplayId}
                      </span>
                    </div>
                  )}
                  {campaign.claimedBy && (
                    <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium border border-gray-300">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                        CLAIMED by {campaign.claimedBy}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">{campaign.description?.substring(0, 100)}...</p>
                <div className="flex items-center gap-4 text-sm">
                  <span>Goal: ₱{campaign.goalAmount?.toLocaleString() || '0'}</span>
                  <span>Current: ₱{campaign.currentAmount?.toLocaleString() || '0'}</span>
                  <Badge variant="outline">{campaign.category || 'General'}</Badge>
                </div>
              </div>
              <div className="flex flex-col gap-2 ml-4">
                {showClaimButton && !campaign.claimedBy && (
                  <Button 
                    size="sm" 
                    variant="default"
                    onClick={() => handleClaimCampaign(campaign.id)}
                    disabled={claimCampaignMutation.isPending}
                    data-testid={`button-claim-campaign-${campaign.id}`}
                  >
                    {claimCampaignMutation.isPending ? "Claiming..." : "CLAIM"}
                  </Button>
                )}
                {showClaimButton && campaign.claimedBy && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    disabled
                    className="opacity-50 cursor-not-allowed bg-gray-100 text-gray-500"
                    data-testid={`button-claimed-campaign-${campaign.id}`}
                  >
                    ✓ CLAIMED
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
                <div className="text-sm text-gray-600">Closed</div>
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
  const queryClient = useQueryClient();

  const { data: opportunities = [] } = useQuery({
    queryKey: ['/api/admin/volunteer-opportunities'],
    retry: false,
  });

  const { data: applications = [] } = useQuery({
    queryKey: ['/api/admin/volunteer-applications'],
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
  const queryClient = useQueryClient();

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
            <p className="text-xs text-gray-500">User ID: {transaction.user?.userDisplayId || transaction.userId || 'N/A'}</p>
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
                  <div className="flex items-center gap-2">
                    {transaction.transactionDisplayId && (
                      <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                        <span className="font-mono" data-testid={`transaction-display-id-${transaction.id}`}>
                          {transaction.transactionDisplayId}
                        </span>
                      </div>
                    )}
                    {!transaction.transactionDisplayId && (
                      <p className="text-sm font-mono">
                        {(transaction.transactionId || transaction.blockchainTxId || transaction.id || 'N/A').substring(0, 12)}...
                      </p>
                    )}
                  </div>
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
      <div className="space-y-4">
        {/* First Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Blockchain Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeFinancialTab} onValueChange={setActiveFinancialTab}>
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-1">
              <TabsTrigger value="deposits" className="text-xs px-1 lg:px-2">Deposits ({deposits.length})</TabsTrigger>
              <TabsTrigger value="withdrawals" className="text-xs px-1 lg:px-2">Withdrawals ({withdrawals.length})</TabsTrigger>
              <TabsTrigger value="contributions-tips" className="text-xs px-1 lg:px-2">Contributions & Tips ({contributions.length + tips.length})</TabsTrigger>
              <TabsTrigger value="claimed" className="text-xs px-1 lg:px-2">Claimed ({claimedContributions.length + claimedTips.length})</TabsTrigger>
              <TabsTrigger value="pending" className="text-xs px-1 lg:px-2">Pending ({pendingTransactions.length})</TabsTrigger>
              <TabsTrigger value="completed" className="text-xs px-1 lg:px-2">Completed ({completedTransactions.length})</TabsTrigger>
              <TabsTrigger value="failed" className="text-xs px-1 lg:px-2">Failed ({failedTransactions.length})</TabsTrigger>
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

// Report Details Component - Extracted to avoid hooks violations
const ReportDetails = ({ report }: { report: any }) => {
  // Temporarily simplified to fix syntax error
  return <div>Report details for {report.id}</div>;
};

// Reports Section Component
function ReportsSection() {
  const { data: reports = [] } = useQuery({ queryKey: ['/api/reports'] });
  const [selectedReport, setSelectedReport] = useState<any>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <AlertCircle className="w-6 h-6 text-red-600" />
        <h2 className="text-2xl font-bold">Reports Management</h2>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.length === 0 ? (
              <p className="text-gray-500">No reports found</p>
            ) : (
              reports.map((report: any) => (
                <div 
                  key={report.id} 
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedReport(report)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{report.title || `Report #${report.id}`}</h3>
                      <p className="text-sm text-gray-600">{report.description}</p>
                      <p className="text-xs text-gray-400">
                        Status: {report.status} | Type: {report.reportType}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                      report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {selectedReport && (
        <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Report Details</DialogTitle>
            </DialogHeader>
            <ReportDetails report={selectedReport} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function AdminOverview() {
  // Fetch all data for analytics
  const { data: users = [] } = useQuery({ queryKey: ['/api/users'] });
  const { data: campaigns = [] } = useQuery({ queryKey: ['/api/campaigns'] });
  const { data: contributions = [] } = useQuery({ queryKey: ['/api/contributions'] });
  const { data: volunteers = [] } = useQuery({ queryKey: ['/api/volunteers'] });
  const { data: reports = [] } = useQuery({ queryKey: ['/api/reports'] });
  const { data: transactions = [] } = useQuery({ queryKey: ['/api/transactions'] });

  // Calculate metrics
  const userStats = {
    verified: users.filter((u: any) => u.kycVerified).length,
    pending: users.filter((u: any) => u.kycStatus === 'pending').length,
    basic: users.filter((u: any) => !u.kycVerified && u.kycStatus !== 'suspended').length,
    suspended: users.filter((u: any) => u.kycStatus === 'suspended').length
  };

  const reportStats = {
    document: reports.filter((r: any) => r.reportType === 'document').length,
    campaign: reports.filter((r: any) => r.reportType === 'campaign' || r.relatedType === 'campaign').length,
    volunteer: reports.filter((r: any) => r.reportType === 'volunteer' || r.relatedType === 'volunteer').length,
    creator: reports.filter((r: any) => r.reportType === 'creator' || r.relatedType === 'creator').length
  };

  const financialStats = {
    deposits: transactions.filter((t: any) => t.type === 'deposit').length,
    withdrawals: transactions.filter((t: any) => t.type === 'withdrawal').length,
    contributionsRaised: contributions.filter((c: any) => c.type === 'contribution').reduce((sum: number, c: any) => sum + (c.amount || 0), 0),
    tipsRaised: contributions.filter((c: any) => c.type === 'tip').reduce((sum: number, c: any) => sum + (c.amount || 0), 0)
  };

  const activityStats = {
    totalCampaigns: campaigns.length,
    totalCreators: users.filter((u: any) => u.role === 'creator' || campaigns.some((c: any) => c.creatorId === u.id)).length,
    totalContributors: users.filter((u: any) => contributions.some((c: any) => c.userId === u.id)).length,
    totalVolunteers: volunteers.length
  };

  const systemHealth = {
    health: 'Starting Up',
    responseTime: 'Fast',
    load: 'Light'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Platform Analytics Overview</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* User Management Tile */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-600">User Management</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Verified Users</span>
              <span className="font-medium">{userStats.verified}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Pending Requests</span>
              <span className="font-medium">{userStats.pending}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Basic Users</span>
              <span className="font-medium">{userStats.basic}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Suspended Users</span>
              <span className="font-medium">{userStats.suspended}</span>
            </div>
          </div>
        </Card>

        {/* Reports Tile */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Flag className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-green-600">Reports</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Document Reports</span>
              <span className="font-medium">{reportStats.document}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Campaign Reports</span>
              <span className="font-medium">{reportStats.campaign}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Volunteer Reports</span>
              <span className="font-medium">{reportStats.volunteer}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Creator Reports</span>
              <span className="font-medium">{reportStats.creator}</span>
            </div>
          </div>
        </Card>

        {/* Financial Tile */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-yellow-600" />
            <h3 className="font-semibold text-yellow-600">Financial</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Deposits</span>
              <span className="font-medium">₱{financialStats.deposits.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Withdrawals</span>
              <span className="font-medium">₱{financialStats.withdrawals.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Contributions Raised</span>
              <span className="font-medium">₱{financialStats.contributionsRaised.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Tips Raised</span>
              <span className="font-medium">₱{financialStats.tipsRaised.toLocaleString()}</span>
            </div>
          </div>
        </Card>

        {/* Activities Tile */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-purple-600">Activity</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Active Campaigns</span>
              <span className="font-medium">{activityStats.totalCampaigns}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Tips Collected</span>
              <span className="font-medium">₱{financialStats.tipsRaised.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Claims Processed</span>
              <span className="font-medium">{activityStats.totalContributors}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Volunteers</span>
              <span className="font-medium">{activityStats.totalVolunteers}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* System Health Status */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-yellow-400 rounded-full"></span>
              <span className="text-sm font-medium">System Health: {systemHealth.health}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-400 rounded-full"></span>
              <span className="text-sm font-medium">Response Time: {systemHealth.responseTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-400 rounded-full"></span>
              <span className="text-sm font-medium">Load: {systemHealth.load}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function AdminUsers() { return <div>Users section coming soon...</div>; }
function AdminCampaigns() { return <div>Campaigns section coming soon...</div>; }
function AdminContributions() { return <div>Contributions section coming soon...</div>; }
function AdminVolunteers() { return <div>Volunteers section coming soon...</div>; }

// Main Admin Component
function Admin() {
  const [activeTab, setActiveTab] = useState("reports");
  const [sidenavExpanded, setSidenavExpanded] = useState(false);
  const [sidenavHovered, setSidenavHovered] = useState(false);
  const { data: user, isLoading: authLoading } = useQuery({
    queryKey: ['/api/auth/user'],
    retry: false
  });

  const sidenavItems = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "users", label: "Users", icon: Users },
    { id: "campaigns", label: "Campaigns", icon: Target },
    { id: "contributions", label: "Contributions", icon: DollarSign },
    { id: "volunteers", label: "Volunteers", icon: UserPlus },
    { id: "milestones", label: "Milestones", icon: Award },
    { id: "leaderboards", label: "Leaderboards", icon: Crown },
    { id: "reports", label: "Reports", icon: Flag },
  ];

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!(user as any)?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-gray-400" />
          <h1 className="mt-2 text-sm font-medium text-gray-900">Access denied</h1>
          <p className="mt-1 text-sm text-gray-500">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div 
        className={`fixed top-0 left-0 h-full bg-white shadow-xl z-50 transition-all duration-300 ease-in-out border-r border-gray-100 ${
          sidenavExpanded || sidenavHovered ? 'w-80' : 'w-16'
        }`}
        onMouseEnter={() => setSidenavHovered(true)}
        onMouseLeave={() => setSidenavHovered(false)}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
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
                  <X className="w-4 h-4" />
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

          {/* Navigation */}
          <div className={`flex-1 overflow-y-auto transition-all duration-300 ${
            sidenavExpanded || sidenavHovered ? 'px-4 py-4' : 'px-2 py-4'
          }`}>
            <div className="space-y-1">
              {sidenavItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center transition-all duration-200 rounded-lg ${
                      sidenavExpanded || sidenavHovered ? 'px-3 py-2 gap-3' : 'px-2 py-2 justify-center'
                    } ${
                      isActive 
                        ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <IconComponent className="w-5 h-5 flex-shrink-0" />
                    {(sidenavExpanded || sidenavHovered) && (
                      <span className="text-sm font-medium">{item.label}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${
        sidenavExpanded || sidenavHovered ? 'ml-80' : 'ml-16'
      }`}>
        <div className="p-6">
          {activeTab === "overview" && <AdminOverview />}
          {activeTab === "users" && <AdminUsers />}
          {activeTab === "campaigns" && <AdminCampaigns />}
          {activeTab === "contributions" && <AdminContributions />}
          {activeTab === "volunteers" && <AdminVolunteers />}
          {activeTab === "milestones" && <AdminMilestones />}
          {activeTab === "leaderboards" && <AdminLeaderboards />}
          {activeTab === "reports" && <ReportsSection />}
        </div>
      </div>
    </div>
  );
}

export default Admin;
