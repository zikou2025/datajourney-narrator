
import React, { useState, useEffect } from "react";
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
import LogHeader from "@/components/LogHeader";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [activeTab, setActiveTab] = useState<'featured' | 'latest' | 'trending' | 'locations'>('featured');
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeView, setActiveView] = useState<'dashboard' | 'map' | 'list' | 'timeline' | 'timeseries' | 'story' | 'narrative' | 'qa'>('dashboard');
  const [transcriptionsData, setTranscriptionsData] = useState<any[]>([]);
  
  // Fetch data from Supabase
  useEffect(() => {
    const fetchTranscriptions = async () => {
      try {
        const { data, error } = await supabase
          .from('transcriptions')
          .select('*');
        
        if (error) {
          console.error("Error fetching transcriptions:", error);
        } else {
          console.log("Transcriptions loaded:", data);
          setTranscriptionsData(data || []);
        }
      } catch (error) {
        console.error("Failed to fetch transcriptions:", error);
      }
    };

    fetchTranscriptions();
  }, []);
  
  // Process data for the components - ensure we always have valid objects
  const logs = transcriptionsData.length > 0 
    ? transcriptionsData.map(item => ({
        id: item.id,
        timestamp: item.created_at,
        activityType: item.title,
        activityCategory: "Transcription",
        notes: item.full_text || "",
        location: "Online",
        status: "completed"
      }))
    : mockLogs || [];
  
  const locations = getLocationCounts(logs) || {};
  const categories = getCategoryCounts(logs) || {};
  const featuredArticle = getFeaturedArticle(logs);

  // Determine which view to show based on activeView
  const renderActiveView = () => {
    if (activeView === 'dashboard') {
      if (activeTab === 'featured') {
        return (
          <IndexFeaturedContent 
            featuredArticle={featuredArticle}
            logs={logs}
            categories={categories || {}}
            formatNewsDate={formatNewsDate}
            getExcerpt={getExcerpt}
          />
        );
      } else if (activeTab === 'latest') {
        return (
          <IndexLatestContent 
            getRecentLogs={(days) => getRecentLogs(logs, days)}
            formatNewsDate={formatNewsDate}
            getExcerpt={getExcerpt}
          />
        );
      } else if (activeTab === 'trending') {
        return (
          <IndexTrendingContent 
            getTrendingLogs={() => getTrendingLogs(logs)}
            logs={logs}
            formatNewsDate={formatNewsDate}
          />
        );
      } else if (activeTab === 'locations') {
        return (
          <IndexLocationsContent 
            locations={locations}
            logs={logs}
            formatNewsDate={formatNewsDate}
            getExcerpt={getExcerpt}
          />
        );
      }
    } 
    
    // For non-dashboard views, import and use the appropriate component
    switch(activeView) {
      case 'map':
        const LogMap = React.lazy(() => import('@/components/LogMap'));
        return <React.Suspense fallback={<div>Loading map view...</div>}><LogMap logs={logs} /></React.Suspense>;
      case 'list':
        const LogTable = React.lazy(() => import('@/components/LogTable'));
        return <React.Suspense fallback={<div>Loading list view...</div>}><LogTable logs={logs} /></React.Suspense>;
      case 'timeline':
        const LogTimeline = React.lazy(() => import('@/components/LogTimeline'));
        return <React.Suspense fallback={<div>Loading timeline view...</div>}><LogTimeline logs={logs} /></React.Suspense>;
      case 'timeseries':
        const TimeSeriesView = React.lazy(() => import('@/components/TimeSeriesView'));
        return <React.Suspense fallback={<div>Loading time series view...</div>}><TimeSeriesView logs={logs} /></React.Suspense>;
      case 'story':
        const StorytellingView = React.lazy(() => import('@/components/StorytellingView'));
        return <React.Suspense fallback={<div>Loading story view...</div>}><StorytellingView logs={logs} /></React.Suspense>;
      case 'qa':
        const TranscriptionQA = React.lazy(() => import('@/components/TranscriptionQA'));
        return <React.Suspense fallback={<div>Loading Q&A view...</div>}><TranscriptionQA logs={logs} /></React.Suspense>;
      default:
        return null;
    }
  };

  return (
    <div>
      <LogHeader 
        activeView={activeView}
        setActiveView={setActiveView}
        setSearchOpen={setSearchOpen}
      />
      
      {activeView === 'dashboard' && (
        <IndexHeader 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          setSearchOpen={setSearchOpen}
        />
      )}
      
      <div className="container mx-auto px-4 py-8">
        {activeView === 'dashboard' && (
          <div className="mb-8 flex flex-wrap gap-4 justify-center">
            <Button asChild>
              <Link to="/admin">Admin Dashboard</Link>
            </Button>
          </div>
        )}
        
        {renderActiveView()}
      </div>
      
      <IndexFooter categories={categories || {}} />
    </div>
  );
};

export default Index;
