import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Bell, User, Menu, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import SubscriptionModal from '../SubscriptionModal';
import { useNavigate, Link } from 'react-router-dom';

interface ModernNewsHeaderProps {
  isSubscriber?: boolean;
  showSubscriberBar?: boolean;
}

const ModernNewsHeader: React.FC<ModernNewsHeaderProps> = ({ 
  isSubscriber = false, 
  showSubscriberBar = false 
}) => {
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleSubscriptionSuccess = () => {
    setIsSubscriptionModalOpen(false);
    navigate('/dashboard');
  };
  return (
    <div className="sticky top-0 z-50 bg-background">
      {/* Subscriber-only top bar */}
      {showSubscriberBar && isSubscriber && (
        <div className="bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="bg-white/20 text-white">LIVE</Badge>
                <span>Breaking: Major infrastructure announcement expected today</span>
              </div>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <Bell className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Main header */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2">
                <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">CN</span>
                </div>
                <span className="text-xl font-bold text-foreground">ConstructNews</span>
              </Link>
              
              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center gap-6">
                <button className="text-sm font-medium hover:text-primary transition-colors">Latest</button>
                <button className="text-sm font-medium hover:text-primary transition-colors">Industry</button>
                <button className="text-sm font-medium hover:text-primary transition-colors">Technology</button>
                <button className="text-sm font-medium hover:text-primary transition-colors">Markets</button>
                <button className="text-sm font-medium hover:text-primary transition-colors">Analysis</button>
              </nav>
            </div>
            
            {/* Right side actions */}
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Search className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9"
                onClick={() => navigate('/admin')}
                title="Admin Dashboard"
              >
                <Shield className="h-4 w-4" />
              </Button>
              
              {!isSubscriber && (
                <Button 
                  size="sm" 
                  className="hidden sm:flex"
                  onClick={() => setIsSubscriptionModalOpen(true)}
                >
                  Subscribe
                </Button>
              )}
              
              {isSubscriber && (
                <>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Bell className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <User className="h-4 w-4" />
                  </Button>
                </>
              )}
              
              <Button variant="ghost" size="icon" className="h-9 w-9 lg:hidden">
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <SubscriptionModal 
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        onSuccess={handleSubscriptionSuccess}
      />
    </div>
  );
};

export default ModernNewsHeader;