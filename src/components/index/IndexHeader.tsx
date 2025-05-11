
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface IndexHeaderProps {
  activeTab: 'featured' | 'latest' | 'trending' | 'locations';
  setActiveTab: (tab: 'featured' | 'latest' | 'trending' | 'locations') => void;
  setSearchOpen: (open: boolean) => void;
}

const IndexHeader: React.FC<IndexHeaderProps> = ({ activeTab, setActiveTab, setSearchOpen }) => {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
            >
              Search Archives
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/legacy-news">News Archive</Link>
            </Button>
            <Button>Subscribe</Button>
          </div>
        </div>
        
        <div className="mt-6 border-t pt-4">
          <Tabs 
            value={activeTab} 
            onValueChange={(v) => setActiveTab(v as any)}
          >
            <TabsList className="grid grid-cols-4 w-full max-w-lg">
              <TabsTrigger value="featured">Featured</TabsTrigger>
              <TabsTrigger value="latest">Latest</TabsTrigger>
              <TabsTrigger value="trending">Trending</TabsTrigger>
              <TabsTrigger value="locations">Locations</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
    </header>
  );
};

export default IndexHeader;
