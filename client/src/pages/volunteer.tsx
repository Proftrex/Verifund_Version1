import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { CampaignManagement } from "@/components/CampaignManagement";
import { 
  Search, 
  Users, 
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Heart,
  UserPlus,
  MessageSquare,
  Eye
} from "lucide-react";

interface VolunteerOpportunity {
  id: string;
  campaignId: string;
  title: string;
  description: string;
  location: string;
  category: string;
  startDate: string;
  endDate: string;
  slotsNeeded: number;
  slotsFilled: number;
  status: string;
  duration: number;
  createdAt: string;
}

interface VolunteerApplication {
  id: string;
  campaignId: string;
  volunteerId: string;
  status: string;
  intent: string;
  telegramDisplayName: string;
  telegramUsername: string;
  rejectionReason?: string;
  createdAt: string;
  campaign?: {
    title: string;
    category: string;
    status: string;
  };
}

export default function Volunteer() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

  // Redirect to login if not authenticated
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
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="text-volunteer-title">
            Volunteer Opportunities
          </h1>
          <p className="text-lg text-muted-foreground">
            Find and apply for volunteer opportunities to make a difference in your community
          </p>
        </div>

        {/* Volunteer Opportunities Tabs */}
        <Tabs defaultValue="opportunities" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="opportunities" data-testid="tab-opportunities">
              <UserPlus className="w-4 h-4 mr-2" />
              Available Opportunities
            </TabsTrigger>
            <TabsTrigger value="applications" data-testid="tab-applications">
              <MessageSquare className="w-4 h-4 mr-2" />
              My Applications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="opportunities">
            <VolunteerOpportunitiesView />
          </TabsContent>

          <TabsContent value="applications">
            <MyApplicationsView />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Available Volunteer Opportunities View
function VolunteerOpportunitiesView() {
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch volunteer opportunities
  const { data: opportunities, isLoading } = useQuery({
    queryKey: ["/api/volunteer-opportunities"],
  }) as { data: VolunteerOpportunity[] | undefined; isLoading: boolean };

  const filteredOpportunities = (opportunities || []).filter((opportunity) =>
    opportunity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opportunity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opportunity.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opportunity.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading volunteer opportunities...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, description, category, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-opportunities"
            />
          </div>
        </CardContent>
      </Card>

      {/* Opportunities List */}
      {filteredOpportunities.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No volunteer opportunities found</h3>
          <p className="text-muted-foreground">
            {searchTerm ? "Try adjusting your search terms" : "Check back later for new opportunities"}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOpportunities.map((opportunity) => (
            <VolunteerOpportunityCard key={opportunity.id} opportunity={opportunity} />
          ))}
        </div>
      )}
    </div>
  );
}

