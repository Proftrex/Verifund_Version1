import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  Users, 
  Star,
  UserCheck
} from "lucide-react";

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
            Volunteers
          </h1>
          <p className="text-lg text-muted-foreground">
            View volunteer ratings across the platform
          </p>
        </div>

        {/* Volunteer Ratings */}
        <VolunteerRatingsView />
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

