import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ObjectUploader } from "@/components/ObjectUploader";
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
  Inbox,
  Star,
  Flag,
  Upload,
  FileText,
  Image,
  Eye,
  X
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { VolunteerRatingModal } from "@/components/VolunteerRatingModal";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const volunteerReportSchema = z.object({
  reportType: z.string().min(1, "Report type is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  attachments: z.array(z.string()).optional(),
});

export default function VolunteerApplications() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedVolunteerDetails, setSelectedVolunteerDetails] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedCampaignDetails, setSelectedCampaignDetails] = useState(null);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [selectedCreatorDetails, setSelectedCreatorDetails] = useState(null);
  const [isCreatorModalOpen, setIsCreatorModalOpen] = useState(false);
  const [selectedVolunteerForRating, setSelectedVolunteerForRating] = useState(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [selectedVolunteerForReport, setSelectedVolunteerForReport] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const volunteerReportForm = useForm<z.infer<typeof volunteerReportSchema>>({
    resolver: zodResolver(volunteerReportSchema),
    defaultValues: {
      reportType: '',
      description: '',
      attachments: [],
    },
  });

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

  const handleRateVolunteer = (application: any) => {
    setSelectedVolunteerForRating(application);
    setIsRatingModalOpen(true);
  };

  const handleReportVolunteer = (application: any) => {
    setSelectedVolunteerForReport(application);
    volunteerReportForm.reset();
    setUploadedFiles([]);
    setIsReportModalOpen(true);
  };

  // File upload handlers
  const handleFileUploadComplete = (files: { uploadURL: string; name: string; size: number; type: string }[]) => {
    console.log('Volunteer report upload complete files:', files);
    
    if (files && files.length > 0) {
      console.log('Processing uploaded files:', files);
      
      const newFileUrls = files.map((file) => {
        console.log('Processing file:', file);
        return file.uploadURL;
      });
      
      console.log('New file URLs:', newFileUrls);
      
      const updatedFiles = [...uploadedFiles, ...newFileUrls];
      console.log('Updated files array:', updatedFiles);
      
      setUploadedFiles(updatedFiles);
      volunteerReportForm.setValue('attachments', updatedFiles);
      
      toast({
        title: "Files uploaded successfully",
        description: `${newFileUrls.length} file(s) uploaded as evidence`,
      });
    } else {
      console.error('No files provided to handleFileUploadComplete:', files);
    }
  };

  const removeUploadedFile = (fileUrl: string) => {
    const updatedFiles = uploadedFiles.filter(url => url !== fileUrl);
    setUploadedFiles(updatedFiles);
    volunteerReportForm.setValue('attachments', updatedFiles);
  };

  // Report volunteer mutation
  const reportVolunteerMutation = useMutation({
    mutationFn: async ({ campaignId, volunteerId, reportType, description, attachments }: { 
      campaignId: string; 
      volunteerId: string; 
      reportType: string; 
      description: string; 
      attachments?: string[];
    }) => {
      return await apiRequest("POST", `/api/campaigns/${campaignId}/report-volunteer`, {
        volunteerId,
        reason: reportType, // Backend expects 'reason' field
        description,
        attachments
      });
    },
    onSuccess: () => {
      toast({
        title: "Report Submitted",
        description: "Thank you for helping keep our community safe. Your report has been submitted for review.",
      });
      setIsReportModalOpen(false);
      setSelectedVolunteerForReport(null);
      volunteerReportForm.reset();
      setUploadedFiles([]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmitVolunteerReport = (data: z.infer<typeof volunteerReportSchema>) => {
    if (!selectedVolunteerForReport) return;
    
    reportVolunteerMutation.mutate({
      campaignId: selectedVolunteerForReport.campaignId,
      volunteerId: selectedVolunteerForReport.volunteerId,
      reportType: data.reportType,
      description: data.description,
      attachments: data.attachments,
    });
  };

  const handleViewCampaign = (application: any) => {
    // Redirect to campaign detail page
    window.location.href = `/campaign/${application.campaignId}`;
  };

  const handleViewCreator = async (application: any) => {
    try {
      // Fetch comprehensive creator profile details
      const response = await fetch(`/api/creator/${application.creatorId}/profile`);
      if (response.ok) {
        const creatorData = await response.json();
        setSelectedCreatorDetails(creatorData);
        setIsCreatorModalOpen(true);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load creator details",
        variant: "destructive",
      });
    }
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
                                src={application.applicantProfileImageUrl} 
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

                        {application.status === 'approved' && application.telegramDisplayName && (
                          <div className="p-3 bg-green-50 border border-green-200 rounded">
                            <div className="text-sm font-medium text-green-800 mb-1 flex items-center">
                              📱 Telegram Contact (Available after approval)
                            </div>
                            <div className="text-sm text-green-700">
                              <div><strong>Display Name:</strong> {application.telegramDisplayName}</div>
                              {application.telegramUsername && (
                                <div><strong>Username:</strong> @{application.telegramUsername.replace(/^@/, '')}</div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {application.status !== 'approved' && application.telegramDisplayName && (
                          <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                            <div className="text-sm font-medium text-gray-600 mb-1 flex items-center">
                              📱 Telegram Contact
                            </div>
                            <div className="text-sm text-gray-500 italic">
                              Contact details will be available after approval
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
                    {application.status === 'approved' && (
                      <>
                        <Button
                          onClick={() => handleRateVolunteer(application)}
                          className="bg-green-600 hover:bg-green-700"
                          data-testid={`button-rate-volunteer-${application.id}`}
                        >
                          <Star className="w-4 h-4 mr-2" />
                          Rate Volunteer
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleReportVolunteer(application)}
                          className="border-red-200 text-red-600 hover:bg-red-50"
                          data-testid={`button-report-volunteer-${application.id}`}
                        >
                          <Flag className="w-4 h-4 mr-2" />
                          Report Volunteer
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

                        {/* Action Buttons for Sent Applications */}
                        <div className="flex gap-3 mt-6 pt-6 border-t">
                          <Button
                            variant="outline"
                            onClick={() => handleViewCampaign(application)}
                            className="border-green-200 text-green-600 hover:bg-green-50"
                            data-testid={`button-view-campaign-${application.id}`}
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            Campaign Details
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleViewCreator(application)}
                            className="border-purple-200 text-purple-600 hover:bg-purple-50"
                            data-testid={`button-view-creator-${application.id}`}
                          >
                            <User className="w-4 h-4 mr-2" />
                            Creator Details
                          </Button>
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
                        {selectedVolunteerDetails.status === 'approved' && (selectedVolunteerDetails.telegramDisplayName || selectedVolunteerDetails.telegramUsername) && (
                          <div className="p-3 bg-green-50 border border-green-200 rounded">
                            <div className="font-semibold text-sm text-green-800 mb-2">📱 Telegram Contact (Available after approval)</div>
                            {selectedVolunteerDetails.telegramDisplayName && (
                              <div className="text-sm text-green-700"><strong>Display Name:</strong> {selectedVolunteerDetails.telegramDisplayName}</div>
                            )}
                            {selectedVolunteerDetails.telegramUsername && (
                              <div className="text-sm text-green-700"><strong>Username:</strong> @{selectedVolunteerDetails.telegramUsername.replace(/^@/, '')}</div>
                            )}
                          </div>
                        )}
                        
                        {selectedVolunteerDetails.status !== 'approved' && (selectedVolunteerDetails.telegramDisplayName || selectedVolunteerDetails.telegramUsername) && (
                          <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                            <div className="font-semibold text-sm text-gray-600 mb-2">📱 Telegram Contact</div>
                            <div className="text-sm text-gray-500 italic">
                              Contact details will be available after approval
                            </div>
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

        {/* Campaign Details Modal */}
        <Dialog open={isCampaignModalOpen} onOpenChange={setIsCampaignModalOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Campaign Details
              </DialogTitle>
            </DialogHeader>
            
            {selectedCampaignDetails && (
              <div className="space-y-6">
                {/* Campaign Header */}
                <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {selectedCampaignDetails.title}
                      </h2>
                      <div className="flex items-center gap-4 mb-4">
                        {getCategoryBadge(selectedCampaignDetails.category)}
                        <Badge variant="secondary">
                          {selectedCampaignDetails.status}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          Created {format(new Date(selectedCampaignDetails.createdAt), 'PPP')}
                        </span>
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        {selectedCampaignDetails.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Campaign Financial Information */}
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-lg mb-3">💰 Financial Information</h3>
                      <div className="space-y-3">
                        <div>
                          <div className="text-sm font-medium text-gray-700">Goal Amount</div>
                          <div className="text-lg font-bold text-green-600">
                            ₱{parseFloat(selectedCampaignDetails.goalAmount || selectedCampaignDetails.targetAmount || "0").toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700">Minimum Operational Amount</div>
                          <div className="text-lg font-bold text-orange-600">
                            ₱{parseFloat(selectedCampaignDetails.minimumAmount || "0").toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700">Current Amount Raised</div>
                          <div className="text-lg font-bold text-blue-600">
                            ₱{parseFloat(selectedCampaignDetails.currentAmount || "0").toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700">Progress</div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{
                                width: `${Math.min((parseFloat(selectedCampaignDetails.currentAmount || "0") / parseFloat(selectedCampaignDetails.goalAmount || selectedCampaignDetails.targetAmount || "1")) * 100, 100)}%`
                              }}
                            ></div>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {Math.round((parseFloat(selectedCampaignDetails.currentAmount || "0") / parseFloat(selectedCampaignDetails.goalAmount || selectedCampaignDetails.targetAmount || "1")) * 100)}% of goal reached
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Campaign Timeline */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-lg mb-3">📅 Campaign Timeline</h3>
                      <div className="space-y-3">
                        <div>
                          <div className="text-sm font-medium text-gray-700">Duration</div>
                          <div className="text-sm text-gray-600">
                            {selectedCampaignDetails.duration || 'Not specified'} days
                          </div>
                        </div>
                        {selectedCampaignDetails.startDate && (
                          <div>
                            <div className="text-sm font-medium text-gray-700">Campaign Start Date</div>
                            <div className="text-sm text-gray-600">
                              {format(new Date(selectedCampaignDetails.startDate), 'PPP')}
                            </div>
                          </div>
                        )}
                        {selectedCampaignDetails.endDate && (
                          <div>
                            <div className="text-sm font-medium text-gray-700">Campaign End Date</div>
                            <div className="text-sm text-gray-600">
                              {format(new Date(selectedCampaignDetails.endDate), 'PPP')}
                            </div>
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-700">Created</div>
                          <div className="text-sm text-gray-600">
                            {format(new Date(selectedCampaignDetails.createdAt), 'PPP')}
                          </div>
                        </div>
                        {selectedCampaignDetails.updatedAt && (
                          <div>
                            <div className="text-sm font-medium text-gray-700">Last Updated</div>
                            <div className="text-sm text-gray-600">
                              {format(new Date(selectedCampaignDetails.updatedAt), 'PPP')}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Verification Status */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-lg mb-3">✅ Verification Status</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-gray-700">TES Verification:</div>
                          <Badge variant={selectedCampaignDetails.tesVerified ? "default" : "secondary"}>
                            {selectedCampaignDetails.tesVerified ? "✅ Verified" : "⏳ Pending"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-gray-700">Campaign Status:</div>
                          <Badge variant="outline">
                            {selectedCampaignDetails.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Location & Event Details */}
                  <div className="space-y-4">
                    {/* Event Location Summary */}
                    <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                      <h3 className="font-semibold text-lg mb-3 text-blue-900">🎯 Event Location</h3>
                      <div className="bg-white p-3 rounded border">
                        <div className="text-lg font-bold text-blue-800 mb-2">
                          {(() => {
                            const addressParts = [
                              selectedCampaignDetails.street,
                              selectedCampaignDetails.barangay,
                              selectedCampaignDetails.city,
                              selectedCampaignDetails.province,
                              selectedCampaignDetails.zipcode
                            ].filter(Boolean);
                            
                            if (addressParts.length === 0) {
                              return "Location details not specified";
                            }
                            
                            return addressParts.join(", ");
                          })()}
                        </div>
                        {selectedCampaignDetails.landmark && (
                          <div className="text-sm text-blue-700">
                            📍 <strong>Landmark:</strong> {selectedCampaignDetails.landmark}
                          </div>
                        )}
                        {(!selectedCampaignDetails.street && !selectedCampaignDetails.city && !selectedCampaignDetails.province) && (
                          <div className="text-sm text-gray-500 italic">
                            ⚠️ Location details have not been provided for this campaign
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Detailed Location Breakdown */}
                    {(selectedCampaignDetails.street || selectedCampaignDetails.city || selectedCampaignDetails.province) && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-semibold text-lg mb-3">📍 Detailed Address Breakdown</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {selectedCampaignDetails.street && (
                            <div>
                              <div className="text-sm font-medium text-gray-700">Street Address</div>
                              <div className="text-sm text-gray-600">{selectedCampaignDetails.street}</div>
                            </div>
                          )}
                          {selectedCampaignDetails.barangay && (
                            <div>
                              <div className="text-sm font-medium text-gray-700">Barangay</div>
                              <div className="text-sm text-gray-600">{selectedCampaignDetails.barangay}</div>
                            </div>
                          )}
                          {selectedCampaignDetails.city && (
                            <div>
                              <div className="text-sm font-medium text-gray-700">City</div>
                              <div className="text-sm text-gray-600">{selectedCampaignDetails.city}</div>
                            </div>
                          )}
                          {selectedCampaignDetails.province && (
                            <div>
                              <div className="text-sm font-medium text-gray-700">Province</div>
                              <div className="text-sm text-gray-600">{selectedCampaignDetails.province}</div>
                            </div>
                          )}
                          {selectedCampaignDetails.zipcode && (
                            <div>
                              <div className="text-sm font-medium text-gray-700">Zip Code</div>
                              <div className="text-sm text-gray-600">{selectedCampaignDetails.zipcode}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Volunteer Information */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-lg mb-3">👥 Volunteer Requirements</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-gray-700">Needs Volunteers:</div>
                          <Badge variant={selectedCampaignDetails.needsVolunteers ? "default" : "secondary"}>
                            {selectedCampaignDetails.needsVolunteers ? "✅ Yes" : "❌ No"}
                          </Badge>
                        </div>
                        {selectedCampaignDetails.needsVolunteers && (
                          <>
                            <div>
                              <div className="text-sm font-medium text-gray-700">Volunteer Slots Available</div>
                              <div className="text-lg font-bold text-blue-600">
                                {selectedCampaignDetails.volunteerSlots || selectedCampaignDetails.volunteerSlotsNeeded || 0} total spots
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-700">Volunteers Joined</div>
                              <div className="text-lg font-bold text-green-600">
                                {selectedCampaignDetails.volunteerSlotsFilledCount || 0} volunteers
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-700">Available Spots</div>
                              <div className="text-lg font-bold text-orange-600">
                                {((selectedCampaignDetails.volunteerSlots || selectedCampaignDetails.volunteerSlotsNeeded || 0) - (selectedCampaignDetails.volunteerSlotsFilledCount || 0))} remaining
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Media & Additional Information */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-lg mb-3">📱 Media & Resources</h3>
                      <div className="space-y-3">
                        {selectedCampaignDetails.youtubeUrl && (
                          <div>
                            <div className="text-sm font-medium text-gray-700">YouTube Video</div>
                            <a 
                              href={selectedCampaignDetails.youtubeUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                            >
                              🎥 Watch Campaign Video
                            </a>
                          </div>
                        )}
                        {selectedCampaignDetails.images && (
                          <div>
                            <div className="text-sm font-medium text-gray-700 mb-2">Campaign Images</div>
                            <div className="grid grid-cols-2 gap-2">
                              {(() => {
                                try {
                                  // Try to parse as JSON array first
                                  const imageArray = JSON.parse(selectedCampaignDetails.images);
                                  return Array.isArray(imageArray) ? imageArray : [selectedCampaignDetails.images];
                                } catch {
                                  // If parsing fails, treat as single URL string
                                  return [selectedCampaignDetails.images];
                                }
                              })().map((imageUrl: string, index: number) => (
                                <img 
                                  key={index}
                                  src={imageUrl} 
                                  alt={`Campaign image ${index + 1}`}
                                  className="w-full h-20 object-cover rounded border"
                                />
                              ))}
                            </div>
                          </div>
                        )}
                        {(!selectedCampaignDetails.youtubeUrl && !selectedCampaignDetails.images) && (
                          <div className="text-sm text-gray-500 italic">No media files uploaded</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Creator Details Modal */}
        <Dialog open={isCreatorModalOpen} onOpenChange={setIsCreatorModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                {selectedCreatorDetails ? 
                  `${selectedCreatorDetails.firstName || 'Anonymous'} ${selectedCreatorDetails.lastName || 'Creator'}` : 
                  'Campaign Creator'
                }
              </DialogTitle>
            </DialogHeader>
            
            {selectedCreatorDetails && (
              <div className="space-y-6">
                {/* Creator Header */}
                <div className="flex items-start gap-6 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-400 to-pink-600 flex items-center justify-center text-white text-2xl font-bold">
                    {selectedCreatorDetails.profileImageUrl ? (
                      <img 
                        src={selectedCreatorDetails.profileImageUrl} 
                        alt="Profile" 
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    ) : (
                      <span>{selectedCreatorDetails.firstName?.[0] || 'C'}{selectedCreatorDetails.lastName?.[0] || ''}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedCreatorDetails.firstName || 'Anonymous'} {selectedCreatorDetails.lastName || 'Creator'}
                    </h2>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm">{selectedCreatorDetails.email || 'Email not provided'}</span>
                      </div>
                      <Badge 
                        variant={
                          selectedCreatorDetails.kycStatus === 'verified' ? 'default' : 
                          selectedCreatorDetails.kycStatus === 'pending' ? 'secondary' : 
                          'destructive'
                        }
                      >
                        <Award className="w-3 h-3 mr-1" />
                        KYC {selectedCreatorDetails.kycStatus || 'Not started'}
                      </Badge>
                    </div>
                    {selectedCreatorDetails.joinDate && (
                      <p className="text-sm text-gray-500 mt-1">
                        Member since {format(new Date(selectedCreatorDetails.joinDate), 'MMMM yyyy')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Creator Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600">
                      {selectedCreatorDetails.totalCampaigns || 0}
                    </div>
                    <div className="text-sm text-blue-800">Total Campaigns</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-green-600">
                      ₱{parseFloat(selectedCreatorDetails.totalRaised || "0").toLocaleString()}
                    </div>
                    <div className="text-sm text-green-800">Total Funds Raised</div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="text-2xl font-bold text-purple-600">
                      {selectedCreatorDetails.averageRating || 'N/A'}
                      {selectedCreatorDetails.averageRating && '/5'}
                    </div>
                    <div className="text-sm text-purple-800">
                      Creator Rating ({selectedCreatorDetails.totalRatings || 0} reviews)
                    </div>
                  </div>
                </div>

                {/* Trust & Community Scores */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600">
                      {selectedCreatorDetails.creditScore ? `${Math.round(selectedCreatorDetails.creditScore)}%` : 'N/A'}
                    </div>
                    <div className="text-sm text-blue-800">Credit Score</div>
                    <div className="text-xs text-blue-600">Document quality rating</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-green-600">
                      {selectedCreatorDetails.socialScore || 0}
                    </div>
                    <div className="text-sm text-green-800">Social Score</div>
                    <div className="text-xs text-green-600">Community safety points</div>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="text-2xl font-bold text-yellow-600">
                      {selectedCreatorDetails.averageSuccess ? `${Math.round(selectedCreatorDetails.averageSuccess)}%` : 'N/A'}
                    </div>
                    <div className="text-sm text-yellow-800">Success Rate</div>
                    <div className="text-xs text-yellow-600">Campaign completion rate</div>
                  </div>
                </div>

                {/* Creator Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Contact & Professional Info */}
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-lg mb-3">📞 Contact Information</h3>
                      <div className="space-y-3">
                        <div>
                          <div className="text-sm font-medium text-gray-700">Email Address</div>
                          <div className="text-sm text-gray-600">{selectedCreatorDetails.email}</div>
                        </div>
                        {selectedCreatorDetails.phoneNumber && (
                          <div>
                            <div className="text-sm font-medium text-gray-700">Phone Number</div>
                            <div className="text-sm text-gray-600">{selectedCreatorDetails.phoneNumber}</div>
                          </div>
                        )}
                        {selectedCreatorDetails.address && (
                          <div>
                            <div className="text-sm font-medium text-gray-700">Address</div>
                            <div className="text-sm text-gray-600">{selectedCreatorDetails.address}</div>
                          </div>
                        )}
                        {selectedCreatorDetails.linkedinProfile && (
                          <div>
                            <div className="text-sm font-medium text-gray-700">LinkedIn Profile</div>
                            <a 
                              href={selectedCreatorDetails.linkedinProfile}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline"
                            >
                              View LinkedIn Profile
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-lg mb-3">💼 Professional Information</h3>
                      <div className="space-y-3">
                        {selectedCreatorDetails.profession && (
                          <div>
                            <div className="text-sm font-medium text-gray-700">Profession</div>
                            <div className="text-sm text-gray-600">{selectedCreatorDetails.profession}</div>
                          </div>
                        )}
                        {selectedCreatorDetails.organizationName && (
                          <div>
                            <div className="text-sm font-medium text-gray-700">Organization</div>
                            <div className="text-sm text-gray-600">
                              {selectedCreatorDetails.organizationName}
                              {selectedCreatorDetails.organizationType && (
                                <span className="text-gray-500"> ({selectedCreatorDetails.organizationType})</span>
                              )}
                            </div>
                          </div>
                        )}
                        {selectedCreatorDetails.workExperience && (
                          <div>
                            <div className="text-sm font-medium text-gray-700">Work Experience</div>
                            <div className="text-sm text-gray-600 bg-white p-3 rounded border">
                              {selectedCreatorDetails.workExperience}
                            </div>
                          </div>
                        )}
                        {selectedCreatorDetails.skills && (
                          <div>
                            <div className="text-sm font-medium text-gray-700">Skills</div>
                            <div className="text-sm text-gray-600 bg-white p-3 rounded border">
                              {selectedCreatorDetails.skills}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Education & Campaign Performance */}
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-lg mb-3">🎓 Education & Background</h3>
                      <div className="space-y-3">
                        {selectedCreatorDetails.education && (
                          <div>
                            <div className="text-sm font-medium text-gray-700">Education</div>
                            <div className="text-sm text-gray-600 bg-white p-3 rounded border">
                              {selectedCreatorDetails.education}
                            </div>
                          </div>
                        )}
                        {selectedCreatorDetails.dateOfBirth && (
                          <div>
                            <div className="text-sm font-medium text-gray-700">Date of Birth</div>
                            <div className="text-sm text-gray-600">
                              {format(new Date(selectedCreatorDetails.dateOfBirth), 'PPP')}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-lg mb-3">📊 Campaign Performance</h3>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="text-center p-2 bg-white rounded border">
                            <div className="text-lg font-bold text-blue-600">
                              {selectedCreatorDetails.activeCampaigns || 0}
                            </div>
                            <div className="text-xs text-blue-800">Active Campaigns</div>
                          </div>
                          <div className="text-center p-2 bg-white rounded border">
                            <div className="text-lg font-bold text-green-600">
                              {selectedCreatorDetails.completedCampaigns || 0}
                            </div>
                            <div className="text-xs text-green-800">Completed</div>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700">Total Contributions Made</div>
                          <div className="text-sm text-gray-600">
                            ₱{parseFloat(selectedCreatorDetails.totalContributed || "0").toLocaleString()} 
                            ({selectedCreatorDetails.totalContributions || 0} contributions)
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700">Account Balances</div>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div>PHP: ₱{parseFloat(selectedCreatorDetails.pusoBalance || "0").toLocaleString()}</div>
                            <div>Tips: ₱{parseFloat(selectedCreatorDetails.tipsBalance || "0").toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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

        {/* Volunteer Rating Modal */}
        {selectedVolunteerForRating && (
          <VolunteerRatingModal
            isOpen={isRatingModalOpen}
            onClose={() => {
              setIsRatingModalOpen(false);
              setSelectedVolunteerForRating(null);
            }}
            volunteer={{
              id: selectedVolunteerForRating.volunteerId,
              firstName: selectedVolunteerForRating.applicantName?.split(' ')[0] || '',
              lastName: selectedVolunteerForRating.applicantName?.split(' ').slice(1).join(' ') || '',
              email: selectedVolunteerForRating.applicantEmail,
              profileImageUrl: selectedVolunteerForRating.applicantProfileImageUrl,
              application: {
                telegramUsername: selectedVolunteerForRating.telegramUsername || 'N/A'
              }
            }}
            campaignId={selectedVolunteerForRating.campaignId}
            campaignTitle={selectedVolunteerForRating.campaignTitle}
          />
        )}

        {/* Report Volunteer Modal */}
        <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Report Volunteer
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-2">
                Please help us maintain community safety by reporting volunteers with problematic behavior.
              </p>
            </DialogHeader>
            
            <Form {...volunteerReportForm}>
              <form onSubmit={volunteerReportForm.handleSubmit(onSubmitVolunteerReport)} className="space-y-4">
                <FormField
                  control={volunteerReportForm.control}
                  name="reportType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Report Type</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="w-full" data-testid="select-volunteer-report-type">
                            <SelectValue placeholder="Select report type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="inappropriate">Inappropriate Behavior</SelectItem>
                            <SelectItem value="unreliable">Unreliable/No-show</SelectItem>
                            <SelectItem value="poor_communication">Poor Communication</SelectItem>
                            <SelectItem value="fake">Fake Profile/Information</SelectItem>
                            <SelectItem value="fraud">Fraud or Suspicious Activity</SelectItem>
                            <SelectItem value="scam">Scam Activity</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={volunteerReportForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Please provide specific details about the issue, including dates, behaviors, and any relevant context..."
                          {...field}
                          rows={4}
                          className="min-h-[100px] resize-none"
                          data-testid="textarea-volunteer-report-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* File Upload Section */}
                <FormField
                  control={volunteerReportForm.control}
                  name="attachments"
                  render={() => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Supporting Evidence (Optional)</FormLabel>
                      <FormControl>
                        <div className="space-y-3">
                          <p className="text-sm text-gray-600">
                            Upload screenshots, documents, or other files that support your report. 
                            While attachments are optional, they can significantly help our team verify 
                            and process your report more effectively.
                          </p>
                          
                          <ObjectUploader
                            maxNumberOfFiles={5}
                            maxFileSize={10485760} // 10MB
                            onGetUploadParameters={async () => {
                              const response: any = await apiRequest('POST', '/api/objects/upload');
                              console.log('Volunteer report upload response:', response);
                              const uploadUrl = response.uploadURL || response.url;
                              console.log('Extracted upload URL:', uploadUrl);
                              
                              if (!uploadUrl) {
                                console.error('No upload URL found in response:', response);
                                throw new Error('No upload URL received from server');
                              }
                              
                              return {
                                method: 'PUT' as const,
                                url: uploadUrl,
                              };
                            }}
                            onComplete={handleFileUploadComplete}
                            buttonClassName="w-full bg-lime-400 hover:bg-lime-500 text-gray-900 font-medium py-3 rounded-lg"
                          >
                            <div className="flex items-center justify-center gap-2">
                              <Upload className="w-4 h-4" />
                              <span>Upload Evidence Files</span>
                            </div>
                          </ObjectUploader>

                          {/* Display uploaded files with previews */}
                          {uploadedFiles.length > 0 && (
                            <div className="space-y-3">
                              <p className="text-sm font-medium">Uploaded Evidence ({uploadedFiles.length}):</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {uploadedFiles.map((fileUrl, index) => {
                                  const fileName = `Evidence file ${index + 1}`;
                                  const fileExtension = fileUrl.split('.').pop()?.toLowerCase() || '';
                                  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension);
                                  const isPdf = fileExtension === 'pdf';
                                  
                                  return (
                                    <div key={index} className="border rounded-lg p-3 bg-white">
                                      {/* File preview */}
                                      <div className="aspect-video bg-gray-50 rounded mb-2 flex items-center justify-center overflow-hidden">
                                        {isImage ? (
                                          <img 
                                            src={fileUrl} 
                                            alt={fileName}
                                            className="max-w-full max-h-full object-contain rounded"
                                            onError={(e) => {
                                              (e.target as HTMLImageElement).style.display = 'none';
                                              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                            }}
                                          />
                                        ) : isPdf ? (
                                          <div className="text-center p-4">
                                            <FileText className="h-8 w-8 mx-auto text-red-500 mb-2" />
                                            <p className="text-xs text-gray-600">PDF Document</p>
                                          </div>
                                        ) : (
                                          <div className="text-center p-4">
                                            <FileText className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                            <p className="text-xs text-gray-600">Document</p>
                                          </div>
                                        )}
                                        <div className="hidden text-center p-4">
                                          <FileText className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                          <p className="text-xs text-gray-600">Preview unavailable</p>
                                        </div>
                                      </div>
                                      
                                      {/* File info and actions */}
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-600 truncate flex-1">{fileName}</span>
                                        <div className="flex gap-1 ml-2">
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => window.open(fileUrl, '_blank')}
                                            className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                                            title="View full size"
                                          >
                                            <Eye className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeUploadedFile(fileUrl)}
                                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                            title="Remove file"
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end gap-3 pt-2">
                  <Button 
                    type="button"
                    variant="ghost"
                    onClick={() => setIsReportModalOpen(false)}
                    className="px-6"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={reportVolunteerMutation.isPending}
                    className="bg-red-500 hover:bg-red-600 px-6"
                    data-testid="button-submit-volunteer-report"
                  >
                    {reportVolunteerMutation.isPending ? "Submitting..." : "Submit Report"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}