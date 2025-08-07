
import React, { useState, useEffect } from "react";
import ModernNewsHeader from "@/components/news/ModernNewsHeader";
import ModernNewsGrid from "@/components/news/ModernNewsGrid";
import ModernNewsSidebar from "@/components/news/ModernNewsSidebar";
import LogHeader from "@/components/LogHeader";
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
import { supabase } from "@/integrations/supabase/client";
import { LogEntry } from '@/lib/types';

const Index = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeView, setActiveView] = useState<'dashboard' | 'map' | 'list' | 'timeline' | 'timeseries' | 'story' | 'narrative' | 'qa'>('dashboard');
  const [transcriptionsData, setTranscriptionsData] = useState<any[]>([]);
  const [isSubscriber] = useState(false); // TODO: Connect to actual subscription status
  
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
  const logs: LogEntry[] = transcriptionsData.length > 0 
    ? transcriptionsData.map(item => ({
        id: item.id,
        timestamp: item.created_at,
        activityType: item.title,
        activityCategory: "Transcription",
        notes: item.full_text || "",
        location: "Online",
        status: "completed",
        equipment: "",
        personnel: "",
        material: "",
        measurement: "",
        referenceId: item.id
      }))
    : mockLogs || [];
  
  const categories = getCategoryCounts(logs) || {};
  const recentArticles = getRecentLogs(logs, 7);
  const trendingArticles = getTrendingLogs(logs);

  const handleArticleClick = (article: LogEntry) => {
    console.log('Article clicked:', article);
    // TODO: Navigate to article detail page
  };

  // Determine which view to show based on activeView
  const renderActiveView = () => {
    if (activeView === 'dashboard') {
      return (
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <ModernNewsGrid 
                articles={logs}
                onArticleClick={handleArticleClick}
              />
            </div>
            <div className="lg:col-span-1">
              <ModernNewsSidebar 
                trendingArticles={trendingArticles}
                recentArticles={recentArticles}
                categories={categories}
                onArticleClick={handleArticleClick}
              />
            </div>
          </div>
        </div>
      );
    } 
    
    // For non-dashboard views, import and use the appropriate component
    switch(activeView) {
      case 'map':
        const LogMap = React.lazy(() => import('@/components/LogMap'));
        return <React.Suspense fallback={<div>Loading map view...</div>}><LogMap logs={logs} selectedLocation={null} setSelectedLocation={() => {}} /></React.Suspense>;
      case 'list':
        const LogTable = React.lazy(() => import('@/components/LogTable'));
        return <React.Suspense fallback={<div>Loading list view...</div>}><LogTable logs={logs} onSelectLog={() => {}} /></React.Suspense>;
      case 'timeline':
        const LogTimeline = React.lazy(() => import('@/components/LogTimeline'));
        return <React.Suspense fallback={<div>Loading timeline view...</div>}><LogTimeline logs={logs} onSelectLog={() => {}} /></React.Suspense>;
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
    <div className="min-h-screen bg-background">
      {/* Show subscriber bar only for subscribers */}
      {activeView === 'dashboard' ? (
        <ModernNewsHeader 
          isSubscriber={isSubscriber}
          showSubscriberBar={isSubscriber}
        />
      ) : (
        <LogHeader 
          activeView={activeView}
          setActiveView={setActiveView}
          setSearchOpen={setSearchOpen}
        />
      )}
      
      {renderActiveView()}
    </div>
  );
};

export default Index;
