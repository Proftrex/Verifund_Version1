import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navigation from "@/components/navigation";
import CampaignCard from "@/components/campaign-card";
import { useAuth } from "@/hooks/useAuth";
import { Search, TrendingUp, Heart, Award, Users, Filter } from "lucide-react";
import type { Campaign } from "@shared/schema";

const categoryLabels = {
  emergency: "Emergency Relief",
  education: "Education",
  healthcare: "Healthcare", 
  community: "Community Development",
  environment: "Environment"
};

export default function BrowseCampaigns() {
  const { isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [activeTab, setActiveTab] = useState("featured");

  // Fetch high-credibility campaigns (featured)
  const { data: featuredCampaigns, isLoading: featuredLoading } = useQuery({
    queryKey: ["/api/campaigns/featured"],
    enabled: isAuthenticated,
  }) as { data: Campaign[] | undefined; isLoading: boolean };

  // Fetch personalized recommendations
  const { data: recommendedCampaigns, isLoading: recommendedLoading } = useQuery({
    queryKey: ["/api/campaigns/recommended"],
    enabled: isAuthenticated,
  }) as { data: Campaign[] | undefined; isLoading: boolean };

  // Fetch all campaigns for search/filter
  const { data: allCampaigns, isLoading: allLoading } = useQuery({
    queryKey: ["/api/campaigns"],
    enabled: isAuthenticated,
  }) as { data: Campaign[] | undefined; isLoading: boolean };

  const filteredCampaigns = (allCampaigns || []).filter((campaign: Campaign) => {
    const matchesSearch = !searchTerm || 
      campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || campaign.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Sign in to Browse Campaigns</h1>
            <p className="text-muted-foreground mb-4">Discover campaigns tailored to your interests</p>
            <Button onClick={() => window.location.href = "/api/login"}>
              Sign In
            </Button>
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
          <h1 className="text-3xl font-bold mb-2" data-testid="page-title">Browse Campaigns</h1>
          <p className="text-muted-foreground">
            Discover campaigns from trusted creators and find causes that match your interests
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger data-testid="select-category">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("");
                }}
                data-testid="button-clear-filters"
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="featured" data-testid="tab-featured">
              <Award className="w-4 h-4 mr-2" />
              Featured Campaigns
            </TabsTrigger>
            <TabsTrigger value="recommended" data-testid="tab-recommended">
              <Heart className="w-4 h-4 mr-2" />
              For You
            </TabsTrigger>
            <TabsTrigger value="browse" data-testid="tab-browse">
              <TrendingUp className="w-4 h-4 mr-2" />
              Browse All
            </TabsTrigger>
          </TabsList>

          {/* Featured Campaigns Tab */}
          <TabsContent value="featured" className="space-y-6">
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-800">
                  <Award className="w-5 h-5 mr-2" />
                  High-Credibility Campaigns
                </CardTitle>
                <p className="text-blue-600 text-sm">
                  Campaigns from creators with proven track records and high success rates
                </p>
              </CardHeader>
              <CardContent>
                {featuredLoading ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    ))}
                  </div>
                ) : (featuredCampaigns && featuredCampaigns.length > 0) ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {featuredCampaigns.map((campaign: Campaign) => (
                      <div key={campaign.id} className="relative">
                        <Badge className="absolute top-2 left-2 z-10 bg-blue-600 text-white border-blue-700">
                          <Award className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                        <CampaignCard campaign={campaign} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Award className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">No Featured Campaigns Yet</h3>
                    <p className="text-blue-600">Check back soon for campaigns from our top creators!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recommended Campaigns Tab */}
          <TabsContent value="recommended" className="space-y-6">
            <Card className="bg-gradient-to-r from-green-50 to-teal-50 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center text-green-800">
                  <Heart className="w-5 h-5 mr-2" />
                  Recommended for You
                </CardTitle>
                <p className="text-green-600 text-sm">
                  Campaigns matching your interests based on your contribution history
                </p>
              </CardHeader>
              <CardContent>
                {recommendedLoading ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    ))}
                  </div>
                ) : (recommendedCampaigns && recommendedCampaigns.length > 0) ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recommendedCampaigns.map((campaign: Campaign) => (
                      <div key={campaign.id} className="relative">
                        <Badge className="absolute top-2 left-2 z-10 bg-green-600 text-white border-green-700">
                          <Heart className="w-3 h-3 mr-1" />
                          For You
                        </Badge>
                        <CampaignCard campaign={campaign} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Heart className="w-12 h-12 text-green-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-green-800 mb-2">No Recommendations Yet</h3>
                    <p className="text-green-600 mb-4">
                      Start contributing to campaigns to receive personalized recommendations!
                    </p>
                    <Button 
                      onClick={() => setActiveTab("browse")}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Browse All Campaigns
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Browse All Tab */}
          <TabsContent value="browse" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-semibold">All Campaigns</h2>
                <Badge variant="secondary" data-testid="campaigns-count">
                  {filteredCampaigns.length} {filteredCampaigns.length === 1 ? 'campaign' : 'campaigns'}
                </Badge>
              </div>
            </div>

            {allLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : filteredCampaigns.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCampaigns.map((campaign: Campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No campaigns found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search terms or filters
                </p>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}