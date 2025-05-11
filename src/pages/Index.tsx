
import React, { useState, useEffect } from 'react';
import { LogEntry } from '@/lib/types';
import { motion } from 'framer-motion';
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { mockLogs } from "@/lib/mockData";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import TranscriptionInput from "@/components/TranscriptionInput";
import { Calendar, BarChart, Bookmark, ChevronRight, Clock, CalendarDays, Newspaper, MapPin, Users, TrendingUp, Loader2, FileText } from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';
import LogSearch from "@/components/LogSearch";

import IndexFeaturedContent from '@/components/index/IndexFeaturedContent';
import IndexLatestContent from '@/components/index/IndexLatestContent';
import IndexTrendingContent from '@/components/index/IndexTrendingContent';
import IndexLocationsContent from '@/components/index/IndexLocationsContent';
import IndexHeader from '@/components/index/IndexHeader';
import IndexFooter from '@/components/index/IndexFooter';

const Index = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'featured' | 'latest' | 'trending' | 'locations'>('featured');
  const [isLoading, setIsLoading] = useState(false);
  const [videoTitle, setVideoTitle] = useState<string>("");
  const [featuredArticle, setFeaturedArticle] = useState<LogEntry | null>(null);
  const [locations, setLocations] = useState<{[key: string]: number}>({});
  const [categories, setCategories] = useState<{[key: string]: number}>({});

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
              const logData = logRow.log_data as unknown;
              return logData as LogEntry;
            });

            setLogs(processedLogs);
            processLogData(processedLogs);
            
            toast({
              title: "News feed updated",
              description: `Latest construction industry news and updates loaded`,
            });
          } else {
            // Fall back to mock logs if no logs found
            setLogs(mockLogs);
            processLogData(mockLogs);
          }
        } else {
          // Fall back to mock logs if no transcriptions found
          setLogs(mockLogs);
          processLogData(mockLogs);
        }
      } catch (error) {
        console.error("Error loading logs from database:", error);
        // Fall back to mock logs on error
        setLogs(mockLogs);
        processLogData(mockLogs);
        toast({
          title: "Using sample data",
          description: "Connected to demo news feed. Real-time construction updates available.",
          variant: "default",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadLogsFromDatabase();
  }, []);

  // Process log data to extract insights
  const processLogData = (logsData: LogEntry[]) => {
    // Find a featured article (most detailed log entry)
    const sortedByLength = [...logsData].sort((a, b) => b.notes.length - a.notes.length);
    setFeaturedArticle(sortedByLength[0] || null);
    
    // Count locations
    const locationCounts: {[key: string]: number} = {};
    logsData.forEach(log => {
      if (!locationCounts[log.location]) locationCounts[log.location] = 0;
      locationCounts[log.location]++;
    });
    setLocations(locationCounts);
    
    // Count categories
    const categoryCounts: {[key: string]: number} = {};
    logsData.forEach(log => {
      if (!categoryCounts[log.activityCategory]) categoryCounts[log.activityCategory] = 0;
      categoryCounts[log.activityCategory]++;
    });
    setCategories(categoryCounts);
  };

  // Generate news headline from log entry
  const generateHeadline = (log: LogEntry): string => {
    return `${log.activityType} Progress at ${log.location}`;
  };

  // Get excerpt from log notes
  const getExcerpt = (text: string, maxLength: number = 150): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };
  
  // Format date in news style
  const formatNewsDate = (dateString: string): string => {
    try {
      const date = parseISO(dateString);
      return format(date, 'MMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  // Handle new logs from transcription input
  const handleNewLogs = (newLogs: LogEntry[], title?: string) => {
    if (title) {
      setVideoTitle(title);
    }
    
    setLogs(prev => {
      // Filter out any duplicate logs by ID
      const existingIds = new Set(prev.map(log => log.id));
      const uniqueNewLogs = newLogs.filter(log => !existingIds.has(log.id));
      const updatedLogs = [...prev, ...uniqueNewLogs];
      processLogData(updatedLogs);
      return updatedLogs;
    });
    
    toast({
      title: "Breaking News Added",
      description: "New construction updates have been added to the feed",
    });
  };

  // Filters logs by recent days
  const getRecentLogs = (days: number) => {
    return logs.filter(log => {
      try {
        const logDate = new Date(log.timestamp);
        const cutoffDate = subDays(new Date(), days);
        return logDate >= cutoffDate;
      } catch (e) {
        return false;
      }
    });
  };

  // Get trending logs based on status and recency
  const getTrendingLogs = () => {
    const weightedLogs = logs.map(log => {
      let weight = 0;
      
      // Weigh by status
      if (log.status === "in-progress") weight += 5;
      if (log.status === "completed") weight += 3;
      if (log.status === "delayed") weight += 4;
      
      // Weigh by recency
      const daysAgo = Math.floor((new Date().getTime() - new Date(log.timestamp).getTime()) / (1000 * 3600 * 24));
      weight += Math.max(10 - daysAgo, 0);
      
      // Weigh by note length
      weight += Math.min(log.notes.length / 50, 5);
      
      return { log, weight };
    });
    
    return weightedLogs
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5)
      .map(item => item.log);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <IndexHeader 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setSearchOpen={setSearchOpen}
      />
      
      {searchOpen && (
        <LogSearch
          isOpen={searchOpen}
          onClose={() => setSearchOpen(false)}
          logs={logs}
          onSelectLog={() => {}}
        />
      )}
      
      <main className="container mx-auto px-4 py-8">
        {/* Transcription Input for Adding News */}
        <div className="mb-8">
          <Card>
            <CardHeader className="border-b bg-muted/20">
              <CardTitle>Submit Breaking News</CardTitle>
              <CardDescription>Upload a project recording to generate construction updates</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <TranscriptionInput onLogsGenerated={handleNewLogs} />
            </CardContent>
          </Card>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading latest construction news...</p>
            </div>
          </div>
        ) : (
          <Tabs 
            value={activeTab} 
            onValueChange={(v) => setActiveTab(v as any)} 
            className="mt-6"
          >
            <TabsContent value="featured">
              <IndexFeaturedContent 
                featuredArticle={featuredArticle}
                logs={logs}
                categories={categories}
                formatNewsDate={formatNewsDate}
                getExcerpt={getExcerpt}
              />
            </TabsContent>
            
            <TabsContent value="latest">
              <IndexLatestContent 
                getRecentLogs={getRecentLogs}
                formatNewsDate={formatNewsDate}
                getExcerpt={getExcerpt}
              />
            </TabsContent>
            
            <TabsContent value="trending">
              <IndexTrendingContent 
                getTrendingLogs={getTrendingLogs}
                logs={logs}
                formatNewsDate={formatNewsDate}
              />
            </TabsContent>
            
            <TabsContent value="locations">
              <IndexLocationsContent 
                locations={locations}
                logs={logs}
                formatNewsDate={formatNewsDate}
                getExcerpt={getExcerpt}
              />
            </TabsContent>
          </Tabs>
        )}
      </main>
      
      {/* Footer */}
      <IndexFooter categories={categories} />
    </div>
  );
};

export default Index;
