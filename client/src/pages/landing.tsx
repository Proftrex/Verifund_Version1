import Navigation from "@/components/navigation";
import Hero from "@/components/hero";
import CampaignCard from "@/components/campaign-card";
import VolunteerCard from "@/components/volunteer-card";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Heart, DollarSign, Users, TrendingUp, Star, MessageSquare } from "lucide-react";
import { Link } from "wouter";
import { useState, useRef } from "react";

export default function Landing() {
  const [campaignCurrentSlide, setCampaignCurrentSlide] = useState(0);
  const [volunteerCurrentSlide, setVolunteerCurrentSlide] = useState(0);
  const [storiesCurrentSlide, setStoriesCurrentSlide] = useState(0);
  
  const campaignScrollRef = useRef<HTMLDivElement>(null);
  const volunteerScrollRef = useRef<HTMLDivElement>(null);
  const storiesScrollRef = useRef<HTMLDivElement>(null);

  const { data: campaigns } = useQuery({
    queryKey: ["/api/campaigns"],
    queryFn: () => fetch("/api/campaigns?status=active&limit=10").then(res => res.json()),
  });

  const { data: opportunities } = useQuery({
    queryKey: ["/api/volunteer-opportunities"],
    queryFn: () => fetch("/api/volunteer-opportunities?status=active&limit=10").then(res => res.json()),
  });

  // Mock metrics data - in a real app, this would come from an API
  const metrics = {
    totalContributions: "₱2.4M",
    totalTips: "₱850K",
    totalCampaigns: "1,250",
    totalCreators: "3,100",
    totalVolunteers: "5,400"
  };

  // Mock featured stories data
  const featuredStories = [
    {
      id: 1,
      title: "Medical Campaign Reaches Goal in Record Time",
      excerpt: "A critical medical fundraiser for Baby Ana reached its ₱500,000 goal within 48 hours thanks to community support.",
      date: "Dec 15, 2024",
      image: "/api/placeholder/300/200"
    },
    {
      id: 2,
      title: "Volunteer Heroes Rebuild Damaged School",
      excerpt: "Over 100 volunteers came together to rebuild Barangay Elementary School after typhoon damage.",
      date: "Dec 12, 2024",
      image: "/api/placeholder/300/200"
    },
    {
      id: 3,
      title: "New Transparency Features Launch",
      excerpt: "Enhanced blockchain tracking now provides real-time fund utilization updates for all campaign contributors.",
      date: "Dec 10, 2024",
      image: "/api/placeholder/300/200"
    },
    {
      id: 4,
      title: "Community Kitchen Feeds 1000 Families",
      excerpt: "Monthly feeding program in Tondo successfully provides nutritious meals to families in need.",
      date: "Dec 8, 2024",
      image: "/api/placeholder/300/200"
    }
  ];

  const scrollCarousel = (direction: 'left' | 'right', ref: any, currentSlide: number, setCurrentSlide: any, maxSlides: number) => {
    const container = ref.current;
    if (!container) return;

    const slideWidth = container.children[0]?.clientWidth || 0;
    const newSlide = direction === 'left' 
      ? Math.max(0, currentSlide - 1)
      : Math.min(maxSlides - 1, currentSlide + 1);
    
    container.scrollTo({
      left: newSlide * slideWidth,
      behavior: 'smooth'
    });
    setCurrentSlide(newSlide);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <Hero />
      
      {/* Platform Metrics */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold mb-2">{metrics.totalContributions}</h3>
              <p className="text-sm text-muted-foreground">Total Contributions</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Heart className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold mb-2">{metrics.totalTips}</h3>
              <p className="text-sm text-muted-foreground">Total Tips</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold mb-2">{metrics.totalCampaigns}</h3>
              <p className="text-sm text-muted-foreground">Total Campaigns</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <Star className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold mb-2">{metrics.totalCreators}</h3>
              <p className="text-sm text-muted-foreground">Total Creators</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-bold mb-2">{metrics.totalVolunteers}</h3>
              <p className="text-sm text-muted-foreground">Total Volunteers</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Campaigns */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Featured Campaigns</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Support verified causes and track your impact with complete transparency
            </p>
          </div>
          
          <div className="relative">
            <div 
              ref={campaignScrollRef}
              className="flex overflow-x-hidden scroll-smooth gap-6"
            >
              {campaigns && campaigns.length > 0 ? (
                campaigns.map((campaign: any) => (
                  <div key={campaign.id} className="flex-none w-80">
                    <CampaignCard campaign={campaign} />
                  </div>
                ))
              ) : (
                <div className="w-full text-center py-12">
                  <p className="text-muted-foreground">No active campaigns at the moment</p>
                </div>
              )}
            </div>
            
            {campaigns && campaigns.length > 3 && (
              <>
                <button
                  onClick={() => scrollCarousel('left', campaignScrollRef, campaignCurrentSlide, setCampaignCurrentSlide, campaigns.length)}
                  className="absolute left-0 top-1/2 -translate-y-1/2 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => scrollCarousel('right', campaignScrollRef, campaignCurrentSlide, setCampaignCurrentSlide, campaigns.length)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
          
          <div className="text-center mt-12">
            <button 
              onClick={() => window.location.href = "/api/login"}
              className="border border-primary text-primary px-8 py-3 rounded-lg font-semibold hover:bg-primary hover:text-white transition-colors"
            >
              Browse More Campaigns
            </button>
          </div>
        </div>
      </section>

      {/* Volunteer Opportunities */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Volunteer Opportunities</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Make hands-on difference by volunteering for causes that matter to you
            </p>
          </div>
          
          <div className="relative">
            <div 
              ref={volunteerScrollRef}
              className="flex overflow-x-hidden scroll-smooth gap-6"
            >
              {opportunities && opportunities.length > 0 ? (
                opportunities.map((opportunity: any) => (
                  <div key={opportunity.id} className="flex-none w-80">
                    <VolunteerCard 
                      opportunity={opportunity}
                      onApply={() => window.location.href = "/api/login"}
                    />
                  </div>
                ))
              ) : (
                <div className="w-full text-center py-12">
                  <p className="text-muted-foreground">No volunteer opportunities available</p>
                </div>
              )}
            </div>
            
            {opportunities && opportunities.length > 3 && (
              <>
                <button
                  onClick={() => scrollCarousel('left', volunteerScrollRef, volunteerCurrentSlide, setVolunteerCurrentSlide, opportunities.length)}
                  className="absolute left-0 top-1/2 -translate-y-1/2 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => scrollCarousel('right', volunteerScrollRef, volunteerCurrentSlide, setVolunteerCurrentSlide, opportunities.length)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
          
          <div className="text-center mt-12">
            <button 
              onClick={() => window.location.href = "/api/login"}
              className="border border-primary text-primary px-8 py-3 rounded-lg font-semibold hover:bg-primary hover:text-white transition-colors"
            >
              Browse More Volunteer Opportunities
            </button>
          </div>
        </div>
      </section>

      {/* Featured Stories */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Featured Stories</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Stay updated with the latest news, success stories, and platform updates
            </p>
          </div>
          
          <div className="relative">
            <div 
              ref={storiesScrollRef}
              className="flex overflow-x-hidden scroll-smooth gap-6"
            >
              {featuredStories.map((story) => (
                <div key={story.id} className="flex-none w-80">
                  <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <img 
                      src={story.image} 
                      alt={story.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-6">
                      <div className="text-sm text-muted-foreground mb-2">{story.date}</div>
                      <h3 className="text-xl font-semibold mb-3">{story.title}</h3>
                      <p className="text-muted-foreground mb-4">{story.excerpt}</p>
                      <button 
                        onClick={() => window.location.href = "/api/login"}
                        className="text-primary font-semibold hover:underline"
                      >
                        Read More →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {featuredStories.length > 3 && (
              <>
                <button
                  onClick={() => scrollCarousel('left', storiesScrollRef, storiesCurrentSlide, setStoriesCurrentSlide, featuredStories.length)}
                  className="absolute left-0 top-1/2 -translate-y-1/2 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => scrollCarousel('right', storiesScrollRef, storiesCurrentSlide, setStoriesCurrentSlide, featuredStories.length)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
          
          <div className="text-center mt-12">
            <button 
              onClick={() => window.location.href = "/api/login"}
              className="border border-primary text-primary px-8 py-3 rounded-lg font-semibold hover:bg-primary hover:text-white transition-colors"
            >
              Read More
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">VERIFUND: Every Story Matters</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 mb-12">
            <div>
              <h3 className="text-xl font-semibold mb-6">What you can do:</h3>
              <ul className="space-y-3 text-gray-300">
                <li>Launch and manage campaigns</li>
                <li>Contribute to community initiatives</li>
                <li>Tip and support your favorite creators</li>
                <li>Volunteer for meaningful campaigns</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-6">Support:</h3>
              <p className="text-gray-300 mb-6">support@verifund.org</p>
              
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
                  <MessageSquare className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-blue-800 rounded-full flex items-center justify-center hover:bg-blue-900 transition-colors">
                  <Users className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors">
                  <MessageSquare className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors">
                  <Users className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-black rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors">
                  <MessageSquare className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>copyright 2024 | Philippines</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
