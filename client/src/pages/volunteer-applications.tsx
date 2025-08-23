import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  User,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  MessageSquare,
  Send,
  Inbox
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function VolunteerApplications() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedVolunteerDetails, setSelectedVolunteerDetails] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Fetch volunteer applications I received for my campaigns
  const { data: receivedApplications = [], isLoading: receivedLoading } = useQuery({
    queryKey: ["/api/user/volunteer-applications/received"],
    enabled: isAuthenticated,
  }) as { data: any[], isLoading: boolean };

  // Fetch volunteer applications I sent to other campaigns
  const { data: sentApplications = [], isLoading: sentLoading } = useQuery({
    queryKey: ["/api/user/volunteer-applications/sent"],
    enabled: isAuthenticated,
  }) as { data: any[], isLoading: boolean };

  // Approve application mutation
  const approveMutation = useMutation({
    mutationFn: async ({ campaignId, applicationId }: { campaignId: string; applicationId: string }) => {
      return await apiRequest("POST", `/api/campaigns/${campaignId}/volunteer-applications/${applicationId}/approve`, {});
    },
    onSuccess: () => {
      toast({
        title: "Application Approved! ✅",
        description: "The volunteer has been approved and notified.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/volunteer-applications/received"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve application. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Reject application mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ campaignId, applicationId, reason }: { campaignId: string; applicationId: string; reason: string }) => {
      return await apiRequest("POST", `/api/campaigns/${campaignId}/volunteer-applications/${applicationId}/reject`, {
        reason,
      });
    },
    onSuccess: () => {
      toast({
        title: "Application Rejected",
        description: "The volunteer has been notified of the decision.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/volunteer-applications/received"] });
      setIsRejectModalOpen(false);
      setRejectionReason("");
      setSelectedApplication(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject application. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (campaignId: string, applicationId: string) => {
    approveMutation.mutate({ campaignId, applicationId });
  };

  const handleReject = (application: any) => {
    setSelectedApplication(application);
    setIsRejectModalOpen(true);
  };

  const handleViewDetails = (application: any) => {
    setSelectedVolunteerDetails(application);
    setIsDetailsModalOpen(true);
  };

  const confirmReject = () => {
    if (selectedApplication) {
      rejectMutation.mutate({
        campaignId: selectedApplication.campaignId,
        applicationId: selectedApplication.id,
        reason: rejectionReason,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const getCategoryBadge = (category: string) => {
    const categoryColors = {
      "animal welfare": "bg-purple-100 text-purple-800",
      emergency: "bg-red-100 text-red-800",
      education: "bg-blue-100 text-blue-800",
      healthcare: "bg-green-100 text-green-800",
      community: "bg-purple-100 text-purple-800",
      environment: "bg-green-100 text-green-800",
      sports: "bg-orange-100 text-orange-800",
      "memorial & funeral support": "bg-gray-100 text-gray-800",
    };

    return (
      <Badge className={`text-xs ${categoryColors[category as keyof typeof categoryColors] || "bg-gray-100 text-gray-800"}`}>
        {category}
      </Badge>
    );
  };

  if (isLoading || receivedLoading || sentLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p>Please sign in to view volunteer applications.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4" data-testid="page-title">
            Volunteer Applications
          </h1>
          <p className="text-lg text-gray-600">
            Manage all your volunteer activities and requests in one place
          </p>
        </div>

        <Tabs defaultValue="received" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="received" className="flex items-center gap-2">
              <Inbox className="w-4 h-4" />
              Requests Received ({receivedApplications.length})
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              Applications Sent ({sentApplications.length})
            </TabsTrigger>
          </TabsList>

          {/* Received Applications Tab */}
          <TabsContent value="received" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Volunteer Requests for My Campaigns
              </h2>
              <Badge variant="secondary" className="text-sm">
                {receivedApplications.length} total
              </Badge>
            </div>

            {receivedApplications.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Inbox className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Volunteer Requests Yet</h3>
                  <p className="text-gray-600">
                    When volunteers apply to help with your campaigns, their applications will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {receivedApplications.map((application) => (
              <Card key={application.id} className="overflow-hidden" data-testid={`application-${application.id}`}>
                <CardHeader className="bg-gray-50 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div>
                        <CardTitle className="text-lg">{application.campaignTitle}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          {getCategoryBadge(application.campaignCategory)}
                          <span className="text-sm text-gray-500">
                            Applied {format(new Date(application.createdAt), 'PPP')}
                          </span>
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(application.status)}
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Volunteer Information */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        Volunteer Information
                      </h3>
                      
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gray-300 rounded-full overflow-hidden flex items-center justify-center">
                            {application.applicantProfileImageUrl ? (
                              <img 
                                src={`/public-objects${application.applicantProfileImageUrl.replace('/objects', '')}`} 
                                alt="Profile"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-medium text-gray-600">
                                {application.applicantName?.charAt(0) || 'U'}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{application.applicantName}</div>
                            <div className="text-sm text-gray-600">
                              {application.applicantKycStatus === 'verified' ? (
                                <span className="text-green-600 flex items-center">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Verified
                                </span>
                              ) : (
                                <span className="text-yellow-600">Unverified</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {application.volunteerProfile && (
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center text-gray-600">
                              <Mail className="w-4 h-4 mr-2" />
                              {application.applicantEmail}
                            </div>
                            {application.volunteerProfile.phoneNumber && (
                              <div className="flex items-center text-gray-600">
                                <Phone className="w-4 h-4 mr-2" />
                                {application.volunteerProfile.phoneNumber}
                              </div>
                            )}
                            {application.volunteerProfile.address && (
                              <div className="flex items-start text-gray-600">
                                <MapPin className="w-4 h-4 mr-2 mt-0.5" />
                                <span>{application.volunteerProfile.address}</span>
                              </div>
                            )}
                            {application.volunteerProfile.profession && (
                              <div className="flex items-center text-gray-600">
                                <Briefcase className="w-4 h-4 mr-2" />
                                {application.volunteerProfile.profession}
                                {application.volunteerProfile.organizationName && (
                                  <span> at {application.volunteerProfile.organizationName}</span>
                                )}
                              </div>
                            )}
                            {application.volunteerProfile.education && (
                              <div className="flex items-center text-gray-600">
                                <GraduationCap className="w-4 h-4 mr-2" />
                                {application.volunteerProfile.education}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Application Details */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Application Details
                      </h3>
                      
                      <div className="space-y-3">
                        {application.intent && (
                          <div>
                            <div className="text-sm font-medium text-gray-700 mb-1">Intent</div>
                            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                              {application.intent}
                            </div>
                          </div>
                        )}

                        {application.telegramDisplayName && (
                          <div>
                            <div className="text-sm font-medium text-gray-700 mb-1">Telegram Contact</div>
                            <div className="text-sm text-gray-600">
                              <div>Display Name: {application.telegramDisplayName}</div>
                              {application.telegramUsername && (
                                <div>Username: {application.telegramUsername}</div>
                              )}
                            </div>
                          </div>
                        )}

                        {application.volunteerProfile?.workExperience && (
                          <div>
                            <div className="text-sm font-medium text-gray-700 mb-1">Work Experience</div>
                            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                              {application.volunteerProfile.workExperience}
                            </div>
                          </div>
                        )}

                        {application.rejectionReason && (
                          <div>
                            <div className="text-sm font-medium text-red-700 mb-1">Rejection Reason</div>
                            <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
                              {application.rejectionReason}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-6 pt-6 border-t">
                    <Button
                      variant="outline"
                      onClick={() => handleViewDetails(application)}
                      className="border-blue-200 text-blue-600 hover:bg-blue-50"
                      data-testid={`button-view-details-${application.id}`}
                    >
                      <User className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    {application.status === 'pending' && (
                      <>
                        <Button
                          onClick={() => handleApprove(application.campaignId, application.id)}
                          disabled={approveMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                          data-testid={`button-approve-${application.id}`}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {approveMutation.isPending ? "Approving..." : "Approve"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleReject(application)}
                          disabled={rejectMutation.isPending}
                          className="border-red-200 text-red-600 hover:bg-red-50"
                          data-testid={`button-reject-${application.id}`}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
              </div>
            )}
          </TabsContent>

          {/* Sent Applications Tab */}
          <TabsContent value="sent" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                My Volunteer Applications
              </h2>
              <Badge variant="secondary" className="text-sm">
                {sentApplications.length} total
              </Badge>
            </div>

            {sentApplications.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Send className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Sent Yet</h3>
                  <p className="text-gray-600">
                    When you apply to volunteer for campaigns, your applications will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {sentApplications.map((application) => (
                  <Card key={application.id} className="overflow-hidden" data-testid={`sent-application-${application.id}`}>
                    <CardHeader className="bg-blue-50 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div>
                            <CardTitle className="text-lg">{application.campaignTitle}</CardTitle>
                            <div className="flex items-center space-x-2 mt-1">
                              {getCategoryBadge(application.campaignCategory)}
                              <span className="text-sm text-gray-500">
                                Applied {format(new Date(application.createdAt), 'PPP')}
                              </span>
                            </div>
                          </div>
                        </div>
                        {getStatusBadge(application.status)}
                      </div>
                    </CardHeader>

                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* My Application Details */}
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            My Application
                          </h3>
                          
                          <div className="space-y-3">
                            {application.intent && (
                              <div>
                                <div className="text-sm font-medium text-gray-700 mb-1">Intent</div>
                                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                                  {application.intent}
                                </div>
                              </div>
                            )}

                            {application.telegramDisplayName && (
                              <div>
                                <div className="text-sm font-medium text-gray-700 mb-1">Telegram Contact</div>
                                <div className="text-sm text-gray-600">
                                  <div>Display Name: {application.telegramDisplayName}</div>
                                  {application.telegramUsername && (
                                    <div>Username: {application.telegramUsername}</div>
                                  )}
                                </div>
                              </div>
                            )}

                            {application.rejectionReason && (
                              <div>
                                <div className="text-sm font-medium text-red-700 mb-1">Rejection Reason</div>
                                <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
                                  {application.rejectionReason}
                                </div>
                              </div>
                            )}

                            <div className="pt-3 border-t">
                              <div className="text-sm text-gray-500">
                                <strong>Status:</strong> {application.status === 'pending' ? 'Waiting for response' : 
                                  application.status === 'approved' ? 'Approved - You can start volunteering!' :
                                  'Application was declined'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Volunteer Details Modal */}
        <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Volunteer Details
              </DialogTitle>
            </DialogHeader>
            
            {selectedVolunteerDetails && (
              <div className="space-y-6">
                {/* Header Section */}
                <div className="flex items-start gap-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-400 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                    {selectedVolunteerDetails.volunteerProfile?.profileImageUrl ? (
                      <img 
                        src={selectedVolunteerDetails.volunteerProfile.profileImageUrl} 
                        alt="Profile" 
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    ) : (
                      <span>{selectedVolunteerDetails.applicantName?.[0] || selectedVolunteerDetails.volunteerProfile?.firstName?.[0] || 'V'}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedVolunteerDetails.applicantName || 
                       `${selectedVolunteerDetails.volunteerProfile?.firstName || 'Anonymous'} ${selectedVolunteerDetails.volunteerProfile?.lastName || 'Volunteer'}`}
                    </h2>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm">{selectedVolunteerDetails.applicantEmail || selectedVolunteerDetails.volunteerProfile?.email || 'Email not provided'}</span>
                      </div>
                      <Badge 
                        variant={
                          selectedVolunteerDetails.volunteerProfile?.kycStatus === 'verified' ? 'default' : 
                          selectedVolunteerDetails.volunteerProfile?.kycStatus === 'pending' ? 'secondary' : 
                          'destructive'
                        }
                      >
                        <Award className="w-3 h-3 mr-1" />
                        KYC {selectedVolunteerDetails.volunteerProfile?.kycStatus || 'Not started'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Application Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-lg mb-3 flex items-center">
                        <MessageSquare className="w-5 h-5 mr-2" />
                        Application Details
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <div className="text-sm font-medium text-gray-700">Campaign Applied To</div>
                          <div className="text-sm text-gray-600">{selectedVolunteerDetails.campaignTitle}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700">Application Date</div>
                          <div className="text-sm text-gray-600">{format(new Date(selectedVolunteerDetails.createdAt), 'PPP')}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700">Status</div>
                          <div className="text-sm">{getStatusBadge(selectedVolunteerDetails.status)}</div>
                        </div>
                        {selectedVolunteerDetails.intent && (
                          <div>
                            <div className="text-sm font-medium text-gray-700 mb-1">Volunteer Intent</div>
                            <div className="text-sm text-gray-600 bg-white p-3 rounded border">
                              {selectedVolunteerDetails.intent}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-lg mb-3 flex items-center">
                        <Phone className="w-5 h-5 mr-2" />
                        Contact Information
                      </h3>
                      <div className="space-y-3">
                        {selectedVolunteerDetails.volunteerProfile?.phoneNumber && (
                          <div>
                            <div className="text-sm font-medium text-gray-700">Phone Number</div>
                            <div className="text-sm text-gray-600">{selectedVolunteerDetails.volunteerProfile.phoneNumber}</div>
                          </div>
                        )}
                        {selectedVolunteerDetails.volunteerProfile?.address && (
                          <div>
                            <div className="text-sm font-medium text-gray-700">Address</div>
                            <div className="text-sm text-gray-600">{selectedVolunteerDetails.volunteerProfile.address}</div>
                          </div>
                        )}
                        {(selectedVolunteerDetails.telegramDisplayName || selectedVolunteerDetails.telegramUsername) && (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                            <div className="font-semibold text-sm text-blue-800 mb-2">📱 Telegram Contact</div>
                            {selectedVolunteerDetails.telegramDisplayName && (
                              <div className="text-sm text-blue-700">Display Name: {selectedVolunteerDetails.telegramDisplayName}</div>
                            )}
                            {selectedVolunteerDetails.telegramUsername && (
                              <div className="text-sm text-blue-700">Username: @{selectedVolunteerDetails.telegramUsername}</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Professional Information */}
                    {(selectedVolunteerDetails.volunteerProfile?.skills || selectedVolunteerDetails.volunteerProfile?.workExperience) && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-semibold text-lg mb-3 flex items-center">
                          <Briefcase className="w-5 h-5 mr-2" />
                          Professional Background
                        </h3>
                        <div className="space-y-3">
                          {selectedVolunteerDetails.volunteerProfile?.skills && (
                            <div>
                              <div className="text-sm font-medium text-gray-700 mb-1">Skills</div>
                              <div className="text-sm text-gray-600 bg-white p-3 rounded border">
                                {selectedVolunteerDetails.volunteerProfile.skills}
                              </div>
                            </div>
                          )}
                          {selectedVolunteerDetails.volunteerProfile?.workExperience && (
                            <div>
                              <div className="text-sm font-medium text-gray-700 mb-1">Work Experience</div>
                              <div className="text-sm text-gray-600 bg-white p-3 rounded border">
                                {selectedVolunteerDetails.volunteerProfile.workExperience}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Education */}
                    {selectedVolunteerDetails.volunteerProfile?.education && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-semibold text-lg mb-3 flex items-center">
                          <GraduationCap className="w-5 h-5 mr-2" />
                          Education
                        </h3>
                        <div className="text-sm text-gray-600 bg-white p-3 rounded border">
                          {selectedVolunteerDetails.volunteerProfile.education}
                        </div>
                      </div>
                    )}

                    {/* Additional Information */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-lg mb-3 flex items-center">
                        <Calendar className="w-5 h-5 mr-2" />
                        Additional Information
                      </h3>
                      <div className="space-y-3">
                        {selectedVolunteerDetails.volunteerProfile?.dateOfBirth && (
                          <div>
                            <div className="text-sm font-medium text-gray-700">Date of Birth</div>
                            <div className="text-sm text-gray-600">{format(new Date(selectedVolunteerDetails.volunteerProfile.dateOfBirth), 'PPP')}</div>
                          </div>
                        )}
                        {selectedVolunteerDetails.rejectionReason && (
                          <div>
                            <div className="text-sm font-medium text-red-700 mb-1">Rejection Reason</div>
                            <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
                              {selectedVolunteerDetails.rejectionReason}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons in Modal */}
                {selectedVolunteerDetails.status === 'pending' && (
                  <div className="flex justify-end gap-3 pt-6 border-t">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsDetailsModalOpen(false);
                        handleReject(selectedVolunteerDetails);
                      }}
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject Application
                    </Button>
                    <Button
                      onClick={() => {
                        setIsDetailsModalOpen(false);
                        handleApprove(selectedVolunteerDetails.campaignId, selectedVolunteerDetails.id);
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Application
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Reject Modal */}
        <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Volunteer Application</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Please provide a reason for rejecting this application. This will help the volunteer understand your decision.
              </p>
              <Textarea
                placeholder="Enter rejection reason..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[100px]"
                data-testid="textarea-rejection-reason"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsRejectModalOpen(false);
                    setRejectionReason("");
                    setSelectedApplication(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmReject}
                  disabled={rejectMutation.isPending || !rejectionReason.trim()}
                  className="bg-red-600 hover:bg-red-700"
                  data-testid="button-confirm-reject"
                >
                  {rejectMutation.isPending ? "Rejecting..." : "Reject Application"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}