
import React, { useState } from "react";
import IndexHeader from "@/components/index/IndexHeader";
import IndexFeaturedContent from "@/components/index/IndexFeaturedContent";
import IndexLatestContent from "@/components/index/IndexLatestContent";
import IndexTrendingContent from "@/components/index/IndexTrendingContent";
import IndexLocationsContent from "@/components/index/IndexLocationsContent";
import IndexFooter from "@/components/index/IndexFooter";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { mockLogs } from "@/lib/mockLogs";
import { 
  formatNewsDate, 
  getExcerpt, 
  getRecentLogs, 
  getTrendingLogs, 
  getLocationCounts, 
  getCategoryCounts, 
  getFeaturedArticle 
} from "@/lib/newsUtils";

const Index = () => {
  const [activeTab, setActiveTab] = useState<'featured' | 'latest' | 'trending' | 'locations'>('featured');
  const [searchOpen, setSearchOpen] = useState(false);
  
  // Process data for the components - ensure we always have valid objects
  const logs = mockLogs || [];
  const locations = getLocationCounts(logs) || {};
  const categories = getCategoryCounts(logs) || {};
  const featuredArticle = getFeaturedArticle(logs);

  console.log("Locations:", locations);
  console.log("Categories:", categories);

  return (
    <div>
      <IndexHeader 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        setSearchOpen={setSearchOpen}
      />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-wrap gap-4 justify-center">
          <Button asChild>
            <Link to="/legacy-news">News Portal</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/admin">Admin Dashboard</Link>
          </Button>
        </div>
        
        {activeTab === 'featured' && (
          <IndexFeaturedContent 
            featuredArticle={featuredArticle}
            logs={logs}
            categories={categories}
            formatNewsDate={formatNewsDate}
            getExcerpt={getExcerpt}
          />
        )}
        
        {activeTab === 'latest' && (
          <IndexLatestContent 
            getRecentLogs={(days) => getRecentLogs(logs, days)}
            formatNewsDate={formatNewsDate}
            getExcerpt={getExcerpt}
          />
        )}
        
        {activeTab === 'trending' && (
          <IndexTrendingContent 
            getTrendingLogs={() => getTrendingLogs(logs)}
            logs={logs}
            formatNewsDate={formatNewsDate}
          />
        )}
        
        {activeTab === 'locations' && (
          <IndexLocationsContent 
            locations={locations}
            logs={logs}
            formatNewsDate={formatNewsDate}
            getExcerpt={getExcerpt}
          />
        )}
      </div>
      <IndexFooter categories={categories} />
    </div>
  );
};

export default Index;
