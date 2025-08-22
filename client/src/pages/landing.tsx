import Navigation from "@/components/navigation";
import Hero from "@/components/hero";
import FeeCalculator from "@/components/fee-calculator";
import TransactionFeed from "@/components/transaction-feed";
import CampaignCard from "@/components/campaign-card";
import VolunteerCard from "@/components/volunteer-card";
import { useQuery } from "@tanstack/react-query";
import { Shield, Eye, Users, TrendingUp } from "lucide-react";
import { Link } from "wouter";

export default function Landing() {
  const { data: campaigns } = useQuery({
    queryKey: ["/api/campaigns"],
    queryFn: () => fetch("/api/campaigns?status=active&limit=3").then(res => res.json()),
  });

  const { data: opportunities } = useQuery({
    queryKey: ["/api/volunteer-opportunities"],
    queryFn: () => fetch("/api/volunteer-opportunities?status=active&limit=3").then(res => res.json()),
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <Hero />
      
      {/* Trust Indicators */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Blockchain Secured</h3>
              <p className="text-sm text-muted-foreground">Every transaction immutably recorded on blockchain</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                <Eye className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="font-semibold mb-2">Full Transparency</h3>
              <p className="text-sm text-muted-foreground">Track every peso from donation to impact</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-accent" />
              </div>
              <h3 className="font-semibold mb-2">Community Verified</h3>
              <p className="text-sm text-muted-foreground">Transparent evaluation by community members</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Impact Tracking</h3>
              <p className="text-sm text-muted-foreground">Real-time updates on fund utilization</p>
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
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {campaigns && campaigns.length > 0 ? (
              campaigns.map((campaign: any) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No active campaigns at the moment</p>
              </div>
            )}
          </div>
          
          <div className="text-center mt-12">
            <Link href="/campaigns">
              <button className="border border-primary text-primary px-8 py-3 rounded-lg font-semibold hover:bg-primary hover:text-white transition-colors">
                View All Campaigns
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Transparency Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Transparency at Every Step</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Our blockchain-powered system ensures complete visibility of fund flow and impact tracking
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Transparent Evaluation System (TES)</h3>
                    <p className="text-muted-foreground">
                      Our dedicated team of professionals conducts thorough assessments of each proposal using clear criteria and open communication.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Blockchain Verification</h3>
                    <p className="text-muted-foreground">
                      Every transaction is immutably recorded on the blockchain, providing a verifiable and auditable trail of all funds.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Impact Tracking</h3>
                    <p className="text-muted-foreground">
                      Donors receive regular updates on how their contributions are being utilized, fostering connection and demonstrable impact.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-2xl p-8">
              <TransactionFeed />
            </div>
          </div>
        </div>
      </section>

      <FeeCalculator />

      {/* Volunteer Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Volunteer Opportunities</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Make hands-on difference by volunteering for causes that matter to you
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {opportunities && opportunities.length > 0 ? (
              opportunities.map((opportunity: any) => (
                <VolunteerCard 
                  key={opportunity.id} 
                  opportunity={opportunity}
                  onApply={() => window.location.href = "/api/login"}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No volunteer opportunities available</p>
              </div>
            )}
          </div>
          
          <div className="text-center mt-12">
            <Link href="/volunteer">
              <button className="border border-primary text-primary px-8 py-3 rounded-lg font-semibold hover:bg-primary hover:text-white transition-colors">
                View All Opportunities
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <span className="text-2xl font-bold">VeriFund</span>
              </div>
              <p className="text-gray-300 mb-4">
                Community-driven transparent crowdfunding platform powered by blockchain technology.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="/campaigns" className="hover:text-white">Campaigns</Link></li>
                <li><Link href="/create-campaign" className="hover:text-white">Start a Campaign</Link></li>
                <li><Link href="/volunteer" className="hover:text-white">Volunteer</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Transparency</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white">Blockchain Explorer</a></li>
                <li><a href="#" className="hover:text-white">TES System</a></li>
                <li><a href="#" className="hover:text-white">Fee Structure</a></li>
                <li><a href="#" className="hover:text-white">Impact Reports</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">Report Fraud</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 VeriFund. All rights reserved. Building trust through transparency.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
