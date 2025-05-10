
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
import NarrativeStoryView from "@/components/NarrativeStoryView";
import TranscriptionQA from "@/components/TranscriptionQA";
import { mockLogs } from "@/lib/mockData";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Book, BarChart } from "lucide-react";

const Index = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeView, setActiveView] = useState<'dashboard' | 'map' | 'list' | 'timeline' | 'timeseries' | 'story' | 'narrative' | 'qa'>('dashboard');
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState<string>("");
  const [storyViewType, setStoryViewType] = useState<'data' | 'narrative'>('data');

  // Load logs from database on initial render
  useEffect(() => {
    const loadLogsFromDatabase = async () => {
      setIsLoading(true);
      try {
        // Fetch all transcriptions
        const { data: transcriptionsData, error: transcriptionsError } = await supabase
          .from('transcriptions')
          .select('*')
          .order('created_at', { ascending: false });

        if (transcriptionsError) throw transcriptionsError;

        if (transcriptionsData && transcriptionsData.length > 0) {
          // Fetch logs for all transcriptions
          const { data: logsData, error: logsError } = await supabase
            .from('transcription_logs')
            .select('*')
            .order('created_at', { ascending: false });

          if (logsError) throw logsError;

          if (logsData && logsData.length > 0) {
            // Process logs from the database
            const processedLogs: LogEntry[] = logsData.map((logRow) => {
              // Fix the type error by adding proper type casting
              const logData = logRow.log_data as unknown;
              return logData as LogEntry;
            });

            setLogs(processedLogs);
            toast({
              title: "Data loaded",
              description: `Loaded ${processedLogs.length} logs from the database`,
            });
          } else {
            // Fall back to mock logs if no logs found
            setLogs(mockLogs);
          }
        } else {
          // Fall back to mock logs if no transcriptions found
          setLogs(mockLogs);
        }
      } catch (error) {
        console.error("Error loading logs from database:", error);
        // Fall back to mock logs on error
        setLogs(mockLogs);
        toast({
          title: "Error",
          description: "Failed to load logs from database. Using mock data instead.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadLogsFromDatabase();
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
        return (
          <div className="space-y-4">
            <Tabs 
              defaultValue="data" 
              value={storyViewType} 
              onValueChange={(value) => setStoryViewType(value as 'data' | 'narrative')}
              className="w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <TabsList>
                  <TabsTrigger value="data" className="flex items-center">
                    <BarChart className="w-4 h-4 mr-2" />
                    Data Story
                  </TabsTrigger>
                  <TabsTrigger value="narrative" className="flex items-center">
                    <Book className="w-4 h-4 mr-2" />
                    Narrative Story
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="data" className="mt-0">
                <StorytellingView logs={logs} />
              </TabsContent>
              
              <TabsContent value="narrative" className="mt-0">
                <NarrativeStoryView logs={logs} />
              </TabsContent>
            </Tabs>
          </div>
        );
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