// Individual Volunteer Opportunity Card
function VolunteerOpportunityCard({ opportunity }: { opportunity: VolunteerOpportunity }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showCampaignDetailsDialog, setShowCampaignDetailsDialog] = useState(false);
  const [intent, setIntent] = useState("");
  const [telegramDisplayName, setTelegramDisplayName] = useState("");
  const [telegramUsername, setTelegramUsername] = useState("");

  const availableSlots = opportunity.slotsNeeded - opportunity.slotsFilled;
  const isFullyBooked = availableSlots <= 0;

  // Fetch campaign details for the campaign details dialog
  const { data: campaignDetails } = useQuery({
    queryKey: ["/api/campaigns", opportunity.campaignId],
    enabled: showCampaignDetailsDialog,
  });

  const applyMutation = useMutation({
    mutationFn: (applicationData: any) => 
      apiRequest(`/api/volunteer-opportunities/${opportunity.id}/apply`, {
        method: "POST",
        body: JSON.stringify(applicationData),
      }),
    onSuccess: () => {
      toast({
        title: "Application Submitted",
        description: "Your volunteer application has been submitted successfully!",
      });
      setIsDialogOpen(false);
      setIntent("");
      setTelegramDisplayName("");
      setTelegramUsername("");
      queryClient.invalidateQueries({ queryKey: ["/api/volunteer-opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/volunteer-applications/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Application Failed",
        description: error.message || "Failed to submit volunteer application",
        variant: "destructive",
      });
    },
  });

  const handleApply = () => {
    if (!intent.trim()) {
      toast({
        title: "Intent Required",
        description: "Please explain why you want to volunteer for this opportunity",
        variant: "destructive",
      });
      return;
    }

    if (!telegramDisplayName.trim() || !telegramUsername.trim()) {
      toast({
        title: "Telegram Info Required",
        description: "Please provide your Telegram display name and username for communication",
        variant: "destructive",
      });
      return;
    }

    applyMutation.mutate({
      intent,
      telegramDisplayName,
      telegramUsername,
    });
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2 mb-2" data-testid={`text-opportunity-title-${opportunity.id}`}>
              {opportunity.title}
            </CardTitle>
            <Badge variant="secondary" className="mb-2">
              {opportunity.category}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-3" data-testid={`text-opportunity-description-${opportunity.id}`}>
          {opportunity.description}
        </p>

        <div className="space-y-2 text-sm">
          <div className="flex items-center text-muted-foreground">
            <MapPin className="w-4 h-4 mr-2" />
            <span>{opportunity.location}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <Calendar className="w-4 h-4 mr-2" />
            <span>{new Date(opportunity.startDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <Clock className="w-4 h-4 mr-2" />
            <span>{opportunity.duration} days</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <Users className="w-4 h-4 mr-2" />
            <span>{availableSlots} of {opportunity.slotsNeeded} slots available</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="flex-1" 
                disabled={isFullyBooked || applyMutation.isPending}
                data-testid={`button-apply-${opportunity.id}`}
              >
                {isFullyBooked ? "Fully Booked" : "Apply to Volunteer"}
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Apply for Volunteer Opportunity</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="intent">Why do you want to volunteer? *</Label>
                <Textarea
                  id="intent"
                  placeholder="Explain your motivation and how you can contribute..."
                  value={intent}
                  onChange={(e) => setIntent(e.target.value)}
                  className="mt-1"
                  data-testid="textarea-intent"
                />
              </div>
              <div>
                <Label htmlFor="telegramDisplayName">Telegram Display Name *</Label>
                <Input
                  id="telegramDisplayName"
                  placeholder="Your display name on Telegram"
                  value={telegramDisplayName}
                  onChange={(e) => setTelegramDisplayName(e.target.value)}
                  className="mt-1"
                  data-testid="input-telegram-display-name"
                />
              </div>
              <div>
                <Label htmlFor="telegramUsername">Telegram Username *</Label>
                <Input
                  id="telegramUsername"
                  placeholder="@yourusername"
                  value={telegramUsername}
                  onChange={(e) => setTelegramUsername(e.target.value)}
                  className="mt-1"
                  data-testid="input-telegram-username"
                />
              </div>
              <Button 
                onClick={handleApply} 
                className="w-full"
                disabled={applyMutation.isPending}
                data-testid="button-submit-application"
              >
                {applyMutation.isPending ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Campaign Details Dialog */}
        <Dialog open={showCampaignDetailsDialog} onOpenChange={setShowCampaignDetailsDialog}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              className="flex-1"
              data-testid={`button-view-campaign-details-${opportunity.id}`}
            >
              <Eye className="w-4 h-4 mr-2" />
              VIEW CAMPAIGN DETAILS
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Campaign Details
              </DialogTitle>
            </DialogHeader>
            {campaignDetails && (
              <div className="space-y-6">
                {/* Campaign Management Information Card */}
                <CampaignManagement 
                  campaign={campaignDetails} 
                  variant="detail"
                />

                {/* Creator Profile Section */}
                {campaignDetails.creator && (
                  <Card className="border-2 border-primary/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Campaign Creator Profile
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-16 h-16">
                          <AvatarImage 
                            src={campaignDetails.creator.profileImageUrl} 
                            alt={`${campaignDetails.creator.firstName} ${campaignDetails.creator.lastName}`} 
                          />
                          <AvatarFallback>
                            {campaignDetails.creator.firstName?.[0]}{campaignDetails.creator.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold">
                            {campaignDetails.creator.firstName} {campaignDetails.creator.lastName}
                          </h4>
                          <p className="text-sm text-muted-foreground">{campaignDetails.creator.email}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant={campaignDetails.creator.kycStatus === 'verified' ? 'default' : 'secondary'}>
                              {campaignDetails.creator.kycStatus === 'verified' ? 'KYC Verified' : 'KYC Pending'}
                            </Badge>
                            {campaignDetails.creator.organizationName && (
                              <Badge variant="outline">{campaignDetails.creator.organizationType}</Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div>
                            <h5 className="font-medium text-sm mb-2">Professional Information</h5>
                            <div className="space-y-1 text-sm">
                              {campaignDetails.creator.profession && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Profession:</span>
                                  <span className="font-medium">{campaignDetails.creator.profession}</span>
                                </div>
                              )}
                              {campaignDetails.creator.education && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Education:</span>
                                  <span className="font-medium">{campaignDetails.creator.education}</span>
                                </div>
                              )}
                              {campaignDetails.creator.organizationName && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Organization:</span>
                                  <span className="font-medium">{campaignDetails.creator.organizationName}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <h5 className="font-medium text-sm mb-2">Campaign History</h5>
                            <div className="space-y-1 text-sm">
                              {campaignDetails.creator.totalCampaigns !== undefined && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Total Campaigns:</span>
                                  <span className="font-medium">{campaignDetails.creator.totalCampaigns}</span>
                                </div>
                              )}
                              {campaignDetails.creator.completedCampaigns !== undefined && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Completed:</span>
                                  <span className="font-medium">{campaignDetails.creator.completedCampaigns}</span>
                                </div>
                              )}
                              {campaignDetails.creator.totalRaised && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Total Raised:</span>
                                  <span className="font-medium">₱{Number(campaignDetails.creator.totalRaised).toLocaleString()}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {campaignDetails.creator.workExperience && (
                        <div>
                          <h5 className="font-medium text-sm mb-2">Experience</h5>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {campaignDetails.creator.workExperience}
                          </p>
                        </div>
                      )}

                      {campaignDetails.creator.linkedinProfile && (
                        <div>
                          <h5 className="font-medium text-sm mb-2">LinkedIn Profile</h5>
                          <a 
                            href={campaignDetails.creator.linkedinProfile} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-sm"
                          >
                            View LinkedIn Profile
                          </a>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
                
                {/* Basic Campaign Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Campaign Information</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Goal Amount:</span>
                          <span className="font-medium">₱{Number(campaignDetails.goalAmount).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Current Amount:</span>
                          <span className="font-medium">₱{Number(campaignDetails.currentAmount).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <Badge variant="secondary">{campaignDetails.status}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Category:</span>
                          <span className="font-medium">{campaignDetails.category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Created:</span>
                          <span className="font-medium">{new Date(campaignDetails.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Volunteer Information</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Slots Needed:</span>
                          <span className="font-medium">{campaignDetails.volunteerSlots || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Slots Filled:</span>
                          <span className="font-medium">{campaignDetails.volunteerSlotsFilledCount || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Available Slots:</span>
                          <span className="font-medium">{(campaignDetails.volunteerSlots || 0) - (campaignDetails.volunteerSlotsFilledCount || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Location:</span>
                          <span className="font-medium">{campaignDetails.location || 'Not specified'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Campaign Description */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {campaignDetails.description}
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}

// My Volunteer Applications View
function MyApplicationsView() {
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch user's volunteer applications
  const { data: applications, isLoading } = useQuery({
    queryKey: ["/api/volunteer-applications/user"],
  }) as { data: VolunteerApplication[] | undefined; isLoading: boolean };

  const filteredApplications = (applications || []).filter((application) =>
    application.campaign?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    application.intent.toLowerCase().includes(searchTerm.toLowerCase()) ||
    application.campaign?.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingApplications = filteredApplications.filter(app => app.status === 'pending');
  const approvedApplications = filteredApplications.filter(app => app.status === 'approved');
  const completedApplications = filteredApplications.filter(app => app.status === 'completed');
  const rejectedApplications = filteredApplications.filter(app => app.status === 'rejected');

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading your applications...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search your applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-applications"
            />
          </div>
        </CardContent>
      </Card>

      {/* Applications Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{pendingApplications.length}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{approvedApplications.length}</div>
            <div className="text-sm text-muted-foreground">Approved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{completedApplications.length}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{rejectedApplications.length}</div>
            <div className="text-sm text-muted-foreground">Rejected</div>
          </CardContent>
        </Card>
      </div>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No applications found</h3>
          <p className="text-muted-foreground">
            {searchTerm ? "Try adjusting your search terms" : "Apply for volunteer opportunities to see them here"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((application) => (
            <ApplicationCard key={application.id} application={application} />
          ))}
        </div>
      )}
    </div>
  );
}

// Individual Application Card
function ApplicationCard({ application }: { application: VolunteerApplication }) {
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const { user } = useAuth();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'completed': return <Heart className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // Fetch campaign details for the dialog
  const { data: campaignDetails } = useQuery({
    queryKey: ["/api/campaigns", application.campaignId],
    enabled: showCampaignDialog,
  });

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1" data-testid={`text-application-title-${application.id}`}>
              {application.campaign?.title || "Campaign Title"}
            </h3>
            <Badge variant="secondary" className="mb-2">
              {application.campaign?.category || "Category"}
            </Badge>
          </div>
          <Badge className={`${getStatusColor(application.status)} flex items-center gap-1`}>
            {getStatusIcon(application.status)}
            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
          </Badge>
        </div>
        
        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-1">Your Intent:</h4>
            <p className="text-sm" data-testid={`text-application-intent-${application.id}`}>
              {application.intent}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Telegram Display:</span>
              <div className="font-medium">{application.telegramDisplayName}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Telegram Username:</span>
              <div className="font-medium">{application.telegramUsername}</div>
            </div>
          </div>

          {application.rejectionReason && (
            <div className="p-3 bg-red-50 rounded-lg">
              <h4 className="font-medium text-sm text-red-800 mb-1">Rejection Reason:</h4>
              <p className="text-sm text-red-700">{application.rejectionReason}</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Applied on {new Date(application.createdAt).toLocaleDateString()}
            </div>
            
            {/* VIEW CAMPAIGN Button */}
            <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  data-testid={`button-view-campaign-${application.id}`}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  VIEW CAMPAIGN
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Campaign Details
                  </DialogTitle>
                </DialogHeader>
                {campaignDetails && (
                  <div className="space-y-6">
                    {/* Campaign Management Information Card */}
                    <CampaignManagement 
                      campaign={campaignDetails} 
                      variant="detail"
                    />

                    {/* Creator Profile Section */}
                    {campaignDetails.creator && (
                      <Card className="border-2 border-primary/20">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Campaign Creator Profile
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-start gap-4">
                            <Avatar className="w-16 h-16">
                              <AvatarImage 
                                src={campaignDetails.creator.profileImageUrl} 
                                alt={`${campaignDetails.creator.firstName} ${campaignDetails.creator.lastName}`} 
                              />
                              <AvatarFallback>
                                {campaignDetails.creator.firstName?.[0]}{campaignDetails.creator.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold">
                                {campaignDetails.creator.firstName} {campaignDetails.creator.lastName}
                              </h4>
                              <p className="text-sm text-muted-foreground">{campaignDetails.creator.email}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant={campaignDetails.creator.kycStatus === 'verified' ? 'default' : 'secondary'}>
                                  {campaignDetails.creator.kycStatus === 'verified' ? 'KYC Verified' : 'KYC Pending'}
                                </Badge>
                                {campaignDetails.creator.organizationName && (
                                  <Badge variant="outline">{campaignDetails.creator.organizationType}</Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                              <div>
                                <h5 className="font-medium text-sm mb-2">Professional Information</h5>
                                <div className="space-y-1 text-sm">
                                  {campaignDetails.creator.profession && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Profession:</span>
                                      <span className="font-medium">{campaignDetails.creator.profession}</span>
                                    </div>
                                  )}
                                  {campaignDetails.creator.education && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Education:</span>
                                      <span className="font-medium">{campaignDetails.creator.education}</span>
                                    </div>
                                  )}
                                  {campaignDetails.creator.organizationName && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Organization:</span>
                                      <span className="font-medium">{campaignDetails.creator.organizationName}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <h5 className="font-medium text-sm mb-2">Campaign History</h5>
                                <div className="space-y-1 text-sm">
                                  {campaignDetails.creator.totalCampaigns !== undefined && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Total Campaigns:</span>
                                      <span className="font-medium">{campaignDetails.creator.totalCampaigns}</span>
                                    </div>
                                  )}
                                  {campaignDetails.creator.completedCampaigns !== undefined && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Completed:</span>
                                      <span className="font-medium">{campaignDetails.creator.completedCampaigns}</span>
                                    </div>
                                  )}
                                  {campaignDetails.creator.totalRaised && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Total Raised:</span>
                                      <span className="font-medium">₱{Number(campaignDetails.creator.totalRaised).toLocaleString()}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {campaignDetails.creator.workExperience && (
                            <div>
                              <h5 className="font-medium text-sm mb-2">Experience</h5>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {campaignDetails.creator.workExperience}
                              </p>
                            </div>
                          )}

                          {campaignDetails.creator.linkedinProfile && (
                            <div>
                              <h5 className="font-medium text-sm mb-2">LinkedIn Profile</h5>
                              <a 
                                href={campaignDetails.creator.linkedinProfile} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline text-sm"
                              >
                                View LinkedIn Profile
                              </a>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* Basic Campaign Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Campaign Information</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Goal Amount:</span>
                              <span className="font-medium">₱{Number(campaignDetails.goalAmount).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Current Amount:</span>
                              <span className="font-medium">₱{Number(campaignDetails.currentAmount).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Status:</span>
                              <Badge variant="secondary">{campaignDetails.status}</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Category:</span>
                              <span className="font-medium">{campaignDetails.category}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Created:</span>
                              <span className="font-medium">{new Date(campaignDetails.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Volunteer Information</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Slots Needed:</span>
                              <span className="font-medium">{campaignDetails.volunteerSlots || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Slots Filled:</span>
                              <span className="font-medium">{campaignDetails.volunteerSlotsFilledCount || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Available Slots:</span>
                              <span className="font-medium">{(campaignDetails.volunteerSlots || 0) - (campaignDetails.volunteerSlotsFilledCount || 0)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Location:</span>
                              <span className="font-medium">{campaignDetails.location || 'Not specified'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Campaign Description */}
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Description</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {campaignDetails.description}
                      </p>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}