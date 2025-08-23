import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
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
  MessageSquare
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

  // Fetch all volunteer applications for user's campaigns
  const { data: applications = [], isLoading: applicationsLoading } = useQuery({
    queryKey: ["/api/user/volunteer-applications"],
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
      queryClient.invalidateQueries({ queryKey: ["/api/user/volunteer-applications"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/user/volunteer-applications"] });
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

  if (isLoading || applicationsLoading) {
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
            Manage volunteer applications for all your campaigns in one place
          </p>
        </div>

        {applications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Volunteer Applications Yet</h3>
              <p className="text-gray-600">
                When volunteers apply to help with your campaigns, their applications will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {applications.map((application) => (
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
                  {application.status === 'pending' && (
                    <div className="flex gap-3 mt-6 pt-6 border-t">
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
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

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