import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import VolunteerCard from "@/components/volunteer-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Search, 
  Filter, 
  Users, 
  MapPin, 
  Calendar,
  Clock,
  Heart,
  CheckCircle,
  Info
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { volunteerApplicationFormSchema } from "@shared/schema";
import { z } from "zod";
import type { VolunteerOpportunity } from "@shared/schema";

const applicationFormSchema = volunteerApplicationFormSchema;

export default function Volunteer() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<VolunteerOpportunity | null>(null);

  const form = useForm<z.infer<typeof applicationFormSchema>>({
    resolver: zodResolver(applicationFormSchema),
    mode: "onChange",
    defaultValues: {
      intent: "",
      telegramDisplayName: "",
      telegramUsername: "",
    },
  });


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

  // Fetch volunteer opportunities
  const { data: opportunities, isLoading: opportunitiesLoading } = useQuery({
    queryKey: ["/api/volunteer-opportunities", selectedStatus],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedStatus && selectedStatus !== "all") params.append("status", selectedStatus);
      return fetch(`/api/volunteer-opportunities?${params.toString()}`).then(res => res.json());
    },
  });

  // Fetch user's applications
  const { data: userApplications } = useQuery({
    queryKey: ["/api/user/volunteer-applications"],
    enabled: isAuthenticated,
    retry: false,
  });

  const applyMutation = useMutation({
    mutationFn: async ({ opportunityId, data }: { opportunityId: string; data: z.infer<typeof applicationFormSchema> }) => {
      return await apiRequest("POST", `/api/volunteer-opportunities/${opportunityId}/apply`, data);
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted",
        description: "Your volunteer application has been submitted successfully!",
      });
      setIsApplicationModalOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/volunteer-opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/volunteer-applications"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Application Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleApplyClick = (opportunityId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to apply for volunteer opportunities.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 1000);
      return;
    }

    // Check if user is verified
    if ((user as any)?.kycStatus !== "verified") {
      toast({
        title: "Verification Required",
        description: "Only verified users can volunteer. Please complete your KYC verification first.",
        variant: "destructive",
      });
      return;
    }
    
    const opportunity = opportunities?.find((op: VolunteerOpportunity) => op.id === opportunityId);
    if (opportunity) {
      setSelectedOpportunity(opportunity);
      setIsApplicationModalOpen(true);
    }
  };

  const onSubmit = (data: z.infer<typeof applicationFormSchema>) => {
    
    // Explicit validation for Telegram fields
    if (!data.telegramDisplayName?.trim()) {
      form.setError("telegramDisplayName", { 
        message: "Telegram Display Name is required for volunteer coordination" 
      });
      toast({
        title: "Missing Telegram Information",
        description: "Please provide your Telegram Display Name for coordination.",
        variant: "destructive",
      });
      return;
    }
    
    if (!data.telegramUsername?.trim()) {
      form.setError("telegramUsername", { 
        message: "Telegram Username is required for secure communication" 
      });
      toast({
        title: "Missing Telegram Information", 
        description: "Please provide your Telegram Username for secure communication.",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedOpportunity) {
      applyMutation.mutate({
        opportunityId: selectedOpportunity.id,
        data,
      });
    }
  };

  const filteredOpportunities = opportunities?.filter((opportunity: VolunteerOpportunity) =>
    opportunity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opportunity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opportunity.location.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

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
            Make a hands-on difference by volunteering for causes that matter to you
          </p>
        </div>

        {/* Hero Section */}
        <Card className="mb-8 bg-gradient-to-r from-primary/10 to-secondary/10 border-none">
          <CardContent className="p-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl font-bold mb-4">Why Volunteer with VeriFund?</h2>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-secondary mr-2" />
                    Direct impact on verified causes
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-secondary mr-2" />
                    Transparent tracking of your contributions
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-secondary mr-2" />
                    Community of like-minded volunteers
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-secondary mr-2" />
                    Flexible commitment options
                  </li>
                </ul>
              </div>
              <div className="text-center">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary" data-testid="stat-volunteer-opportunities">
                      {opportunities?.length || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Active Opportunities</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-secondary" data-testid="stat-volunteer-hours">
                      {opportunities?.reduce((total, opp) => total + ((opp as any).duration || 0) * (opp.slotsFilled || 0), 0) || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Volunteer Hours</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Filters */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Filter className="w-5 h-5" />
                  <span>Filters</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search opportunities..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-volunteer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger data-testid="select-volunteer-status">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedStatus("all");
                  }}
                  className="w-full"
                  data-testid="button-clear-volunteer-filters"
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>

            {/* My Applications */}
            {isAuthenticated && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>My Applications</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {Array.isArray(userApplications) && userApplications.length > 0 ? (
                    <div className="space-y-3">
                      {userApplications.slice(0, 3).map((application: any) => (
                        <div key={application.id} className="p-3 border rounded-lg" data-testid={`application-${application.id}`}>
                          <div className="text-sm font-medium mb-1">Application #{application.id.slice(0, 8)}</div>
                          <Badge 
                            variant={application.status === "approved" ? "default" : 
                                   application.status === "rejected" ? "destructive" : "secondary"}
                            className="text-xs"
                          >
                            {application.status}
                          </Badge>
                        </div>
                      ))}
                      {Array.isArray(userApplications) && userApplications.length > 3 && (
                        <div className="text-center">
                          <Button variant="ghost" size="sm" className="w-full">
                            View All Applications
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">No applications yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Results Summary */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-muted-foreground" data-testid="text-volunteer-results-count">
                {opportunitiesLoading ? "Loading..." : `${filteredOpportunities.length} opportunities found`}
              </p>
            </div>

            {/* Opportunities Grid */}
            {opportunitiesLoading ? (
              <div className="grid md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm border animate-pulse">
                    <div className="p-6">
                      <div className="h-4 bg-gray-200 rounded mb-4"></div>
                      <div className="h-6 bg-gray-200 rounded mb-3"></div>
                      <div className="h-3 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-4"></div>
                      <div className="h-8 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredOpportunities.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {filteredOpportunities.map((opportunity: VolunteerOpportunity) => (
                  <VolunteerCard 
                    key={opportunity.id} 
                    opportunity={opportunity}
                    onApply={handleApplyClick}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No opportunities found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search criteria or check back later for new opportunities
                </p>
                <Button 
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedStatus("all");
                  }}
                  data-testid="button-reset-volunteer-search"
                >
                  Show All Opportunities
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Application Modal */}
        <Dialog open={isApplicationModalOpen} onOpenChange={setIsApplicationModalOpen}>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Apply to Volunteer</DialogTitle>
            </DialogHeader>
            {selectedOpportunity && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">{selectedOpportunity.title}</h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      {selectedOpportunity.location}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(selectedOpportunity.startDate).toLocaleDateString()} - {new Date(selectedOpportunity.endDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="intent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Why do you want to volunteer for this initiative? *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Please explain your motivation and why you want to be part of this initiative (minimum 20 characters)..."
                              rows={4}
                              {...field}
                              data-testid="textarea-volunteer-intent"
                            />
                          </FormControl>
                          <p className="text-sm text-muted-foreground">
                            This helps creators understand your motivation and commitment.
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Telegram Display Name Field */}
                    <div className="space-y-2">
                      <label className="text-red-600 font-semibold text-sm">
                        Telegram Display Name *
                      </label>
                      <Input
                        placeholder="Your display name as it appears on Telegram"
                        value={form.watch("telegramDisplayName") || ""}
                        onChange={(e) => form.setValue("telegramDisplayName", e.target.value)}
                        className="border-red-200 focus:border-red-400"
                        data-testid="input-telegram-display-name"
                      />
                      <p className="text-sm text-muted-foreground">
                        This will only be visible to the creator after approval for coordination purposes.
                      </p>
                      {form.formState.errors.telegramDisplayName && (
                        <p className="text-red-500 text-sm">{form.formState.errors.telegramDisplayName.message}</p>
                      )}
                    </div>

                    {/* Telegram Username Field */}
                    <div className="space-y-2">
                      <label className="text-red-600 font-semibold text-sm">
                        Telegram Username *
                      </label>
                      <Input
                        placeholder="@username or username (without @)"
                        value={form.watch("telegramUsername") || ""}
                        onChange={(e) => form.setValue("telegramUsername", e.target.value)}
                        className="border-red-200 focus:border-red-400"
                        data-testid="input-telegram-username"
                      />
                      <p className="text-sm text-muted-foreground">
                        Your Telegram username for direct communication after approval.
                      </p>
                      {form.formState.errors.telegramUsername && (
                        <p className="text-red-500 text-sm">{form.formState.errors.telegramUsername.message}</p>
                      )}
                    </div>


                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Privacy Notice:</strong> Your Telegram information will only be visible to the campaign creator after they approve your volunteer application. This ensures no unwanted contact before approval and enables proper coordination once accepted.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="flex space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsApplicationModalOpen(false)}
                        className="flex-1"
                        data-testid="button-cancel-volunteer-application"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        className="flex-1"
                        disabled={applyMutation.isPending}
                        data-testid="button-submit-volunteer-application"
                      >
                        {applyMutation.isPending ? "Submitting..." : "Submit Application"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
