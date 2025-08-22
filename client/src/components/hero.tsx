import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";

export default function Hero() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="relative bg-gradient-to-br from-primary to-blue-800 text-white">
      <div className="absolute inset-0 bg-black opacity-20"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Transparent Fundraising.<br />
              <span className="text-accent">Every Fund Story Matters.</span>
            </h1>
            <p className="text-xl mb-8 text-blue-100">
              Community-driven crowdfunding platform powered by blockchain technology. 
              Track every peso, verify every impact, trust every transaction.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              {isAuthenticated ? (
                <Link href="/create-campaign">
                  <Button 
                    className="bg-accent text-black hover:bg-yellow-500 font-semibold px-8 py-3"
                    data-testid="button-start-campaign"
                  >
                    Start Your Campaign
                  </Button>
                </Link>
              ) : (
                <Button 
                  className="bg-accent text-black hover:bg-yellow-500 font-semibold px-8 py-3"
                  onClick={() => window.location.href = "/api/login"}
                  data-testid="button-start-campaign"
                >
                  Start Your Campaign
                </Button>
              )}
              <Link href="/campaigns">
                <Button 
                  variant="outline" 
                  className="border-2 border-white text-white hover:bg-white hover:text-primary font-semibold px-8 py-3"
                  data-testid="button-explore-campaigns"
                >
                  Explore Campaigns
                </Button>
              </Link>
            </div>
            
            {/* Platform Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold" data-testid="stat-downloads">9M+</div>
                <div className="text-sm text-blue-200">App Downloads</div>
              </div>
              <div>
                <div className="text-2xl font-bold" data-testid="stat-users">1.3M+</div>
                <div className="text-sm text-blue-200">Active Users</div>
              </div>
              <div>
                <div className="text-2xl font-bold" data-testid="stat-rating">4.8</div>
                <div className="text-sm text-blue-200">Rating</div>
              </div>
              <div>
                <div className="text-2xl font-bold" data-testid="stat-pools">5,000+</div>
                <div className="text-sm text-blue-200">Active Pools</div>
              </div>
            </div>
          </div>
          
          <div className="hidden lg:block">
            {/* Mobile app mockup showcasing transparency features */}
            <div className="relative mx-auto w-80 h-96 bg-white rounded-3xl shadow-2xl p-6">
              <div className="bg-gray-100 rounded-2xl h-full p-4">
                <div className="text-center mb-4">
                  <h3 className="font-semibold text-gray-800">Transparent Tracking</h3>
                </div>
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Medical Fund</span>
                      <span className="text-sm text-secondary">₱85,000</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-secondary h-2 rounded-full" style={{ width: "68%" }}></div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">68% of ₱125,000 goal</div>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-xs font-medium text-gray-600 mb-2">Recent Transaction</div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-primary rounded-sm"></div>
                      <span className="text-xs text-gray-700">Blockchain Verified</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
