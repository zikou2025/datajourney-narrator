import React, { useState, useEffect, Suspense } from "react";
import ModernNewsHeader from "@/components/news/ModernNewsHeader";
import ModernNewsGrid from "@/components/news/ModernNewsGrid";
import ModernNewsSidebar from "@/components/news/ModernNewsSidebar";
import LogHeader from "@/components/LogHeader";
import IndexHeader from "@/components/index/IndexHeader";
import IndexFooter from "@/components/index/IndexFooter";
import IndexFeaturedContent from "@/components/index/IndexFeaturedContent";
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

// Lazy load components
const LogMap = React.lazy(() => import('@/components/LogMap'));
const LogTable = React.lazy(() => import('@/components/LogTable'));
const LogTimeline = React.lazy(() => import('@/components/LogTimeline'));
const TimeSeriesView = React.lazy(() => import('@/components/TimeSeriesView'));
const StorytellingView = React.lazy(() => import('@/components/StorytellingView'));
const TranscriptionQA = React.lazy(() => import('@/components/TranscriptionQA'));
const NetworkVisualization = React.lazy(() => import('@/components/NetworkVisualization'));

const Index = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [activeTab, setActiveTab] = useState<'featured' | 'latest' | 'trending' | 'locations'>('featured');
  const [transcriptionsData, setTranscriptionsData] = useState([]);
  const [isSubscriber] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Check URL params for view switching
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get('view');
    if (viewParam && ['dashboard', 'map', 'list', 'timeline', 'timeseries', 'story', 'qa', 'network'].includes(viewParam)) {
      setActiveView(viewParam);
    }
  }, []);
  
  // Fetch data from Supabase
  useEffect(() => {
    const fetchTranscriptions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('transcriptions')
          .select('*');
        
        if (error) {
          console.error("Error fetching transcriptions:", error);
          setError(error.message);
        } else {
          console.log("Transcriptions loaded:", data);
          setTranscriptionsData(data || []);
        }
      } catch (error) {
        console.error("Failed to fetch transcriptions:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTranscriptions();
  }, []);
  
  // Process data for the components - ensure we always have valid objects
  const logs = React.useMemo(() => {
    if (transcriptionsData.length > 0) {
      return transcriptionsData.map(item => ({
        id: item.id,
        timestamp: item.created_at,
        activityType: item.title,
        activityCategory: "Transcription",
        notes: item.full_text || "",
        location: "Online",
        status: "completed" as const,
        equipment: "",
        personnel: "",
        material: "",
        measurement: "",
        referenceId: item.id
      }));
    }
    return mockLogs || [];
  }, [transcriptionsData]);
  
  const categories = React.useMemo(() => getCategoryCounts(logs) || {}, [logs]);
  const recentArticles = React.useMemo(() => getRecentLogs(logs, 7), [logs]);
  const trendingArticles = React.useMemo(() => getTrendingLogs(logs), [logs]);
  const featuredArticle = React.useMemo(() => getFeaturedArticle(logs), [logs]);

  const handleArticleClick = (article) => {
    console.log('Article clicked:', article);
    // TODO: Navigate to article detail page
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center text-red-600">
          <h2 className="text-xl font-semibold mb-2">Error loading data</h2>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'featured':
        return (
          <IndexFeaturedContent
            featuredArticle={featuredArticle}
            logs={logs}
            categories={categories}
            formatNewsDate={formatNewsDate}
            getExcerpt={getExcerpt}
          />
        );
      case 'latest':
        return (
          <div className="container mx-auto px-4 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <ModernNewsGrid 
                  articles={recentArticles}
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
      case 'trending':
        return (
          <div className="container mx-auto px-4 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <ModernNewsGrid 
                  articles={trendingArticles}
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
      default:
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
  };

  // Determine which view to show based on activeView
  const renderActiveView = () => {
    if (activeView === 'dashboard') {
      return (
        <>
          <IndexHeader 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            setSearchOpen={setSearchOpen}
          />
          <main className="container mx-auto px-4 py-8">
            {renderTabContent()}
          </main>
          <IndexFooter categories={categories} />
        </>
      );
    } 
    
    // For non-dashboard views, use lazy loaded components
    const LoadingFallback = ({ message }) => (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p>{message}</p>
        </div>
      </div>
    );

    switch(activeView) {
      case 'map':
        return (
          <Suspense fallback={<LoadingFallback message="Loading map view..." />}>
            <LogMap logs={logs} selectedLocation={null} setSelectedLocation={() => {}} />
          </Suspense>
        );
      case 'list':
        return (
          <Suspense fallback={<LoadingFallback message="Loading list view..." />}>
            <LogTable logs={logs} onSelectLog={() => {}} />
          </Suspense>
        );
      case 'timeline':
        return (
          <Suspense fallback={<LoadingFallback message="Loading timeline view..." />}>
            <LogTimeline logs={logs} onSelectLog={() => {}} />
          </Suspense>
        );
      case 'timeseries':
        return (
          <Suspense fallback={<LoadingFallback message="Loading time series view..." />}>
            <TimeSeriesView logs={logs} />
          </Suspense>
        );
      case 'story':
        return (
          <Suspense fallback={<LoadingFallback message="Loading story view..." />}>
            <StorytellingView logs={logs} />
          </Suspense>
        );
      case 'qa':
        return (
          <Suspense fallback={<LoadingFallback message="Loading Q&A view..." />}>
            <TranscriptionQA logs={logs} />
          </Suspense>
        );
      case 'network':
        return (
          <Suspense fallback={<LoadingFallback message="Loading network view..." />}>
            <NetworkVisualization logs={logs} />
          </Suspense>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {activeView === 'dashboard' ? (
        renderActiveView()
      ) : (
        <>
          <LogHeader 
            activeView={activeView as any}
            setActiveView={setActiveView}
            setSearchOpen={setSearchOpen}
          />
          {renderActiveView()}
        </>
      )}
    </div>
  );
};

export default Index;
