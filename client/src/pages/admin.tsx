import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
  UserCheck,
  Video,
  Image as ImageIcon,
  RotateCcw,
  Download
} from "lucide-react";
import type { User } from "@shared/schema";
import { parseDisplayId, entityTypeMap, isStandardizedId, generateSearchSuggestions } from '@shared/idUtils';
import verifundLogoV2 from "@assets/VeriFund v2-03_1756102873849.png";
import { ObjectUploader } from "@/components/ObjectUploader";
import { DocumentViewer } from "@/components/DocumentViewer";

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
  <div className="mt-3 pt-3 border-t space-y-4">
    {/* Comprehensive Creator and Campaign Information */}
    <div className="bg-gray-50 rounded-lg p-4 space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Creator Information */}
        <div>
          <h4 className="font-semibold mb-3 text-green-700">Creator Information</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={campaign.creator?.profileImageUrl} />
                <AvatarFallback>{campaign.creator?.firstName?.[0]}{campaign.creator?.lastName?.[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{campaign.creator?.firstName} {campaign.creator?.middleInitial && campaign.creator?.middleInitial + '. '}{campaign.creator?.lastName}</p>
                <p className="text-gray-600">{campaign.creator?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <strong>User ID:</strong>
              <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                <span className="font-mono">{campaign.creator?.userDisplayId || (campaign.creator?.id?.slice(0, 8) + '...' + campaign.creator?.id?.slice(-4))}</span>
                {!campaign.creator?.userDisplayId && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(campaign.creator?.id);
                    }}
                    className="text-green-700 hover:text-green-900 text-xs underline ml-2"
                    title="Click to copy full User ID"
                  >
                    Copy ID
                  </button>
                )}
              </div>
            </div>
            <p><strong>Contact Number:</strong> {campaign.creator?.contactNumber || campaign.creator?.phoneNumber || 'Not provided'}</p>
            <p><strong>Address:</strong> {campaign.creator?.address || 'Not provided'}</p>
            <p><strong>Birthday:</strong> {campaign.creator?.birthday ? new Date(campaign.creator.birthday).toLocaleDateString() : 'Not provided'}</p>
            <p><strong>Registration Date:</strong> {campaign.creator?.createdAt ? new Date(campaign.creator.createdAt).toLocaleDateString() : 'N/A'}</p>
            <p><strong>KYC Status:</strong> <Badge variant={campaign.creator?.kycStatus === 'verified' ? 'default' : campaign.creator?.kycStatus === 'pending' ? 'secondary' : 'destructive'}>{campaign.creator?.kycStatus || 'pending'}</Badge></p>
          </div>
        </div>

        {/* Professional & Additional Information */}
        <div>
          <h4 className="font-semibold mb-3 text-blue-700">Professional Details</h4>
          <div className="space-y-2 text-sm">
            <p><strong>Education:</strong> {campaign.creator?.education || 'Not provided'}</p>
            <p><strong>Profession:</strong> {campaign.creator?.profession || 'Not provided'}</p>
            <p><strong>Work Experience:</strong> {campaign.creator?.workExperience || 'Not provided'}</p>
            <p><strong>Organization Name:</strong> {campaign.creator?.organizationName || 'Not provided'}</p>
            <p><strong>Organization Type:</strong> {campaign.creator?.organizationType || 'Not provided'}</p>
            <p><strong>LinkedIn Profile:</strong> {campaign.creator?.linkedinProfile ? (<a href={campaign.creator.linkedinProfile} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Profile</a>) : 'Not provided'}</p>
            <p><strong>Fun Facts:</strong> {campaign.creator?.funFacts || 'Not provided'}</p>
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
                <span className="font-medium">{campaign.creator?.creatorRating || '0.0'}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span>Credit Score:</span>
              <Badge variant="outline">{campaign.creator?.creditScore || '0'}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Reliability Score:</span>
              <Badge variant="outline">{campaign.creator?.reliabilityScore || '0'}</Badge>
            </div>
            <p><strong>Account Balance:</strong> ₱{parseFloat(campaign.creator?.pusoBalance || '0').toLocaleString()}</p>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3 text-orange-700">Verification Details</h4>
          <div className="space-y-2 text-sm">
            <p><strong>Profile Complete:</strong> <Badge variant={campaign.creator?.isProfileComplete ? 'default' : 'secondary'}>{campaign.creator?.isProfileComplete ? 'Yes' : 'No'}</Badge></p>
            <p><strong>Email Verified:</strong> <Badge variant={campaign.creator?.emailVerified ? 'default' : 'secondary'}>{campaign.creator?.emailVerified ? 'Yes' : 'No'}</Badge></p>
            <p><strong>Phone Verified:</strong> <Badge variant={campaign.creator?.phoneVerified ? 'default' : 'secondary'}>{campaign.creator?.phoneVerified ? 'Yes' : 'No'}</Badge></p>
            <p><strong>Submitted:</strong> {campaign.creator?.createdAt ? new Date(campaign.creator.createdAt).toLocaleDateString() : 'N/A'}</p>
            {campaign.processedByAdmin && (
              <p><strong>Processed By:</strong> {campaign.processedByAdmin}</p>
            )}
            {campaign.processedAt && (
              <p><strong>Processed Date:</strong> {new Date(campaign.processedAt).toLocaleDateString()}</p>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Campaign Details Section */}
    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
      <h4 className="font-semibold mb-3 text-blue-700 flex items-center gap-2">
        <FileText className="w-5 h-5" />
        Campaign Details
      </h4>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2 text-sm">
          <p><strong>Campaign ID:</strong> {campaign.campaignDisplayId || (campaign.id.slice(0, 8) + '...' + campaign.id.slice(-4))}</p>
          <p><strong>Title:</strong> {campaign.title}</p>
          <p><strong>Category:</strong> <Badge variant="outline">{campaign.category || 'General'}</Badge></p>
          <p><strong>Status:</strong> <Badge variant={campaign.status === 'active' ? 'default' : campaign.status === 'pending' ? 'secondary' : 'outline'}>{campaign.status}</Badge></p>
          <p><strong>Goal Amount:</strong> ₱{parseFloat(campaign.goalAmount || '0').toLocaleString()}</p>
          <p><strong>Current Amount:</strong> ₱{parseFloat(campaign.currentAmount || '0').toLocaleString()}</p>
          <p><strong>Duration:</strong> {campaign.duration} days</p>
          <p><strong>Created:</strong> {new Date(campaign.createdAt).toLocaleDateString()}</p>
          <p><strong>TES Verified:</strong> <Badge variant={campaign.tesVerified ? 'default' : 'secondary'}>{campaign.tesVerified ? 'Yes' : 'No'}</Badge></p>
        </div>
        <div className="space-y-2 text-sm">
          <p><strong>Location:</strong> {[campaign.street, campaign.barangay, campaign.city, campaign.province].filter(Boolean).join(', ') || 'Not provided'}</p>
          <p><strong>Start Date:</strong> {campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : 'Not set'}</p>
          <p><strong>End Date:</strong> {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : 'Not set'}</p>
          <p><strong>Progress:</strong> 
            <span className="ml-2 font-semibold text-green-600">
              {campaign.goalAmount ? Math.round((campaign.currentAmount / campaign.goalAmount) * 100) : 0}%
            </span>
          </p>
          <p><strong>Contributors:</strong> {campaign.contributorsCount || 0}</p>
          {campaign.needsVolunteers && (
            <>
              <p><strong>Volunteer Slots:</strong> {campaign.volunteerSlots}</p>
              <p><strong>Slots Filled:</strong> {campaign.volunteerSlotsFilledCount || 0}</p>
            </>
          )}
        </div>
      </div>
      
      {/* Campaign Description */}
      <div className="mt-4 pt-4 border-t">
        <h5 className="font-medium mb-2 text-gray-700">Description</h5>
        <div className="bg-white p-3 rounded-lg border max-h-32 overflow-y-auto">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{campaign.description || 'No description provided'}</p>
        </div>
      </div>
    </div>

    {/* Processing Information */}
    {(campaign.status === 'active' || campaign.status === 'rejected' || campaign.status === 'on_progress' || campaign.claimedBy) && (
      <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
        <h4 className="font-semibold mb-3 text-indigo-700">Processing Information</h4>
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
          {campaign.claimedBy && <p><strong>Claimed By:</strong> {campaign.claimedBy}</p>}
          {campaign.claimedAt && <p><strong>Claimed At:</strong> {new Date(campaign.claimedAt).toLocaleString()}</p>}
        </div>
      </div>
    )}

    {/* Campaign Images */}
    {campaign.images && (
      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
        <h4 className="font-semibold mb-3 text-green-700">Campaign Images</h4>
        <div className="grid grid-cols-2 gap-3">
          {(() => {
            try {
              const imageArray = JSON.parse(campaign.images);
              return Array.isArray(imageArray) ? imageArray : [campaign.images];
            } catch {
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
      </div>
    )}
  </div>
);

// My Works Section Component - Section 2
function MyWorksSection() {
  const [activeTab, setActiveTab] = useState("pending-kyc");
  const [completedTab, setCompletedTab] = useState("completed-kyc");
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
    queryKey: ['/api/admin/my-works/campaigns'],
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

  // Completed Works Queries
  const { data: completedKyc = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/my-works/kyc-completed'],
    retry: false,
  });

  const { data: completedDocuments = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/my-works/documents-completed'],
    retry: false,
  });

  const { data: completedCampaigns = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/my-works/campaigns-completed'],
    retry: false,
  });

  const { data: completedVolunteers = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/my-works/volunteers-completed'],
    retry: false,
  });

  const { data: completedCreators = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/my-works/creators-completed'],
    retry: false,
  });

  // Query for reported campaigns that have been approved/rejected
  const { data: reportedCampaigns = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/reports/campaigns/completed'],
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
        "Report reviewed and approved by admin",
        "Investigation completed - marking as resolved",
        "Administrative review completed successfully",
        "Report processed and closed"
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
        "Report reviewed and rejected by admin",
        "Insufficient evidence to proceed",
        "Report does not meet investigation criteria",
        "Administrative review - no action needed"
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

  // Helper functions for file type detection
  const getFileTypeFromUrl = (url: string): string => {
    if (!url) return 'Unknown';
    const extension = url.split('.').pop()?.toLowerCase() || '';
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) return 'Image';
    if (['pdf'].includes(extension)) return 'PDF';
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(extension)) return 'Video';
    if (['doc', 'docx'].includes(extension)) return 'Word Document';
    if (['xls', 'xlsx'].includes(extension)) return 'Excel Document';
    if (['ppt', 'pptx'].includes(extension)) return 'PowerPoint';
    
    return extension.toUpperCase() || 'Unknown';
  };

  const isImageFile = (url: string): boolean => {
    if (!url) return false;
    const extension = url.split('.').pop()?.toLowerCase() || '';
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension);
  };

  const isPdfFile = (url: string): boolean => {
    if (!url) return false;
    const extension = url.split('.').pop()?.toLowerCase() || '';
    return extension === 'pdf';
  };

  const isVideoFile = (url: string): boolean => {
    if (!url) return false;
    const extension = url.split('.').pop()?.toLowerCase() || '';
    return ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(extension);
  };

  // Separate component for report details to handle hooks properly
  const ReportDetails = ({ report }: { report: any }) => {
    // Fetch complete campaign details if related to campaign
    const { data: campaignDetails } = useQuery({
      queryKey: ['/api/campaigns', report.relatedId],
      enabled: !!report.relatedId && (report.relatedType === 'campaign' || report.campaignId),
    });

    // Fetch complete creator details if related to creator  
    const { data: creatorDetails } = useQuery({
      queryKey: ['/api/users', report.creatorId || report.relatedId],
      enabled: !!report.creatorId || (!!report.relatedId && report.relatedType === 'creator'),
    });

    // Fetch complete reporter profile
    const { data: reporterDetails } = useQuery({
      queryKey: ['/api/users', report.reporterId],
      enabled: !!report.reporterId,
    });

    // Fetch volunteer details if this is a volunteer report
    const { data: volunteerDetails } = useQuery({
      queryKey: ['/api/users', report.volunteerId || report.relatedId],
      enabled: !!report.volunteerId || (!!report.relatedId && report.relatedType === 'volunteer'),
    });

    return (
      <div className="mt-4 space-y-4">
        {/* Report Information Card - Matching Reports Management modal style */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Report Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Report ID</label>
                <p className="text-sm font-mono">{report.reportId || report.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1">
                  <Badge variant={report.status === 'pending' ? 'destructive' : report.status === 'resolved' ? 'default' : 'outline'}>
                    {report.status || 'pending'}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Report Type</label>
                <p className="text-sm">{report.reportType || report.type || 'General Report'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Date Created</label>
                <p className="text-sm">{report.createdAt ? new Date(report.createdAt).toLocaleString() : 'N/A'}</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Report Reason</label>
              <p className="text-sm bg-gray-50 p-3 rounded mt-1">{report.reason || report.description || 'No reason provided'}</p>
            </div>
            {report.details && (
              <div>
                <label className="text-sm font-medium text-gray-500">Additional Details</label>
                <p className="text-sm bg-gray-50 p-3 rounded mt-1">{report.details}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Links Relevant to the Report Card - Exact match to Reports Management modal */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Links Relevant to the Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Campaign Card */}
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <Target className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Campaign</p>
                    <p className="text-xs text-gray-500">Access campaign details</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const campaignId = report.campaign?.id || 
                                     report.campaignId || 
                                     report.targetId ||
                                     report.relatedId;
                    if (campaignId) {
                      window.open(`/campaigns/${campaignId}`, '_blank');
                    } else {
                      alert('No campaign ID found in this report.');
                    }
                  }}
                  data-testid="link-campaign"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View
                </Button>
              </div>

              {/* Reporter Card */}
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">Reporter</p>
                    <p className="text-xs text-gray-500">User who filed this report</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const reporterId = report.reporterId || 
                                     report.reporter?.id;
                    if (reporterId) {
                      window.open(`/admin/users/${reporterId}`, '_blank');
                    } else {
                      alert('No reporter ID found in this report.');
                    }
                  }}
                  data-testid="link-reporter"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View
                </Button>
              </div>

              {/* Creator Card */}
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <UserIcon className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Creator</p>
                    <p className="text-xs text-gray-500">View campaign creator profile</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const creatorId = report.campaign?.creatorId || 
                                    report.creatorId ||
                                    report.targetId ||
                                    report.relatedId;
                    if (creatorId) {
                      window.open(`/admin/users/${creatorId}`, '_blank');
                    } else {
                      alert('No creator ID found in this report.');
                    }
                  }}
                  data-testid="link-creator"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View
                </Button>
              </div>

              {/* Document Card */}
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">Document</p>
                    <p className="text-xs text-gray-500">View reported document</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Handle document viewing
                    if (report.evidenceUrls && report.evidenceUrls.length > 0) {
                      window.open(report.evidenceUrls[0], '_blank');
                    } else {
                      alert('No document found in this report.');
                    }
                  }}
                  data-testid="link-document"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Admin Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button 
                size="sm" 
                variant="default"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => openApprovalDialog('approve', report.id, 'report')}
                data-testid="button-approve-report"
                disabled={report.status === 'resolved' || report.status === 'approved'}
              >
                <Check className="w-4 h-4 mr-1" />
                Approve
              </Button>
              <Button 
                size="sm"
                variant="destructive"
                onClick={() => openApprovalDialog('reject', report.id, 'report')}
                data-testid="button-reject-report"
                disabled={report.status === 'resolved' || report.status === 'rejected'}
              >
                <X className="w-4 h-4 mr-1" />
                Reject
              </Button>
              <Button 
                size="sm"
                variant="outline"
                onClick={() => handleEscalateReport(report.id)}
                data-testid="button-escalate-report"
                disabled={report.status === 'escalated'}
              >
                <AlertTriangle className="w-4 h-4 mr-1" />
                Escalate
              </Button>
              <Button 
                size="sm"
                variant="outline"
                onClick={() => handleReassignReport(report.id)}
                data-testid="button-reassign-report"
              >
                <UserX className="w-4 h-4 mr-1" />
                Reassign
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
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
      console.log("🚀 Admin Page: Starting approval for:", { itemId, itemType, reason });
      let endpoint;
      if (itemType === 'kyc') {
        endpoint = `/api/admin/kyc/${itemId}/approve`;
      } else if (itemType === 'campaign') {
        endpoint = `/api/admin/campaigns/${itemId}/approve`;
      } else if (itemType === 'report') {
        endpoint = `/api/admin/reports/${itemId}/approve`;
      } else {
        throw new Error(`Unknown item type: ${itemType}`);
      }
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
      // Invalidate all related queries based on item type
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/kyc-claimed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/reports-claimed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/campaigns/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/campaigns/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/campaigns/rejected'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reports'] });
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
      console.log("🚀 Admin Page: Starting rejection for:", { itemId, itemType, reason });
      let endpoint;
      if (itemType === 'kyc') {
        endpoint = `/api/admin/kyc/${itemId}/reject`;
      } else if (itemType === 'campaign') {
        endpoint = `/api/admin/campaigns/${itemId}/reject`;
      } else if (itemType === 'report') {
        endpoint = `/api/admin/reports/${itemId}/reject`;
      } else {
        throw new Error(`Unknown item type: ${itemType}`);
      }
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
      // Invalidate all related queries based on item type
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/kyc-claimed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/reports-claimed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/campaigns/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/campaigns/rejected'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/campaigns/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reports'] });
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
    console.log("🖱️ Admin Page: Approval submit button clicked");
    console.log("📋 Admin Page: Current approval dialog state:", approvalDialog);
    
    const finalReason = approvalDialog.reason === 'custom' ? approvalDialog.customReason : approvalDialog.reason;
    console.log("📝 Admin Page: Final reason:", finalReason);
    
    if (!finalReason.trim()) {
      console.log("⚠️ Admin Page: No reason provided, showing error toast");
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

  // Functions for handling escalate and reassign actions
  const handleEscalateReport = async (reportId: string) => {
    try {
      await apiRequest('POST', `/api/admin/reports/${reportId}/escalate`, {
        reason: 'Report escalated for senior review'
      });
      toast({
        title: "Report Escalated",
        description: "The report has been escalated to senior administrators.",
      });
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/creators'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/volunteers'] });
    } catch (error) {
      toast({
        title: "Escalation Failed",
        description: "Failed to escalate the report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReassignReport = async (reportId: string) => {
    try {
      await apiRequest('POST', `/api/admin/reports/${reportId}/reassign`, {
        reason: 'Report reassigned to another administrator'
      });
      toast({
        title: "Report Reassigned",
        description: "The report has been reassigned to another administrator.",
      });
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/creators'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/volunteers'] });
    } catch (error) {
      toast({
        title: "Reassignment Failed",
        description: "Failed to reassign the report. Please try again.",
        variant: "destructive",
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
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
              <TabsTrigger value="pending-kyc">Pending KYC ({claimedKyc.length})</TabsTrigger>
              <TabsTrigger value="pending-campaigns">Pending Campaigns ({claimedCampaigns.length})</TabsTrigger>
              <TabsTrigger value="document-reports">Document Reports ({claimedReports.length})</TabsTrigger>
              <TabsTrigger value="campaign-reports">Campaign Reports ({claimedCampaignReports.length})</TabsTrigger>
              <TabsTrigger value="creator-reports">Creator Reports ({claimedCreatorReports.length})</TabsTrigger>
              <TabsTrigger value="volunteer-reports">Volunteer Reports ({claimedVolunteerReports.length})</TabsTrigger>
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

            <TabsContent value="pending-campaigns" className="mt-4">
              <div className="space-y-3">
                {claimedCampaigns.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No pending campaigns claimed</p>
                ) : (
                  sortByPriority(claimedCampaigns).map((campaign: any) => (
                    <div key={campaign.id} className="border rounded-lg p-4 bg-orange-50 border-orange-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{campaign.title}</h4>
                          <p className="text-sm text-gray-600">Campaign ID: {campaign.campaignDisplayId || `CAM-${campaign.id.slice(0, 6)}`}</p>
                          <p className="text-sm text-gray-500">Creator: {campaign.creator?.firstName} {campaign.creator?.lastName}</p>
                          <p className="text-sm text-gray-400">Goal: ₱{campaign.targetAmount?.toLocaleString()}</p>
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
                        <div className="mt-3 pt-3 border-t space-y-4">
                          {/* Campaign Details */}
                          <div className="bg-white rounded-lg p-4 space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <h5 className="font-semibold mb-2 text-orange-700">Campaign Information</h5>
                                <div className="space-y-2 text-sm">
                                  <p><strong>Description:</strong> {campaign.description || 'No description provided'}</p>
                                  <p><strong>Category:</strong> {campaign.category || 'Not specified'}</p>
                                  <p><strong>Target Amount:</strong> ₱{campaign.targetAmount?.toLocaleString() || '0'}</p>
                                  <p><strong>Current Amount:</strong> ₱{campaign.currentAmount?.toLocaleString() || '0'}</p>
                                  <p><strong>End Date:</strong> {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : 'Not set'}</p>
                                </div>
                              </div>
                              <div>
                                <h5 className="font-semibold mb-2 text-orange-700">Creator Information</h5>
                                <div className="space-y-2 text-sm">
                                  <p><strong>Name:</strong> {campaign.creator?.firstName} {campaign.creator?.lastName}</p>
                                  <p><strong>Email:</strong> {campaign.creator?.email}</p>
                                  <p><strong>KYC Status:</strong> {campaign.creator?.kycStatus || 'Unknown'}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          
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
                    <div key={report.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">Document Report #{report.id.slice(0, 8)}</h4>
                          <p className="text-sm text-gray-600">Type: {report.reportType || 'Document'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(report.status, 'report')}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => toggleExpanded(report.id)}
                          >
                            {expandedItems.includes(report.id) ? "Hide Details" : "View Details"}
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
                    <div key={report.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">Campaign Report #{report.id.slice(0, 8)}</h4>
                          <p className="text-sm text-gray-600">Type: {report.reportType || 'Campaign'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(report.status, 'report')}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => toggleExpanded(report.id)}
                          >
                            {expandedItems.includes(report.id) ? "Hide Details" : "View Details"}
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
                      <div key={report.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">Creator Report #{report.id.slice(0, 8)}</h4>
                            <p className="text-sm text-gray-600">Type: {report.reportType || 'Creator'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(report.status, 'report')}
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => toggleExpanded(report.id)}
                            >
                              {expandedItems.includes(report.id) ? "Hide Details" : "View Details"}
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
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">Volunteer Report #{report.id.slice(0, 8)}</h4>
                            <p className="text-sm text-gray-600">Type: {report.reportType || 'Volunteer'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(report.status, 'report')}
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => toggleExpanded(report.id)}
                            >
                              {expandedItems.includes(report.id) ? "Hide Details" : "View Details"}
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

      {/* Completed Works Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Completed Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={completedTab} onValueChange={setCompletedTab}>
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
              <TabsTrigger value="completed-kyc">Completed KYC ({completedKyc.length})</TabsTrigger>
              <TabsTrigger value="completed-campaigns">Campaigns ({claimedCampaigns.length + completedCampaigns.length})</TabsTrigger>
              <TabsTrigger value="completed-documents">Documents ({completedDocuments.length})</TabsTrigger>
              <TabsTrigger value="completed-campaign-reports">Campaign Reports ({reportedCampaigns.length})</TabsTrigger>
              <TabsTrigger value="completed-volunteers">Volunteers ({completedVolunteers.length})</TabsTrigger>
              <TabsTrigger value="completed-creators">Creators ({completedCreators.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="completed-kyc" className="mt-4">
              <div className="space-y-3">
                {completedKyc.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No completed KYC requests</p>
                ) : (
                  completedKyc.map((kyc: any) => (
                    <div key={kyc.id} className="border rounded-lg p-4 bg-green-50 border-green-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{kyc.firstName} {kyc.lastName}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-gray-600">User ID:</span>
                            <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                              <span className="font-mono">{kyc.userDisplayId}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-100 text-green-800 border-green-300">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Completed
                          </Badge>
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
                                  <p><strong>Completion Date:</strong> {new Date(kyc.completedAt || kyc.updatedAt).toLocaleDateString()}</p>
                                  <p><strong>Final Status:</strong> <Badge variant={kyc.kycStatus === 'verified' ? 'default' : 'destructive'}>{kyc.kycStatus}</Badge></p>
                                  <p><strong>Processed By:</strong> {kyc.processedBy || kyc.processedByAdmin || 'System'}</p>
                                  {kyc.processedAt && (
                                    <p><strong>Processed Date:</strong> {new Date(kyc.processedAt).toLocaleDateString()}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* KYC Documents Section */}
                          {kyc.kycDocuments && (
                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                              <h4 className="font-semibold mb-3 text-blue-700 flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                KYC Documents
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
                                            </div>
                                          </div>
                                        )}

                                        {/* Selfie */}
                                        {docs.selfie && (
                                          <div className="space-y-2">
                                            <p className="font-medium text-sm text-gray-700">Selfie Verification</p>
                                            <div className="border rounded-lg p-2 bg-white">
                                              <img 
                                                src={docs.selfie} 
                                                alt="Selfie Verification"
                                                className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => window.open(docs.selfie, '_blank')}
                                              />
                                            </div>
                                          </div>
                                        )}
                                      </>
                                    );
                                  } catch (error) {
                                    return <p className="text-sm text-gray-500">Document data format error</p>;
                                  }
                                })()}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="completed-campaigns" className="mt-4">
              <div className="space-y-6">
                {/* Pending Campaigns Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-orange-700">Pending Campaign Approvals</h3>
                  <div className="space-y-3">
                    {claimedCampaigns.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No campaign requests claimed</p>
                    ) : (
                      sortByPriority(claimedCampaigns).map((campaign: any) => (
                        <div key={campaign.id} className="border rounded-lg p-4 bg-orange-50 border-orange-200">
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
                </div>

                {/* Completed Campaigns Section */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4 text-purple-700">Completed Campaign Reviews</h3>
                  <div className="space-y-3">
                    {completedCampaigns.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No completed campaign reviews</p>
                    ) : (
                      completedCampaigns.map((campaign: any) => (
                        <div key={campaign.id} className="border rounded-lg p-4 bg-purple-50 border-purple-200">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium">{campaign.title}</h4>
                              <p className="text-sm text-gray-600">Campaign ID: {campaign.campaignDisplayId}</p>
                              <p className="text-sm text-gray-500">Creator: {campaign.creator?.firstName} {campaign.creator?.lastName}</p>
                              <p className="text-sm text-gray-400">Completed: {campaign.completedAt ? new Date(campaign.completedAt).toLocaleDateString() : 'N/A'}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-purple-100 text-purple-800 border-purple-300">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                {campaign.status || 'Completed'}
                              </Badge>
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
                            <div className="mt-4 pt-4 border-t bg-white rounded p-3">
                              <div className="space-y-2">
                                <p><strong>Reason:</strong> {campaign.reason || 'Review completed'}</p>
                                <p><strong>Review Date:</strong> {campaign.completedAt ? new Date(campaign.completedAt).toLocaleString() : 'N/A'}</p>
                                <p><strong>Status:</strong> {campaign.status || 'Resolved'}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="completed-documents" className="mt-4">
              <div className="space-y-3">
                {completedDocuments.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No completed document reviews</p>
                ) : (
                  completedDocuments.map((doc: any) => (
                    <div key={doc.id} className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{doc.title || 'Document Review'}</h4>
                          <p className="text-sm text-gray-600">Document ID: {doc.documentId}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Completed
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="completed-campaign-reports" className="mt-4">
              <div className="space-y-3">
                {reportedCampaigns.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No completed campaign report reviews</p>
                ) : (
                  reportedCampaigns.map((report: any) => (
                    <div key={report.id} className="border rounded-lg p-4 bg-orange-50 border-orange-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{report.campaign?.title || 'Campaign Report'}</h4>
                          <p className="text-sm text-gray-600">Report ID: {report.reportId}</p>
                          <p className="text-sm text-gray-500">Campaign ID: {report.campaign?.campaignDisplayId}</p>
                          <p className="text-sm text-gray-500">Reporter: {report.reporter?.firstName} {report.reporter?.lastName}</p>
                          <p className="text-sm text-gray-400">Completed: {report.closedAt ? new Date(report.closedAt).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${
                            report.status === 'approved' ? 'bg-green-100 text-green-800 border-green-300' :
                            report.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-300' :
                            'bg-orange-100 text-orange-800 border-orange-300'
                          }`}>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {report.status || 'Resolved'}
                          </Badge>
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
                        <div className="mt-4 pt-4 border-t bg-white rounded p-3">
                          <div className="space-y-2">
                            <p><strong>Report Reason:</strong> {report.reason || 'Report reviewed'}</p>
                            <p><strong>Action Taken:</strong> {report.actionTaken || 'Review completed'}</p>
                            <p><strong>Resolved By:</strong> {report.resolvedBy || 'Admin'}</p>
                            <p><strong>Closed Date:</strong> {report.closedAt ? new Date(report.closedAt).toLocaleString() : 'N/A'}</p>
                            <p><strong>Final Status:</strong> {report.status || 'Resolved'}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="completed-volunteers" className="mt-4">
              <div className="space-y-3">
                {completedVolunteers.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No completed volunteer reviews</p>
                ) : (
                  completedVolunteers.map((volunteer: any) => (
                    <div key={volunteer.id} className="border rounded-lg p-4 bg-orange-50 border-orange-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{volunteer.applicantName}</h4>
                          <p className="text-sm text-gray-600">Application ID: {volunteer.id}</p>
                          <p className="text-sm text-gray-500">Campaign: {volunteer.campaignTitle}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Completed
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="completed-creators" className="mt-4">
              <div className="space-y-3">
                {completedCreators.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No completed creator reviews</p>
                ) : (
                  completedCreators.map((creator: any) => (
                    <div key={creator.id} className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{creator.firstName} {creator.lastName}</h4>
                          <p className="text-sm text-gray-600">Creator ID: {creator.id}</p>
                          <p className="text-sm text-gray-500">Email: {creator.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Completed
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
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
    <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Profile Information */}
        <div>
          <h4 className="font-semibold mb-3 text-green-700">Personal Information</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.profileImageUrl} />
                <AvatarFallback>{user.firstName?.[0]}{user.lastName?.[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user.firstName} {user.middleInitial && user.middleInitial + '. '}{user.lastName}</p>
                <p className="text-gray-600">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <strong>User ID:</strong>
              <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                <span className="font-mono" data-testid={`user-display-id-${user.id}`}>
                  {user.userDisplayId || (user.id.slice(0, 8) + '...' + user.id.slice(-4))}
                </span>
                {!user.userDisplayId && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(user.id);
                    }}
                    className="text-green-700 hover:text-green-900 text-xs underline ml-2"
                    title="Click to copy full User ID"
                  >
                    Copy ID
                  </button>
                )}
              </div>
            </div>
            <p><strong>Contact Number:</strong> {user.contactNumber || user.phoneNumber || user.phone || 'Not provided'}</p>
            <p><strong>Address:</strong> {user.address || 'Not provided'}</p>
            <p><strong>Birthday:</strong> {user.birthday ? new Date(user.birthday).toLocaleDateString() : user.dateOfBirth || 'Not provided'}</p>
            <p><strong>Registration Date:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
            <p><strong>KYC Status:</strong> <Badge variant={user.kycStatus === 'verified' ? 'default' : user.kycStatus === 'pending' ? 'secondary' : 'destructive'}>{user.kycStatus || 'pending'}</Badge></p>
          </div>
        </div>

        {/* Professional & Additional Information */}
        <div>
          <h4 className="font-semibold mb-3 text-blue-700">Professional Details</h4>
          <div className="space-y-2 text-sm">
            <p><strong>Education:</strong> {user.education || 'Not provided'}</p>
            <p><strong>Profession:</strong> {user.profession || 'Not provided'}</p>
            <p><strong>Work Experience:</strong> {user.workExperience || 'Not provided'}</p>
            <p><strong>Organization Name:</strong> {user.organizationName || 'Not provided'}</p>
            <p><strong>Organization Type:</strong> {user.organizationType || 'Not provided'}</p>
            <p><strong>LinkedIn Profile:</strong> {user.linkedinProfile ? (<a href={user.linkedinProfile} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Profile</a>) : 'Not provided'}</p>
            <p><strong>Fun Facts:</strong> {user.funFacts || 'Not provided'}</p>
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
                <span className="font-medium">{user.creatorRating || '0.0'}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span>Credit Score:</span>
              <Badge variant="outline">{user.creditScore || '0'}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Reliability Score:</span>
              <Badge variant="outline">{user.reliabilityScore || '0'}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Social Score:</span>
              <Badge variant="outline">{user.socialScore || '0'}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Total Contributions:</span>
              <span className="font-medium">₱{user.totalContributions || '0'}</span>
            </div>
          </div>
        </div>

        {/* Financial Information */}
        <div>
          <h4 className="font-semibold mb-3 text-green-700">Wallet & Transactions</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span>PHP Balance:</span>
              <span className="font-medium">₱{user.phpBalance || '0.00'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>PUSO Balance:</span>
              <span className="font-medium">{user.pusoBalance || '0.00'} PUSO</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Tips Balance:</span>
              <span className="font-medium">₱{user.tipsBalance || '0.00'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Campaigns Created:</span>
              <Badge variant="outline">{user.campaignsCreated || 0}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Contributions Made:</span>
              <Badge variant="outline">{user.contributionsMade || 0}</Badge>
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
            {user.governmentIdUrl || user.government_id_url ? (
              <div className="relative">
                <img 
                  src={user.governmentIdUrl || user.government_id_url} 
                  alt="Government ID" 
                  className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-90"
                  onClick={() => window.open(user.governmentIdUrl || user.government_id_url, '_blank')}
                />
                <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                  Uploaded
                </div>
              </div>
            ) : (
              <div className="w-full h-32 bg-gray-100 dark:bg-gray-800 rounded flex flex-col items-center justify-center text-gray-500 border-2 border-dashed">
                <Camera className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">No document uploaded</p>
              </div>
            )}
          </div>
          <div className="border rounded-lg p-3">
            <p className="text-sm font-medium mb-2">Proof of Address</p>
            {user.proofOfAddressUrl || user.proof_of_address_url ? (
              <div className="relative">
                <img 
                  src={user.proofOfAddressUrl || user.proof_of_address_url} 
                  alt="Proof of Address" 
                  className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-90"
                  onClick={() => window.open(user.proofOfAddressUrl || user.proof_of_address_url, '_blank')}
                />
                <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                  Uploaded
                </div>
              </div>
            ) : (
              <div className="w-full h-32 bg-gray-100 dark:bg-gray-800 rounded flex flex-col items-center justify-center text-gray-500 border-2 border-dashed">
                <Camera className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">No document uploaded</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Document Status */}
        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {(user.governmentIdUrl || user.government_id_url) && (user.proofOfAddressUrl || user.proof_of_address_url) 
                ? "All required documents have been uploaded and are ready for review."
                : (user.governmentIdUrl || user.government_id_url) || (user.proofOfAddressUrl || user.proof_of_address_url)
                ? "Partial documents uploaded. Some documents are still missing."
                : "User needs to upload required KYC documents (Government ID and Proof of Address) to complete verification."
              }
            </p>
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
  const [claimedUsers, setClaimedUsers] = useState<Set<string>>(new Set());
  const queryClientKyc = useQueryClient();
  const claimKycMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("POST", `/api/admin/kyc/${userId}/claim`, {});
    },
    onSuccess: (data, userId) => {
      toast({
        title: "KYC Request Claimed",
        description: "You have successfully claimed this KYC request for review.",
      });
      // Add user to claimed set for immediate UI update
      setClaimedUsers(prev => new Set(prev).add(userId));
      // Invalidate queries to refresh the data
      queryClientKyc.invalidateQueries({ queryKey: ["/api/admin/kyc/pending"] });
      queryClientKyc.invalidateQueries({ queryKey: ["/api/admin/my-works/kyc-claimed"] });
      queryClientKyc.invalidateQueries({ queryKey: ["/api/admin/my-works/analytics"] });
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
                {showClaimButton && !claimedUsers.has(user.id) && !user.claimedBy && (
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
                {showClaimButton && (claimedUsers.has(user.id) || user.claimedBy) && (
                  <Badge variant="secondary">
                    {claimedUsers.has(user.id) ? "Claimed" : "Already Claimed"}
                  </Badge>
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
  
  // Assign dialog state
  const [assignDialog, setAssignDialog] = useState<{
    open: boolean;
    campaignId: string;
    selectedAdmin: string;
  }>({
    open: false,
    campaignId: '',
    selectedAdmin: ''
  });

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

  // Get list of admins for assignment
  const { data: adminsList = [] } = useQuery({
    queryKey: ['/api/admin/admins'],
    retry: false,
  });

  const toggleCampaignExpanded = (campaignId: string) => {
    setExpandedCampaigns(prev => 
      prev.includes(campaignId) 
        ? prev.filter(id => id !== campaignId)
        : [...prev, campaignId]
    );
  };

  const queryClientCampaigns = useQueryClient();
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
      queryClientCampaigns.refetchQueries({ queryKey: ['/api/admin/campaigns/pending'] });
      queryClientCampaigns.refetchQueries({ queryKey: ['/api/admin/my-works/campaigns'] });
      queryClientCampaigns.refetchQueries({ queryKey: ['/api/admin/my-works/analytics'] });
      // Also invalidate for other components
      queryClientCampaigns.invalidateQueries({ queryKey: ['/api/admin/campaigns'] });
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

  // Assign campaign mutation
  const assignCampaignMutation = useMutation({
    mutationFn: async ({ campaignId, adminId }: { campaignId: string; adminId: string }) => {
      console.log("🚀 Assigning campaign:", { campaignId, adminId });
      return await apiRequest('POST', `/api/admin/campaigns/${campaignId}/assign`, { adminId });
    },
    onSuccess: () => {
      console.log("✅ Campaign assigned successfully");
      toast({
        title: "Campaign Assigned",
        description: "Campaign has been successfully assigned to the selected admin.",
      });
      // Refresh campaign lists
      queryClientCampaigns.refetchQueries({ queryKey: ['/api/admin/campaigns/pending'] });
      queryClientCampaigns.refetchQueries({ queryKey: ['/api/admin/my-works/campaigns'] });
      queryClientCampaigns.refetchQueries({ queryKey: ['/api/admin/my-works/analytics'] });
      queryClientCampaigns.invalidateQueries({ queryKey: ['/api/admin/campaigns'] });
      setAssignDialog({ open: false, campaignId: '', selectedAdmin: '' });
    },
    onError: (error: any) => {
      console.error("❌ Failed to assign campaign:", error);
      toast({
        title: "Error",
        description: "Failed to assign campaign. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleAssignCampaign = (campaignId: string) => {
    setAssignDialog({ open: true, campaignId, selectedAdmin: '' });
  };

  const confirmAssignCampaign = () => {
    if (assignDialog.selectedAdmin && assignDialog.campaignId) {
      assignCampaignMutation.mutate({
        campaignId: assignDialog.campaignId,
        adminId: assignDialog.selectedAdmin
      });
    }
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
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="default"
                      onClick={() => handleClaimCampaign(campaign.id)}
                      disabled={claimCampaignMutation.isPending}
                      data-testid={`button-claim-campaign-${campaign.id}`}
                    >
                      {claimCampaignMutation.isPending ? "Claiming..." : "CLAIM"}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleAssignCampaign(campaign.id)}
                      disabled={assignCampaignMutation.isPending}
                      data-testid={`button-assign-campaign-${campaign.id}`}
                    >
                      <UserPlus className="h-3 w-3 mr-1" />
                      {assignCampaignMutation.isPending ? "Assigning..." : "Assign"}
                    </Button>
                  </div>
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

      {/* Assign Campaign Dialog */}
      <Dialog open={assignDialog.open} onOpenChange={(open) => setAssignDialog({ ...assignDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Campaign to Admin</DialogTitle>
            <DialogDescription>
              Select an admin to assign this campaign to for review and processing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Admin</label>
              <Select
                value={assignDialog.selectedAdmin}
                onValueChange={(value) => setAssignDialog({ ...assignDialog, selectedAdmin: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose an admin..." />
                </SelectTrigger>
                <SelectContent>
                  {adminsList.map((admin: any) => (
                    <SelectItem key={admin.id} value={admin.id}>
                      {admin.name || admin.email || `Admin ${admin.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAssignDialog({ open: false, campaignId: '', selectedAdmin: '' })}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmAssignCampaign}
              disabled={!assignDialog.selectedAdmin || assignCampaignMutation.isPending}
            >
              {assignCampaignMutation.isPending ? "Assigning..." : "Assign Campaign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Volunteer Management Section - Section 5
function VolunteersSection() {
  const [activeVolunteerTab, setActiveVolunteerTab] = useState("opportunities");
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

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
  const [activeReportsTab, setActiveReportsTab] = useState("document");
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [claimingReport, setClaimingReport] = useState<string | null>(null);
  const [claimedReports, setClaimedReports] = useState<Set<string>>(new Set());
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Data queries with proper error handling and type safety
  const { data: documentReports = [], isLoading: loadingDocuments } = useQuery({
    queryKey: ['/api/admin/reports/document'],
    retry: false,
  });

  const { data: campaignReports = [], isLoading: loadingCampaigns } = useQuery({
    queryKey: ['/api/admin/reports/campaigns'],
    retry: false,
  });

  const { data: volunteerReports = [], isLoading: loadingVolunteers } = useQuery({
    queryKey: ['/api/admin/reports/volunteers'],
    retry: false,
  });

  const { data: creatorReports = [], isLoading: loadingCreators } = useQuery({
    queryKey: ['/api/admin/reports/creators'],
    retry: false,
  });

  const { data: transactionReports = [], isLoading: loadingTransactions } = useQuery({
    queryKey: ['/api/admin/reports/transactions'],
    retry: false,
  });

  const isLoading = loadingDocuments || loadingCampaigns || loadingVolunteers || loadingCreators || loadingTransactions;

  // Loading state for enhanced report details
  const [loadingReportDetails, setLoadingReportDetails] = useState(false);

  // Function to handle viewing report details with enhanced data fetching
  const handleViewReport = async (report: any) => {
    console.log('Opening report modal for:', report);
    setSelectedReport(report);
    setShowReportModal(true);
    setLoadingReportDetails(true);
    
    try {
      let enhancedReport = { ...report };
      console.log('Starting to enhance report:', enhancedReport);
      
      // Fetch campaign details if campaign ID is available
      const campaignId = report.campaignId || report.targetId;
      if (campaignId) {
        console.log('Fetching campaign details for:', campaignId);
        try {
          const campaignResponse = await fetch(`/api/campaigns/${campaignId}`);
          if (campaignResponse.ok) {
            const campaignData = await campaignResponse.json();
            console.log('Campaign data received:', campaignData);
            enhancedReport.campaign = campaignData;
          } else {
            console.log('Campaign fetch failed:', campaignResponse.status);
          }
        } catch (error) {
          console.log('Campaign fetch error:', error);
        }
      }
      
      // Fetch creator details if creator ID is available  
      const creatorId = report.creatorId || enhancedReport.campaign?.creatorId;
      if (creatorId) {
        console.log('Fetching creator details for:', creatorId);
        try {
          const creatorResponse = await fetch(`/api/admin/users/${creatorId}`);
          if (creatorResponse.ok) {
            const creatorData = await creatorResponse.json();
            console.log('Creator data received:', creatorData);
            enhancedReport.creator = creatorData;
          } else {
            console.log('Creator fetch failed:', creatorResponse.status);
          }
        } catch (error) {
          console.log('Creator fetch error:', error);
        }
      }
      
      // Fetch reporter details if reporter ID is available
      if (report.reporterId) {
        console.log('Fetching reporter details for:', report.reporterId);
        try {
          const reporterResponse = await fetch(`/api/admin/users/${report.reporterId}`);
          if (reporterResponse.ok) {
            const reporterData = await reporterResponse.json();
            console.log('Reporter data received:', reporterData);
            enhancedReport.reporter = reporterData;
          } else {
            console.log('Reporter fetch failed:', reporterResponse.status);
          }
        } catch (error) {
          console.log('Reporter fetch error:', error);
        }
      }
      
      console.log('Final enhanced report:', enhancedReport);
      setSelectedReport(enhancedReport);
    } catch (error) {
      console.error('Error enhancing report details:', error);
    } finally {
      setLoadingReportDetails(false);
    }
  };

  // Function to handle report status updates
  const handleUpdateReportStatus = async (reportId: string, status: string, reason?: string) => {
    try {
      await fetch(`/api/admin/reports/${reportId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason })
      });
      
      toast({
        title: "Report Updated",
        description: `Report status changed to ${status}`,
      });
      
      // Invalidate all report queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reports'] });
      setShowReportModal(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update report status",
        variant: "destructive"
      });
    }
  };

  // Function to handle report claiming
  const handleClaimReport = async (reportId: string, reportType: string) => {
    setClaimingReport(reportId);
    try {
      const response = await fetch(`/api/admin/reports/${reportId}/claim`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportType })
      });
      
      if (response.ok) {
        // Add this report to the claimed reports set
        setClaimedReports(prev => new Set(prev).add(reportId));
        
        // Update the selected report to show it's claimed
        setSelectedReport(prev => ({
          ...prev,
          claimed: true,
          claimedBy: (user as any)?.name || (user as any)?.email,
          claimedAt: new Date().toISOString()
        }));
        
        toast({
          title: "Report Claimed",
          description: "You have successfully claimed this report",
        });
        
        // Invalidate all report queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/admin/reports'] });
        
        // Invalidate MY WORK queries to show claimed reports in the appropriate tabs
        queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/creators'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/volunteers'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/documents'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/my-works/campaigns'] });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to claim report",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to claim report",
        variant: "destructive"
      });
    } finally {
      setClaimingReport(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Loading Reports...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Reports Administration</CardTitle>
          <p className="text-sm text-gray-600">Manage and review all platform reports</p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeReportsTab} onValueChange={setActiveReportsTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="document">Document ({Array.isArray(documentReports) ? documentReports.length : 0})</TabsTrigger>
              <TabsTrigger value="campaigns">Campaigns ({Array.isArray(campaignReports) ? campaignReports.length : 0})</TabsTrigger>
              <TabsTrigger value="volunteers">Volunteers ({Array.isArray(volunteerReports) ? volunteerReports.length : 0})</TabsTrigger>
              <TabsTrigger value="creators">Creators ({Array.isArray(creatorReports) ? creatorReports.length : 0})</TabsTrigger>
              <TabsTrigger value="transactions">Transactions ({Array.isArray(transactionReports) ? transactionReports.length : 0})</TabsTrigger>
            </TabsList>

            <TabsContent value="document" className="mt-4">
              <div className="space-y-3">
                {Array.isArray(documentReports) && documentReports.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No document reports found</p>
                ) : (
                  Array.isArray(documentReports) && documentReports.map((report: any) => (
                    <div key={report.id} className="border rounded-lg p-4 bg-white">
                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 items-start lg:items-center">
                        <div>
                          <p className="font-medium text-sm">{report.reportId || report.id}</p>
                          <p className="text-xs text-gray-500">Report ID</p>
                        </div>
                        <div>
                          <p className="text-sm">{report.createdAt ? new Date(report.createdAt).toLocaleString() : 'N/A'}</p>
                          <p className="text-xs text-gray-500">Date & Time</p>
                        </div>
                        <div className="min-w-0">
                          {report.claimedBy && report.claimAdmin ? (
                            <div className="space-y-0.5">
                              <Badge variant="outline" className="text-xs max-w-full truncate block">
                                {report.claimAdmin.email}
                              </Badge>
                              <p className="text-xs text-gray-500 truncate">
                                {new Date(report.claimedAt).toLocaleDateString()} {new Date(report.claimedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </p>
                            </div>
                          ) : (
                            <Badge variant={report.status === 'pending' ? 'destructive' : report.status === 'resolved' ? 'default' : 'outline'}>
                              {report.status || 'pending'}
                            </Badge>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium truncate">{report.reporterId || 'N/A'}</p>
                          <p className="text-xs text-gray-500">Reporter ID</p>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          <Button size="sm" variant="outline" onClick={() => handleViewReport(report)} className="min-w-0">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleClaimReport(report.id, 'document')}
                            disabled={claimingReport === report.id || claimedReports.has(report.id) || report.claimedBy}
                            data-testid="button-claim-document-report"
                            className="min-w-0"
                          >
                            <UserCheck className="h-3 w-3 mr-1" />
                            {claimingReport === report.id ? 'Claiming...' : 
                             (claimedReports.has(report.id) || report.claimedBy) ? 'Claimed' : 'Claim'}
                          </Button>
                          {(user as any)?.isAdmin && (
                            <Button 
                              size="sm"
                              variant="default"
                              onClick={() => {
                                console.log('Assign document report:', report.id);
                                toast({
                                  title: "Assign Feature",
                                  description: "Assign functionality will be implemented soon.",
                                });
                              }}
                              data-testid="button-assign-document-report"
                            >
                              <UserPlus className="h-3 w-3 mr-1" />
                              Assign
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="campaigns" className="mt-4">
              <div className="space-y-3">
                {Array.isArray(campaignReports) && campaignReports.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No campaign reports found</p>
                ) : (
                  Array.isArray(campaignReports) && campaignReports.map((report: any) => (
                    <div key={report.id} className="border rounded-lg p-4 bg-white">
                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 items-start lg:items-center">
                        <div>
                          <p className="font-medium text-sm">{report.reportId || report.id}</p>
                          <p className="text-xs text-gray-500">Report ID</p>
                        </div>
                        <div>
                          <p className="text-sm">{report.createdAt ? new Date(report.createdAt).toLocaleString() : 'N/A'}</p>
                          <p className="text-xs text-gray-500">Date & Time</p>
                        </div>
                        <div className="min-w-0">
                          {report.claimedBy && report.claimAdmin ? (
                            <div className="space-y-0.5">
                              <Badge variant="outline" className="text-xs max-w-full truncate block">
                                {report.claimAdmin.email}
                              </Badge>
                              <p className="text-xs text-gray-500 truncate">
                                {new Date(report.claimedAt).toLocaleDateString()} {new Date(report.claimedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </p>
                            </div>
                          ) : (
                            <Badge variant={report.status === 'pending' ? 'destructive' : report.status === 'resolved' ? 'default' : 'outline'}>
                              {report.status || 'pending'}
                            </Badge>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium truncate">{report.reporterId || 'N/A'}</p>
                          <p className="text-xs text-gray-500">Reporter ID</p>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          <Button size="sm" variant="outline" onClick={() => handleViewReport(report)} className="min-w-0">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleClaimReport(report.id, 'campaign')}
                            disabled={claimingReport === report.id || claimedReports.has(report.id) || report.claimedBy}
                            data-testid="button-claim-campaign-report"
                            className="min-w-0"
                          >
                            <UserCheck className="h-3 w-3 mr-1" />
                            {claimingReport === report.id ? 'Claiming...' : 
                             (claimedReports.has(report.id) || report.claimedBy) ? 'Claimed' : 'Claim'}
                          </Button>
                          {(user as any)?.isAdmin && (
                            <Button 
                              size="sm"
                              variant="default"
                              onClick={() => {
                                console.log('Assign campaign report:', report.id);
                                toast({
                                  title: "Assign Feature",
                                  description: "Assign functionality will be implemented soon.",
                                });
                              }}
                              data-testid="button-assign-campaign-report"
                            >
                              <UserPlus className="h-3 w-3 mr-1" />
                              Assign
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="volunteers" className="mt-4">
              <div className="space-y-3">
                {Array.isArray(volunteerReports) && volunteerReports.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No volunteer reports found</p>
                ) : (
                  Array.isArray(volunteerReports) && volunteerReports.map((report: any) => (
                    <div key={report.id} className="border rounded-lg p-4 bg-white">
                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 items-start lg:items-center">
                        <div>
                          <p className="font-medium text-sm">{report.reportId || report.id}</p>
                          <p className="text-xs text-gray-500">Report ID</p>
                        </div>
                        <div>
                          <p className="text-sm">{report.createdAt ? new Date(report.createdAt).toLocaleString() : 'N/A'}</p>
                          <p className="text-xs text-gray-500">Date & Time</p>
                        </div>
                        <div className="min-w-0">
                          {report.claimedBy && report.claimAdmin ? (
                            <div className="space-y-0.5">
                              <Badge variant="outline" className="text-xs max-w-full truncate block">
                                {report.claimAdmin.email}
                              </Badge>
                              <p className="text-xs text-gray-500 truncate">
                                {new Date(report.claimedAt).toLocaleDateString()} {new Date(report.claimedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </p>
                            </div>
                          ) : (
                            <Badge variant={report.status === 'pending' ? 'destructive' : report.status === 'resolved' ? 'default' : 'outline'}>
                              {report.status || 'pending'}
                            </Badge>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium truncate">{report.reporterId || 'N/A'}</p>
                          <p className="text-xs text-gray-500">Reporter ID</p>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          <Button size="sm" variant="outline" onClick={() => handleViewReport(report)} className="min-w-0">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleClaimReport(report.id, 'volunteer')}
                            disabled={claimingReport === report.id || claimedReports.has(report.id) || report.claimedBy}
                            data-testid="button-claim-volunteer-report"
                            className="min-w-0"
                          >
                            <UserCheck className="h-3 w-3 mr-1" />
                            {claimingReport === report.id ? 'Claiming...' : 
                             (claimedReports.has(report.id) || report.claimedBy) ? 'Claimed' : 'Claim'}
                          </Button>
                          {(user as any)?.isAdmin && (
                            <Button 
                              size="sm"
                              variant="default"
                              onClick={() => {
                                console.log('Assign volunteer report:', report.id);
                                toast({
                                  title: "Assign Feature",
                                  description: "Assign functionality will be implemented soon.",
                                });
                              }}
                              data-testid="button-assign-volunteer-report"
                            >
                              <UserPlus className="h-3 w-3 mr-1" />
                              Assign
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="creators" className="mt-4">
              <div className="space-y-3">
                {Array.isArray(creatorReports) && creatorReports.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No creator reports found</p>
                ) : (
                  Array.isArray(creatorReports) && creatorReports.map((report: any) => (
                    <div key={report.id} className="border rounded-lg p-4 bg-white">
                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 items-start lg:items-center">
                        <div>
                          <p className="font-medium text-sm">{report.reportId || report.id}</p>
                          <p className="text-xs text-gray-500">Report ID</p>
                        </div>
                        <div>
                          <p className="text-sm">{report.createdAt ? new Date(report.createdAt).toLocaleString() : 'N/A'}</p>
                          <p className="text-xs text-gray-500">Date & Time</p>
                        </div>
                        <div className="min-w-0">
                          {report.claimedBy && report.claimAdmin ? (
                            <div className="space-y-0.5">
                              <Badge variant="outline" className="text-xs max-w-full truncate block">
                                {report.claimAdmin.email}
                              </Badge>
                              <p className="text-xs text-gray-500 truncate">
                                {new Date(report.claimedAt).toLocaleDateString()} {new Date(report.claimedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </p>
                            </div>
                          ) : (
                            <Badge variant={report.status === 'pending' ? 'destructive' : report.status === 'resolved' ? 'default' : 'outline'}>
                              {report.status || 'pending'}
                            </Badge>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium truncate">{report.reporterId || 'N/A'}</p>
                          <p className="text-xs text-gray-500">Reporter ID</p>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          <Button size="sm" variant="outline" onClick={() => handleViewReport(report)} className="min-w-0">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleClaimReport(report.id, 'creator')}
                            disabled={claimingReport === report.id || claimedReports.has(report.id) || report.claimedBy}
                            data-testid="button-claim-creator-report"
                            className="min-w-0"
                          >
                            <UserCheck className="h-3 w-3 mr-1" />
                            {claimingReport === report.id ? 'Claiming...' : 
                             (claimedReports.has(report.id) || report.claimedBy) ? 'Claimed' : 'Claim'}
                          </Button>
                          {(user as any)?.isAdmin && (
                            <Button 
                              size="sm"
                              variant="default"
                              onClick={() => {
                                console.log('Assign creator report:', report.id);
                                toast({
                                  title: "Assign Feature",
                                  description: "Assign functionality will be implemented soon.",
                                });
                              }}
                              data-testid="button-assign-creator-report"
                            >
                              <UserPlus className="h-3 w-3 mr-1" />
                              Assign
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="transactions" className="mt-4">
              <div className="space-y-3">
                {Array.isArray(transactionReports) && transactionReports.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No transaction reports found</p>
                ) : (
                  Array.isArray(transactionReports) && transactionReports.map((report: any) => (
                    <div key={report.id} className="border rounded-lg p-4 bg-white">
                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 items-start lg:items-center">
                        <div>
                          <p className="font-medium text-sm">{report.reportId || report.id}</p>
                          <p className="text-xs text-gray-500">Report ID</p>
                        </div>
                        <div>
                          <p className="text-sm">{report.createdAt ? new Date(report.createdAt).toLocaleString() : 'N/A'}</p>
                          <p className="text-xs text-gray-500">Date & Time</p>
                        </div>
                        <div className="min-w-0">
                          {report.claimedBy && report.claimAdmin ? (
                            <div className="space-y-0.5">
                              <Badge variant="outline" className="text-xs max-w-full truncate block">
                                {report.claimAdmin.email}
                              </Badge>
                              <p className="text-xs text-gray-500 truncate">
                                {new Date(report.claimedAt).toLocaleDateString()} {new Date(report.claimedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </p>
                            </div>
                          ) : (
                            <Badge variant={report.status === 'pending' ? 'destructive' : report.status === 'resolved' ? 'default' : 'outline'}>
                              {report.status || 'pending'}
                            </Badge>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium truncate">{report.reporterId || 'N/A'}</p>
                          <p className="text-xs text-gray-500">Reporter ID</p>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          <Button size="sm" variant="outline" onClick={() => handleViewReport(report)} className="min-w-0">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleClaimReport(report.id, 'transaction')}
                            disabled={claimingReport === report.id || claimedReports.has(report.id) || report.claimedBy}
                            data-testid="button-claim-transaction-report"
                            className="min-w-0"
                          >
                            <UserCheck className="h-3 w-3 mr-1" />
                            {claimingReport === report.id ? 'Claiming...' : 
                             (claimedReports.has(report.id) || report.claimedBy) ? 'Claimed' : 'Claim'}
                          </Button>
                          {(user as any)?.isAdmin && (
                            <Button 
                              size="sm"
                              variant="default"
                              onClick={() => {
                                console.log('Assign transaction report:', report.id);
                                toast({
                                  title: "Assign Feature",
                                  description: "Assign functionality will be implemented soon.",
                                });
                              }}
                              data-testid="button-assign-transaction-report"
                            >
                              <UserPlus className="h-3 w-3 mr-1" />
                              Assign
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

          </Tabs>
        </CardContent>
      </Card>
      {/* Comprehensive Report Details Modal */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Report Details - {selectedReport?.reportId || selectedReport?.id}</DialogTitle>
            <DialogDescription>
              Complete information about this report including evidence, reporter details, and related entities.
            </DialogDescription>
          </DialogHeader>

          {loadingReportDetails && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              <span className="ml-2">Loading detailed information...</span>
            </div>
          )}

          {selectedReport && !loadingReportDetails && (
            <div className="space-y-6">
              {/* Report Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Report Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Report ID</label>
                      <p className="text-sm font-mono">{selectedReport.reportId || selectedReport.id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <div className="mt-1">
                        <Badge variant={selectedReport.status === 'pending' ? 'destructive' : selectedReport.status === 'resolved' ? 'default' : 'outline'}>
                          {selectedReport.status || 'pending'}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Report Type</label>
                      <p className="text-sm">{selectedReport.type || 'General Report'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Date Created</label>
                      <p className="text-sm">{selectedReport.createdAt ? new Date(selectedReport.createdAt).toLocaleString() : 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Report Reason</label>
                    <p className="text-sm bg-gray-50 p-3 rounded mt-1">{selectedReport.reason || selectedReport.description || 'No reason provided'}</p>
                  </div>
                  {selectedReport.details && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Additional Details</label>
                      <p className="text-sm bg-gray-50 p-3 rounded mt-1">{selectedReport.details}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Links relevant to the report */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Links Relevant to the Report</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    


                    {/* Campaign Card */}
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <Target className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium">Campaign</p>
                          <p className="text-xs text-gray-500">Access campaign details</p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const campaignId = selectedReport.campaign?.id || 
                                           selectedReport.campaignId || 
                                           selectedReport.targetId ||
                                           selectedReport.relatedId;
                          if (campaignId) {
                            window.open(`/campaigns/${campaignId}`, '_blank');
                          } else {
                            alert('No campaign ID found in this report.');
                          }
                        }}
                        data-testid="link-campaign"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </div>




                    {/* Reporter Card */}
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <Shield className="h-5 w-5 text-purple-500" />
                        <div>
                          <p className="text-sm font-medium">Reporter</p>
                          <p className="text-xs text-gray-500">User who filed this report</p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Reporter button clicked!');
                          console.log('Selected Report:', selectedReport);
                          
                          const reporterId = selectedReport.reporterId || 
                                           selectedReport.reporter?.id;
                          
                          console.log('Reporter ID found:', reporterId);
                          
                          if (reporterId) {
                            const profileUrl = `/admin/users/${reporterId}`;
                            console.log('Opening reporter profile:', profileUrl);
                            window.open(profileUrl, '_blank');
                          } else {
                            console.error('No reporter ID found in report data');
                            alert('No reporter ID found in this report. Check console for details.');
                          }
                        }}
                        data-testid="link-reporter"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </div>



                    {/* Creator Card - Only show in Document, Campaign, and Creator tabs */}
                    {(activeReportsTab === 'document' || activeReportsTab === 'campaigns' || activeReportsTab === 'creators') && (
                      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-3">
                          <UserIcon className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="text-sm font-medium">Creator</p>
                            <p className="text-xs text-gray-500">View campaign creator profile</p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Creator button clicked!');
                            console.log('Selected Report:', selectedReport);
                            
                            const creatorId = selectedReport.campaign?.creatorId || 
                                            selectedReport.creatorId ||
                                            selectedReport.targetId ||
                                            selectedReport.relatedId;
                            
                            console.log('Creator ID found:', creatorId);
                            
                            if (creatorId) {
                              const profileUrl = `/admin/users/${creatorId}`;
                              console.log('Opening creator profile:', profileUrl);
                              window.open(profileUrl, '_blank');
                            } else {
                              console.error('No creator ID found in report data');
                              alert('No creator ID found in this report. Check console for details.');
                            }
                          }}
                          data-testid="link-creator"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                    )}

                    {/* Volunteer Card - Only show in Volunteer tab */}
                    {activeReportsTab === 'volunteers' && (
                      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-3">
                          <Users className="h-5 w-5 text-emerald-500" />
                          <div>
                            <p className="text-sm font-medium">Volunteer</p>
                            <p className="text-xs text-gray-500">View volunteer profile</p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Volunteer button clicked!');
                            console.log('Full selectedReport:', JSON.stringify(selectedReport, null, 2));
                            
                            // Try multiple possible volunteer ID fields for volunteer reports
                            const volunteerId = selectedReport.reportedVolunteerId || 
                                              selectedReport.reportedVolunteer?.id ||
                                              selectedReport.volunteerId || 
                                              selectedReport.relatedId || 
                                              selectedReport.volunteer?.id ||
                                              selectedReport.reportedUserId ||
                                              selectedReport.userId ||
                                              selectedReport.id;
                            
                            console.log('Extracted volunteer ID:', volunteerId);
                            
                            if (volunteerId) {
                              const adminUrl = `/admin/users/${volunteerId}`;
                              console.log('Opening URL:', adminUrl);
                              window.open(adminUrl, '_blank');
                            } else {
                              console.error('No volunteer ID found in report data');
                              alert('No volunteer ID found in this report. Please check the console for details.');
                            }
                          }}
                          data-testid="link-volunteer"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                    )}

                    {/* Document Card - Only show in Document tab */}
                    {activeReportsTab === 'document' && (
                      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-orange-500" />
                          <div>
                            <p className="text-sm font-medium">Document</p>
                            <p className="text-xs text-gray-500">View reported document</p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Document button clicked!');
                            console.log('Selected Report:', selectedReport);
                            
                            const documentId = selectedReport.documentId || 
                                             selectedReport.progressReportId ||
                                             selectedReport.relatedId ||
                                             selectedReport.targetId;
                            
                            console.log('Document ID found:', documentId);
                            
                            if (documentId) {
                              // Navigate to campaign detail page instead of non-existent document route
                              if (selectedReport.type === 'campaign' || selectedReport.category === 'campaign') {
                                window.open(`/campaigns/${documentId}`, '_blank');
                              } else if (selectedReport.type === 'progress_report' || selectedReport.category === 'progress_report') {
                                // Find the campaign ID for this progress report
                                const campaignId = selectedReport.campaignId || selectedReport.relatedCampaignId;
                                if (campaignId) {
                                  window.open(`/campaigns/${campaignId}`, '_blank');
                                } else {
                                  alert('Progress report found but no associated campaign ID available.');
                                }
                              } else {
                                // For other document types, try to show the document if it has a URL
                                console.log('Attempting to view document for other type:', selectedReport);
                                if (selectedReport.fileUrl || selectedReport.url) {
                                  // Set up document for viewing
                                  const documentProps = {
                                    id: documentId,
                                    fileName: selectedReport.fileName || selectedReport.filename || `Document-${documentId}`,
                                    fileUrl: selectedReport.fileUrl || selectedReport.url,
                                    mimeType: selectedReport.mimeType || selectedReport.type || 'application/octet-stream',
                                    description: `${selectedReport.type || selectedReport.category} document - ${selectedReport.title || 'No title'}`
                                  };
                                  
                                  setCurrentDocument(documentProps);
                                  setShowDocumentViewer(true);
                                } else {
                                  alert(`Document type: ${selectedReport.type || selectedReport.category}\nID: ${documentId}\n\nThis document is under review. Full document viewer coming soon.`);
                                }
                              }
                            } else {
                              console.error('No document ID found in report data');
                              alert('No document ID found in this report. Check console for details.');
                            }
                          }}
                          data-testid="link-document"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>





              {/* Reported Document Card */}
              {selectedReport && selectedReport.documentId && (
                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="flex items-center text-base text-red-700">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Reported Document
                    </CardTitle>
                    <p className="text-sm text-gray-600">The original progress report document that was reported for fraud</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-red-500" />
                        <div>
                          <p className="text-sm font-medium">Progress Report Document</p>
                          <p className="text-xs text-gray-500">Document ID: {selectedReport.documentId}</p>
                          <p className="text-xs text-red-600">This document is being investigated for potential fraud</p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-red-300 text-red-700 hover:bg-red-100"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // Navigate to the campaign to view the progress report
                          const campaignId = selectedReport.campaignId || selectedReport.relatedId;
                          if (campaignId) {
                            window.open(`/campaigns/${campaignId}`, '_blank');
                          } else {
                            alert('Campaign information not available for this document.');
                          }
                        }}
                        data-testid="button-view-reported-document"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View Document
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Reporter Evidence Card */}
              {(selectedReport.evidence || selectedReport.attachments || selectedReport.screenshots || selectedReport.documents) && (
                <Card className="border-blue-200">
                  <CardHeader>
                    <CardTitle className="flex items-center text-base text-blue-700">
                      <Shield className="h-4 w-4 mr-2" />
                      Reporter Evidence
                    </CardTitle>
                    <p className="text-sm text-gray-600">Evidence files uploaded by the reporter to support their fraud claim</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Evidence files */}
                      {selectedReport.evidence && selectedReport.evidence.map((item: any, index: number) => (
                        <div key={`evidence-${index}`} className="flex items-center justify-between p-3 border border-blue-200 rounded-lg bg-blue-50">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-blue-500" />
                            <div>
                              <p className="text-sm font-medium">{item.filename || item.fileName || `Evidence ${index + 1}`}</p>
                              <p className="text-xs text-gray-500">{item.type || item.mimeType || 'File'} • {item.size || item.fileSize || 'Unknown size'}</p>
                            </div>
                          </div>
                          <DocumentViewer 
                            document={{
                              id: `evidence-${index}`,
                              fileName: item.filename || item.fileName || `Evidence-${index + 1}`,
                              fileUrl: item.url || item.fileUrl,
                              mimeType: item.type || item.mimeType,
                              fileSize: typeof item.size === 'string' ? parseInt(item.size) : item.size || item.fileSize,
                              description: `Evidence file ${index + 1}`
                            }}
                          />
                        </div>
                      ))}
                      
                      {/* Screenshot files */}
                      {selectedReport.screenshots && selectedReport.screenshots.map((screenshot: any, index: number) => (
                        <div key={`screenshot-${index}`} className="flex items-center justify-between p-3 border border-blue-200 rounded-lg bg-blue-50">
                          <div className="flex items-center space-x-3">
                            <ImageIcon className="h-5 w-5 text-green-500" />
                            <div>
                              <p className="text-sm font-medium">Screenshot {index + 1}</p>
                              <p className="text-xs text-gray-500">Image Evidence</p>
                            </div>
                          </div>
                          <DocumentViewer 
                            document={{
                              id: `screenshot-${index}`,
                              fileName: `Screenshot-${index + 1}`,
                              fileUrl: typeof screenshot === 'string' ? screenshot : screenshot.url,
                              mimeType: 'image/png',
                              description: `Screenshot evidence ${index + 1}`
                            }}
                          />
                        </div>
                      ))}
                      
                      {/* Document attachments from progress reports */}
                      {selectedReport.documents && selectedReport.documents.map((doc: any, index: number) => (
                        <div key={`document-${doc.id || index}`} className="flex items-center justify-between p-3 border border-blue-200 rounded-lg bg-blue-50">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-purple-500" />
                            <div>
                              <p className="text-sm font-medium">{doc.fileName || `Document ${index + 1}`}</p>
                              <p className="text-xs text-gray-500">{doc.mimeType || 'File'} • {doc.fileSize ? `${Math.round(doc.fileSize / 1024)} KB` : 'Unknown size'}</p>
                              {doc.description && (
                                <p className="text-xs text-gray-600 mt-1">{doc.description}</p>
                              )}
                            </div>
                          </div>
                          <DocumentViewer 
                            document={{
                              id: doc.id || `document-${index}`,
                              fileName: doc.fileName,
                              fileUrl: doc.fileUrl,
                              mimeType: doc.mimeType,
                              fileSize: doc.fileSize,
                              documentType: doc.documentType,
                              description: doc.description
                            }}
                          />
                        </div>
                      ))}
                      
                      {/* Progress report attachments */}
                      {selectedReport.attachments && selectedReport.attachments.map((attachment: any, index: number) => (
                        <div key={`attachment-${index}`} className="flex items-center justify-between p-3 border border-blue-200 rounded-lg bg-blue-50">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium">{attachment.fileName || attachment.filename || `Attachment ${index + 1}`}</p>
                              <p className="text-xs text-gray-500">{attachment.mimeType || attachment.type || 'File'} • {attachment.fileSize || attachment.size || 'Unknown size'}</p>
                            </div>
                          </div>
                          <DocumentViewer 
                            document={{
                              id: `attachment-${index}`,
                              fileName: attachment.fileName || attachment.filename || `Attachment-${index + 1}`,
                              fileUrl: attachment.fileUrl || attachment.url,
                              mimeType: attachment.mimeType || attachment.type,
                              fileSize: attachment.fileSize || (typeof attachment.size === 'string' ? parseInt(attachment.size) : attachment.size),
                              description: `Attachment ${index + 1}`
                            }}
                          />
                        </div>
                      ))}
                      
                      {/* Show message if no evidence found */}
                      {(!selectedReport.evidence || selectedReport.evidence.length === 0) && 
                       (!selectedReport.screenshots || selectedReport.screenshots.length === 0) &&
                       (!selectedReport.documents || selectedReport.documents.length === 0) &&
                       (!selectedReport.attachments || selectedReport.attachments.length === 0) && (
                        <p className="text-sm text-gray-500 text-center py-4">No evidence files uploaded by reporter</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Claim Status Indicator */}
              {(claimedReports.has(selectedReport.id) || selectedReport.claimed) && (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="pt-4">
                    <div className="flex items-center space-x-2">
                      <UserCheck className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">Report Claimed</p>
                        <p className="text-sm text-green-600">
                          {selectedReport.claimedBy && (
                            <>Claimed by {selectedReport.claimedBy}</>
                          )}
                          {selectedReport.claimedAt && (
                            <> on {new Date(selectedReport.claimedAt).toLocaleString()}</>
                          )}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Admin Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Admin Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-3">
                    {/* Claim Button - Available to both Admin and Support */}
                    <Button 
                      onClick={() => {
                        const reportType = activeReportsTab === 'document' ? 'document' : 
                                         activeReportsTab === 'campaigns' ? 'campaign' : 
                                         activeReportsTab === 'creators' ? 'creator' : 
                                         activeReportsTab === 'volunteers' ? 'volunteer' : 
                                         'transaction';
                        handleClaimReport(selectedReport.id, reportType);
                      }}
                      variant="outline"
                      disabled={claimingReport === selectedReport.id || claimedReports.has(selectedReport.id) || selectedReport.claimedBy}
                      data-testid="button-claim-report"
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      {claimingReport === selectedReport.id ? 'Claiming...' : 
                       (claimedReports.has(selectedReport.id) || selectedReport.claimedBy) ? 'Claimed' : 'Claim'}
                    </Button>

                    {/* Assign Button - Only available to Admin */}
                    {(user as any)?.isAdmin && (
                      <Button 
                        onClick={() => {
                          // TODO: Implement assign functionality
                          console.log('Assign report:', selectedReport.id);
                          toast({
                            title: "Assign Feature",
                            description: "Assign functionality will be implemented soon.",
                          });
                        }}
                        variant="default"
                        data-testid="button-assign-report"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Assign
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Document Viewer Modal for standalone document viewing */}
      {currentDocument && (
        <DocumentViewer 
          document={currentDocument}
          trigger={null}
          externalShow={showDocumentViewer}
          onExternalClose={() => {
            setShowDocumentViewer(false);
            setCurrentDocument(null);
          }}
        />
      )}
    </div>
  );
}

// Main Admin Component
function AdminPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("main");

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
    { id: "security", label: "Security", icon: Shield },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "main": return <VeriFundMainPage />;
      case "my-works": return <MyWorksSection />;
      case "kyc": return <KYCSection />;
      case "campaigns": return <CampaignsSection />;
      case "volunteers": return <VolunteersSection />;
      case "financial": return <FinancialSection />;
      case "reports": 
        try {
          return <ReportsSection />;
        } catch (error) {
          console.error("Error in ReportsSection:", error);
          return (
            <div className="p-8">
              <h2 className="text-2xl font-bold mb-4">Reports</h2>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">There was an error loading the Reports section. Please try refreshing the page.</p>
                <p className="text-sm text-red-600 mt-2">Error: {error?.toString()}</p>
              </div>
            </div>
          );
        }
      case "tickets": return <TicketsSection />;
      case "stories": return <StoriesSection />;
      case "access": return <AccessSection />;
      case "invite": return <InviteSection />;
      case "security": return <SecuritySection />;
      default: return <VeriFundMainPage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Crown className="h-8 w-8 text-indigo-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">VeriFund Admin</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigationItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`${
                        activeTab === item.id
                          ? 'border-indigo-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm inline-flex items-center`}
                      data-testid={`nav-${item.id}`}
                    >
                      <IconComponent className="h-4 w-4 mr-2" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Welcome, {(user as any)?.name || (user as any)?.email}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = '/api/logout'}
                  data-testid="button-logout"
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Side Navigation */}
      <div className="flex">
        <div className="hidden md:flex md:w-64 md:flex-col">
          <div className="flex-1 min-h-0 bg-white shadow">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {sidenavItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`${
                        activeTab === item.id
                          ? 'bg-indigo-100 text-indigo-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left`}
                      data-testid={`sidenav-${item.id}`}
                    >
                      <IconComponent className="h-5 w-5 mr-3" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
            <div className="py-6">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default AdminPage;
