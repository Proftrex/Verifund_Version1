import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import heroImage from "@assets/Untitled design_1756063757944.png";

export default function Hero() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="relative bg-gray-50 text-gray-900" style={{ backgroundColor: '#f8f8f8' }}>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 pt-36">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              Every Fund Story<br />
              <span className="text-green-600">Matters</span>
            </h1>
            <p className="text-xl mb-8 text-gray-600">
              Transparent Donation Platform with Governance System
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Button 
                className="bg-gray-700 text-white hover:bg-gray-800 font-semibold px-8 py-3 rounded-lg"
                onClick={() => window.location.href = "/api/login"}
                data-testid="button-join-waitlist"
              >
                JOIN THE WAITLIST →
              </Button>
            </div>
          </div>
          
          <div className="hidden lg:block">
            {/* Hero illustration */}
            <div className="relative mx-auto max-w-lg">
              <img 
                src={heroImage} 
                alt="VeriFund community illustration with donation jar and charitable items"
                className="w-full h-auto object-contain drop-shadow-2xl"
                data-testid="hero-image"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
