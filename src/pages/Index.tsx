
import React, { useState, useEffect } from 'react';
import LogHeader from "@/components/LogHeader";
import { LogEntry } from '@/lib/types';
import LogMap from "@/components/LogMap";
import LogTable from "@/components/LogTable";
import LogSearch from "@/components/LogSearch";
import TranscriptionInput from "@/components/TranscriptionInput";
import LogDashboard from "@/components/LogDashboard"; 
import LogTimeline from "@/components/LogTimeline";
import TimeSeriesView from "@/components/TimeSeriesView";
import StorytellingView from "@/components/StorytellingView";
import TranscriptionQA from "@/components/TranscriptionQA";
import { mockLogs } from "@/lib/mockData";
import { toast } from "@/components/ui/use-toast";

const Index = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeView, setActiveView] = useState<'dashboard' | 'map' | 'list' | 'timeline' | 'timeseries' | 'story' | 'qa'>('dashboard');
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState<string>("");

  // Load mock data on initial render
  useEffect(() => {
    setLogs(mockLogs);
  }, []);

  // Update search results when logs or search query changes
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = logs.filter((log) => {
      return (
        log.location.toLowerCase().includes(query) ||
        log.activityType.toLowerCase().includes(query) ||
        log.activityCategory.toLowerCase().includes(query) ||
        log.notes.toLowerCase().includes(query)
      );
    });

    setSearchResults(results);
  }, [logs, searchQuery]);

  // Handle new logs from transcription input
  const handleNewLogs = (newLogs: LogEntry[], title?: string) => {
    if (title) {
      setVideoTitle(title);
    }
    
    setLogs(prev => {
      // Filter out any duplicate logs by ID
      const existingIds = new Set(prev.map(log => log.id));
      const uniqueNewLogs = newLogs.filter(log => !existingIds.has(log.id));
      return [...prev, ...uniqueNewLogs];
    });
  };

  // Handle selecting a log
  const handleSelectLog = (log: LogEntry) => {
    toast({
      title: `Log ${log.id}`,
      description: `${log.activityType} at ${log.location}`,
    });
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <LogDashboard logs={logs} />;
      case 'map':
        return <LogMap logs={logs} selectedLocation={selectedLocation} setSelectedLocation={setSelectedLocation} />;
      case 'list':
        return <LogTable logs={logs} onSelectLog={handleSelectLog} />;
      case 'timeline':
        return <LogTimeline logs={logs} onSelectLog={handleSelectLog} />;
      case 'timeseries':
        return <TimeSeriesView logs={logs} />;
      case 'story':
        return <StorytellingView logs={logs} />;
      case 'qa':
        return <TranscriptionQA logs={logs} videoTitle={videoTitle} />;
      default:
        return <LogDashboard logs={logs} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <LogHeader 
        activeView={activeView}
        setActiveView={setActiveView}
        setSearchOpen={setSearchOpen}
      />
      
      {searchOpen && (
        <LogSearch
          isOpen={searchOpen}
          onClose={() => setSearchOpen(false)}
          logs={logs}
          onSelectLog={handleSelectLog}
        />
      )}
      
      <div className="container mx-auto py-6 px-4">
        <TranscriptionInput 
          onLogsGenerated={handleNewLogs} 
        />
        
        {renderActiveView()}
      </div>
    </div>
  );
};

export default Index;
