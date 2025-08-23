import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  Users, 
  Star,
  Flag,
  UserCheck,
  AlertTriangle
} from "lucide-react";

export default function Volunteer() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [activeTab, setActiveTab] = useState("ratings");

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
            Volunteers
          </h1>
          <p className="text-lg text-muted-foreground">
            View volunteer ratings and manage volunteer reports
          </p>
        </div>

        {/* Volunteer Management Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ratings" data-testid="tab-ratings">
              <Star className="w-4 h-4 mr-2" />
              Volunteer Ratings
            </TabsTrigger>
            <TabsTrigger value="reported" data-testid="tab-reported">
              <Flag className="w-4 h-4 mr-2" />
              Reported Volunteers
            </TabsTrigger>
          </TabsList>

          {/* Volunteer Ratings Tab */}
          <TabsContent value="ratings" className="space-y-6">
            <VolunteerRatingsView />
          </TabsContent>

          {/* Reported Volunteers Tab */}
          <TabsContent value="reported" className="space-y-6">
            <ReportedVolunteersView />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Volunteer Ratings View Component
function VolunteerRatingsView() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all volunteer ratings (for admins/support) or user's ratings
  const { data: volunteerRatings, isLoading } = useQuery({
    queryKey: ["/api/volunteer-ratings"],
    queryFn: () => fetch("/api/volunteer-ratings").then(res => res.json()),
  });

  const filteredRatings = volunteerRatings?.filter((rating: any) =>
    rating.volunteer?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rating.volunteer?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rating.campaign?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading volunteer ratings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserCheck className="w-5 h-5 mr-2" />
            All Volunteer Ratings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by volunteer name or campaign..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-ratings"
              />
            </div>
          </div>

          {/* Ratings List */}
          {filteredRatings.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No volunteer ratings found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRatings.map((rating: any) => (
                <Card key={rating.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarImage src={rating.volunteer?.profileImageUrl} />
                          <AvatarFallback>
                            {rating.volunteer?.firstName?.[0]}{rating.volunteer?.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold" data-testid={`text-volunteer-name-${rating.id}`}>
                            {rating.volunteer?.firstName} {rating.volunteer?.lastName}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Campaign: {rating.campaign?.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Rated by: {rating.rater?.firstName} {rating.rater?.lastName}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= rating.rating
                                  ? "text-yellow-400 fill-current"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                          <span className="ml-2 font-semibold" data-testid={`text-rating-${rating.id}`}>
                            {rating.rating}/5
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(rating.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {rating.feedback && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm" data-testid={`text-feedback-${rating.id}`}>
                          "{rating.feedback}"
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Reported Volunteers View Component
function ReportedVolunteersView() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  // Check if user is admin/support
  const isAdmin = (user as any)?.isAdmin || (user as any)?.isSupport;

  // Fetch reported volunteers (admin only)
  const { data: reportedVolunteers, isLoading } = useQuery({
    queryKey: ["/api/reported-volunteers"],
    queryFn: () => fetch("/api/reported-volunteers").then(res => res.json()),
    enabled: isAdmin,
  });

  const filteredReports = reportedVolunteers?.filter((report: any) =>
    report.volunteer?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.volunteer?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.reason?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Access restricted to administrators</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading reported volunteers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Flag className="w-5 h-5 mr-2" />
            Reported Volunteers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by volunteer name or report reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-reports"
              />
            </div>
          </div>

          {/* Reports List */}
          {filteredReports.length === 0 ? (
            <div className="text-center py-8">
              <Flag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No reported volunteers found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReports.map((report: any) => (
                <Card key={report.id} className="hover:shadow-md transition-shadow border-orange-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarImage src={report.volunteer?.profileImageUrl} />
                          <AvatarFallback>
                            {report.volunteer?.firstName?.[0]}{report.volunteer?.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold" data-testid={`text-reported-volunteer-${report.id}`}>
                            {report.volunteer?.firstName} {report.volunteer?.lastName}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Reported by: {report.reporter?.firstName} {report.reporter?.lastName}
                          </p>
                          <Badge variant="destructive" className="mt-1">
                            {report.reason}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="mb-2">
                          {report.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {report.description && (
                      <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-sm" data-testid={`text-report-description-${report.id}`}>
                          {report.description}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}