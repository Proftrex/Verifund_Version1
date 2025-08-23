import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import CampaignCard from "@/components/campaign-card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, Play, Clock, CheckCircle2, XCircle } from "lucide-react";

export default function Campaigns() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedStartMonth, setSelectedStartMonth] = useState("all");
  
  // Applied filters (for Apply Filter button functionality)
  const [appliedCategory, setAppliedCategory] = useState("all");
  const [appliedLocation, setAppliedLocation] = useState("all");
  const [appliedStartMonth, setAppliedStartMonth] = useState("all");

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["/api/user/campaigns", appliedCategory, appliedLocation, appliedStartMonth],
    queryFn: () => {
      const params = new URLSearchParams();
      if (appliedCategory && appliedCategory !== "all") params.append("category", appliedCategory);
      return fetch(`/api/user/campaigns?${params.toString()}`).then(res => res.json());
    },
  });

  const filteredCampaigns = campaigns?.filter((campaign: any) => {
    // Search term filter
    const matchesSearch = campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Location filter (client-side) - improved matching logic
    const matchesLocation = appliedLocation === "all" || 
                           (campaign.location && 
                            (campaign.location.toLowerCase().includes(appliedLocation.toLowerCase()) ||
                             appliedLocation.toLowerCase().includes(campaign.location.toLowerCase()) ||
                             // Handle common variations
                             (appliedLocation === "central luzon" && campaign.location.toLowerCase().includes("central")) ||
                             (appliedLocation === "ncr" && (campaign.location.toLowerCase().includes("manila") || campaign.location.toLowerCase().includes("ncr"))) ||
                             (appliedLocation === "calabarzon" && campaign.location.toLowerCase().includes("calabarzon")) ||
                             (appliedLocation === "western visayas" && campaign.location.toLowerCase().includes("western")) ||
                             (appliedLocation === "central visayas" && campaign.location.toLowerCase().includes("central")) ||
                             (appliedLocation === "eastern visayas" && campaign.location.toLowerCase().includes("eastern"))));
    
    // Start month filter (client-side)
    const matchesStartMonth = appliedStartMonth === "all" || 
                             (campaign.createdAt && 
                              new Date(campaign.createdAt).getMonth() === parseInt(appliedStartMonth));
    
    // Debug logging
    if (appliedLocation !== "all" && campaign.location) {
      console.log("Filter Debug:", {
        appliedLocation,
        campaignLocation: campaign.location,
        matchesLocation,
        campaignTitle: campaign.title
      });
    }
    
    return matchesSearch && matchesLocation && matchesStartMonth;
  }) || [];

  // Apply Filters handler
  const handleApplyFilters = () => {
    setAppliedCategory(selectedCategory);
    setAppliedLocation(selectedLocation);
    setAppliedStartMonth(selectedStartMonth);
  };

  // Clear Filters handler
  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedLocation("all");
    setSelectedStartMonth("all");
    setAppliedCategory("all");
    setAppliedLocation("all");
    setAppliedStartMonth("all");
  };

  // Group campaigns by status
  const activeCampaigns = filteredCampaigns.filter((campaign: any) => campaign.status === 'active');
  const onProgressCampaigns = filteredCampaigns.filter((campaign: any) => campaign.status === 'on_progress');
  const closedCampaigns = filteredCampaigns.filter((campaign: any) => 
    campaign.status === 'completed' || campaign.status === 'cancelled'
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="text-campaigns-title">
            My Campaigns
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage and track your created campaigns
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          {/* First Row: Search */}
          <div className="mb-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-campaigns"
              />
            </div>
          </div>

          {/* Second Row: All Other Filters */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger data-testid="select-category">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="emergency">Emergency Relief</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="community">Community Development</SelectItem>
                <SelectItem value="environment">Environment</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger data-testid="select-location">
                <SelectValue placeholder="Province/Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Provinces/Regions</SelectItem>
                <SelectItem value="ncr">National Capital Region (NCR)</SelectItem>
                <SelectItem value="calabarzon">CALABARZON (Region IV-A)</SelectItem>
                <SelectItem value="central luzon">Central Luzon (Region III)</SelectItem>
                <SelectItem value="ilocos">Ilocos Region (Region I)</SelectItem>
                <SelectItem value="cagayan valley">Cagayan Valley (Region II)</SelectItem>
                <SelectItem value="bicol">Bicol Region (Region V)</SelectItem>
                <SelectItem value="western visayas">Western Visayas (Region VI)</SelectItem>
                <SelectItem value="central visayas">Central Visayas (Region VII)</SelectItem>
                <SelectItem value="eastern visayas">Eastern Visayas (Region VIII)</SelectItem>
                <SelectItem value="zamboanga peninsula">Zamboanga Peninsula (Region IX)</SelectItem>
                <SelectItem value="northern mindanao">Northern Mindanao (Region X)</SelectItem>
                <SelectItem value="davao">Davao Region (Region XI)</SelectItem>
                <SelectItem value="soccsksargen">SOCCSKSARGEN (Region XII)</SelectItem>
                <SelectItem value="caraga">Caraga (Region XIII)</SelectItem>
                <SelectItem value="car">Cordillera Administrative Region (CAR)</SelectItem>
                <SelectItem value="armm">ARMM</SelectItem>
                <SelectItem value="mimaropa">MIMAROPA (Region IV-B)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStartMonth} onValueChange={setSelectedStartMonth}>
              <SelectTrigger data-testid="select-start-month">
                <SelectValue placeholder="Start Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                <SelectItem value="0">January</SelectItem>
                <SelectItem value="1">February</SelectItem>
                <SelectItem value="2">March</SelectItem>
                <SelectItem value="3">April</SelectItem>
                <SelectItem value="4">May</SelectItem>
                <SelectItem value="5">June</SelectItem>
                <SelectItem value="6">July</SelectItem>
                <SelectItem value="7">August</SelectItem>
                <SelectItem value="8">September</SelectItem>
                <SelectItem value="9">October</SelectItem>
                <SelectItem value="10">November</SelectItem>
                <SelectItem value="11">December</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              onClick={handleApplyFilters}
              data-testid="button-apply-filters"
            >
              <Filter className="w-4 h-4 mr-2" />
              Apply Filter
            </Button>

            <Button 
              variant="outline" 
              onClick={handleClearFilters}
              data-testid="button-clear-filters"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="space-y-8">
            {/* Loading for each section */}
            {[1, 2, 3].map((section) => (
              <div key={section} className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg shadow-sm border animate-pulse">
                      <div className="h-48 bg-gray-200"></div>
                      <div className="p-6">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-6 bg-gray-200 rounded mb-3"></div>
                        <div className="h-3 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded mb-4"></div>
                        <div className="h-2 bg-gray-200 rounded mb-4"></div>
                        <div className="h-8 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active" className="flex items-center space-x-2" data-testid="tab-active-campaigns">
                <Play className="w-4 h-4" />
                <span>Active</span>
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                  {activeCampaigns.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="progress" className="flex items-center space-x-2" data-testid="tab-progress-campaigns">
                <Clock className="w-4 h-4" />
                <span>On Progress</span>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                  {onProgressCampaigns.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="closed" className="flex items-center space-x-2" data-testid="tab-closed-campaigns">
                <CheckCircle2 className="w-4 h-4" />
                <span>Closed</span>
                <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded-full">
                  {closedCampaigns.length}
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-6">
              {activeCampaigns.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeCampaigns.map((campaign: any) => (
                    <CampaignCard key={campaign.id} campaign={campaign} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <Play className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Campaigns</h3>
                  <p className="text-gray-500">You don't have any active campaigns yet.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="progress" className="mt-6">
              {onProgressCampaigns.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {onProgressCampaigns.map((campaign: any) => (
                    <CampaignCard key={campaign.id} campaign={campaign} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Campaigns In Progress</h3>
                  <p className="text-gray-500">You don't have any campaigns currently in progress.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="closed" className="mt-6">
              {closedCampaigns.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {closedCampaigns.map((campaign: any) => (
                    <CampaignCard key={campaign.id} campaign={campaign} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <CheckCircle2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Closed Campaigns</h3>
                  <p className="text-gray-500">You haven't completed or ended any campaigns yet.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* No campaigns at all state */}
        {!isLoading && filteredCampaigns.length === 0 && (
          <div className="text-center py-16 mt-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No campaigns found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search criteria or create your first campaign
            </p>
            <Button 
              onClick={handleClearFilters}
              data-testid="button-reset-search"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
