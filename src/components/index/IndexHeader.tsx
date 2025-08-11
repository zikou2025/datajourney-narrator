
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface IndexHeaderProps {
  activeTab: 'featured' | 'latest' | 'trending' | 'locations';
  setActiveTab: (tab: 'featured' | 'latest' | 'trending' | 'locations') => void;
  setSearchOpen: (open: boolean) => void;
}

const IndexHeader: React.FC<IndexHeaderProps> = ({ activeTab, setActiveTab, setSearchOpen }) => {
  return (
    <header className="border-b bg-black text-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">ConstructNews Today</h1>
            <p className="text-muted-foreground">
              Your source for real-time construction industry updates
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSearchOpen(true)}
              className="text-white border-white/30 hover:bg-white/10"
            >
              Search Archives
            </Button>
            <Button variant="outline" size="sm" asChild className="text-white border-white/30 hover:bg-white/10">
              <Link to="/news">News Portal</Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="text-white border-white/30 hover:bg-white/10">
              <Link to="/admin">Admin Access</Link>
            </Button>
            <Button className="bg-primary hover:bg-primary/90" asChild>
              <Link to="/dashboard">Subscribe</Link>
            </Button>
          </div>
        </div>
        
        <div className="mt-6 border-t border-white/20 pt-4">
          <Tabs 
            value={activeTab} 
            onValueChange={(v) => setActiveTab(v as any)}
            className="text-white"
          >
            <TabsList className="grid grid-cols-4 w-full max-w-lg bg-black/30">
              <TabsTrigger value="featured" className="data-[state=active]:bg-white/20">Featured</TabsTrigger>
              <TabsTrigger value="latest" className="data-[state=active]:bg-white/20">Latest</TabsTrigger>
              <TabsTrigger value="trending" className="data-[state=active]:bg-white/20">Trending</TabsTrigger>
              <TabsTrigger value="locations" className="data-[state=active]:bg-white/20">Locations</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
    </header>
  );
};

export default IndexHeader;
