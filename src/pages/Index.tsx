
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
import { Book, BarChart, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  const [transcriptionStats, setTranscriptionStats] = useState({
    total: 0,
    recent: 0,
    processed: 0
  });

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
          setTranscriptionStats(prev => ({
            ...prev,
            total: transcriptionsData.length,
            recent: transcriptionsData.filter(t => 
              new Date(t.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            ).length
          }));
          
          // Set the title from the most recent transcription
          setVideoTitle(transcriptionsData[0].title || "");

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
            setTranscriptionStats(prev => ({
              ...prev,
              processed: logsData.length
            }));
            
            toast({
              title: "Data loaded",
              description: `Loaded ${processedLogs.length} logs from ${transcriptionsData.length} transcriptions`,
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
    
    // Update transcription stats
    setTranscriptionStats(prev => ({
      ...prev,
      total: prev.total + 1,
      recent: prev.recent + 1,
      processed: prev.processed + newLogs.length
    }));
  };

  // Handle selecting a log
  const handleSelectLog = (log: LogEntry) => {
    toast({
      title: `Log ${log.id}`,
      description: `${log.activityType} at ${log.location}`,
    });
  };

  const renderActiveView = () => {
    if (isLoading) {
      return (
        <Card className="w-full flex items-center justify-center p-12">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
            <CardTitle className="mb-2">Loading Data</CardTitle>
            <p className="text-muted-foreground">Fetching logs from database...</p>
          </div>
        </Card>
      );
    }
    
    switch (activeView) {
      case 'dashboard':
        return (
          <>
            <Card className="mb-6 bg-muted/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Transcription Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="glass p-4 rounded-lg">
                    <div className="text-2xl font-semibold">{transcriptionStats.total}</div>
                    <div className="text-sm text-muted-foreground">Total Transcriptions</div>
                  </div>
                  <div className="glass p-4 rounded-lg">
                    <div className="text-2xl font-semibold">{transcriptionStats.recent}</div>
                    <div className="text-sm text-muted-foreground">Recent (7 days)</div>
                  </div>
                  <div className="glass p-4 rounded-lg">
                    <div className="text-2xl font-semibold">{transcriptionStats.processed}</div>
                    <div className="text-sm text-muted-foreground">Total Activity Logs</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <LogDashboard logs={logs} />
          </>
        );
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
