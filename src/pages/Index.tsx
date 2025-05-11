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
              <Button>Subscribe</Button>
            </div>
          </div>
          
          <div className="mt-6 border-t pt-4">
            <Tabs 
              defaultValue="featured" 
              value={activeTab} 
              onValueChange={(v) => setActiveTab(v as any)}
            >
              <TabsList className="grid grid-cols-4 w-full max-w-lg">
                <TabsTrigger value="featured">Featured</TabsTrigger>
                <TabsTrigger value="latest">Latest</TabsTrigger>
                <TabsTrigger value="trending">Trending</TabsTrigger>
                <TabsTrigger value="locations">Locations</TabsTrigger>
              </TabsList>
            
              {/* Content must be inside Tabs container */}
              {/* Featured Tab Content */}
              <TabsContent value="featured" className="mt-6 space-y-8">
                {featuredArticle && (
                  <>
                    {/* Featured Article */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                      <motion.div 
                        className="lg:col-span-2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                      >
                        <Card className="overflow-hidden h-full">
                          <div className="bg-gradient-to-r from-primary/20 to-primary/5 h-64 flex items-center justify-center">
                            <FileText className="h-20 w-20 text-primary/40" />
                          </div>
                          <CardContent className="p-6">
                            <div className="mb-4 flex items-center gap-2">
                              <Badge variant="outline" className="text-xs bg-primary/10">FEATURED</Badge>
                              <Badge className="bg-primary">{featuredArticle.activityCategory}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatNewsDate(featuredArticle.timestamp)}
                              </span>
                            </div>
                            <h2 className="text-2xl font-bold mb-3">
                              {generateHeadline(featuredArticle)}
                            </h2>
                            <p className="text-muted-foreground mb-4">
                              {featuredArticle.notes}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span>{featuredArticle.location}</span>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                      
                      <div className="space-y-5">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Top Stories</CardTitle>
                          </CardHeader>
                          <CardContent className="p-0">
                            <ScrollArea className="h-80">
                              <div className="divide-y">
                                {logs.slice(0, 5).map((log, i) => (
                                  <motion.div 
                                    key={log.id}
                                    className="p-4 hover:bg-muted/40 transition-colors"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                  >
                                    <div className="flex justify-between items-start mb-1">
                                      <Badge variant="outline" className="text-xs">
                                        {log.activityCategory}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        {formatNewsDate(log.timestamp)}
                                      </span>
                                    </div>
                                    <h3 className="font-medium line-clamp-2 mb-1">{log.activityType}</h3>
                                    <p className="text-sm text-muted-foreground line-clamp-2">{getExcerpt(log.notes, 80)}</p>
                                  </motion.div>
                                ))}
                              </div>
                            </ScrollArea>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Upcoming Events</CardTitle>
                          </CardHeader>
                          <CardContent>
                            {logs
                              .filter(log => log.status === "planned")
                              .slice(0, 3)
                              .map((log, i) => (
                                <div key={log.id} className="mb-4 last:mb-0">
                                  <div className="flex items-center gap-2">
                                    <CalendarDays className="h-4 w-4 text-primary" />
                                    <span className="text-sm font-medium">{formatNewsDate(log.timestamp)}</span>
                                  </div>
                                  <p className="ml-6 text-sm">{log.activityType} at {log.location}</p>
                                </div>
                              ))}
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </>
                )}
                
                {/* Categories Section */}
                <section>
                  <h2 className="text-2xl font-bold mb-6">Categories</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {Object.entries(categories).slice(0, 6).map(([category, count], i) => (
                      <motion.div 
                        key={category}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                      >
                        <Card className="bg-muted/10 hover:bg-muted/20 cursor-pointer transition-colors">
                          <CardContent className="p-6">
                            <h3 className="font-bold text-lg mb-2">{category}</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                              {count} {count === 1 ? 'update' : 'updates'}
                            </p>
                            <div className="flex justify-end">
                              <Button variant="ghost" size="sm">
                                View All
                                <ChevronRight className="h-4 w-4 ml-1" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </section>
              </TabsContent>
              
              {/* Latest Tab Content */}
              <TabsContent value="latest" className="mt-6 space-y-8">
                <h2 className="text-2xl font-bold mb-6">Latest Updates</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {getRecentLogs(7).map((log, i) => (
                    <motion.div 
                      key={log.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: i * 0.05 }}
                    >
                      <Card className="h-full flex flex-col">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-center mb-2">
                            <Badge>{log.activityCategory}</Badge>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatNewsDate(log.timestamp)}
                            </div>
                          </div>
                          <CardTitle className="leading-tight">{log.activityType}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow">
                          <p className="text-sm text-muted-foreground mb-4">
                            {getExcerpt(log.notes)}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{log.location}</span>
                          </div>
                        </CardContent>
                        <CardFooter className="pt-0">
                          <div className="w-full flex items-center justify-between">
                            <Badge variant={
                              log.status === "completed" ? "default" :
                              log.status === "in-progress" ? "secondary" :
                              log.status === "delayed" ? "destructive" :
                              "outline"
                            }>
                              {log.status}
                            </Badge>
                            <Button variant="ghost" size="sm">
                              Read More
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </div>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>
              
              {/* Trending Tab Content */}
              <TabsContent value="trending" className="mt-6 space-y-8">
                <section className="mb-10">
                  <div className="flex items-center gap-2 mb-6">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <h2 className="text-2xl font-bold">Trending Updates</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {getTrendingLogs().map((log, i) => (
                      <motion.div 
                        key={log.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                      >
                        <Card className="overflow-hidden">
                          <div className="bg-gradient-to-r from-primary/10 to-primary/5 h-12 flex items-center px-6">
                            <h3 className="font-medium flex items-center">
                              <TrendingUp className="h-4 w-4 mr-2 text-primary" />
                              Trending #{i+1}
                            </h3>
                          </div>
                          <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-3">
                              <Badge className="bg-primary/20 text-primary hover:bg-primary/30">
                                {log.activityCategory}
                              </Badge>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {formatNewsDate(log.timestamp)}
                              </div>
                            </div>
                            
                            <h3 className="text-xl font-bold mb-3">{log.activityType}</h3>
                            <p className="text-muted-foreground mb-4">{log.notes}</p>
                            
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-primary" />
                                <span className="text-sm">{log.location}</span>
                              </div>
                              <Button variant="outline" size="sm">
                                <Bookmark className="h-4 w-4 mr-2" />
                                Save
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </section>
                
                <section>
                  <h2 className="text-xl font-bold mb-6">Industry Insights</h2>
                  <Card>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-4">
                          <h3 className="font-medium">Status Distribution</h3>
                          <div className="space-y-2">
                            {["completed", "in-progress", "planned", "delayed"].map(status => {
                              const count = logs.filter(log => log.status === status).length;
                              const percentage = logs.length > 0 ? Math.round((count / logs.length) * 100) : 0;
                              return (
                                <div key={status} className="space-y-1">
                                  <div className="flex justify-between text-sm">
                                    <span className="capitalize">{status}</span>
                                    <span>{percentage}%</span>
                                  </div>
                                  <div className="bg-muted h-2 rounded-full">
                                    <div 
                                      className={`h-full rounded-full ${
                                        status === "completed" ? "bg-green-500" :
                                        status === "in-progress" ? "bg-blue-500" :
                                        status === "planned" ? "bg-purple-500" :
                                        "bg-yellow-500"
                                      }`}
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <h3 className="font-medium">Activity Overview</h3>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Total Updates</span>
                              <span>{logs.length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Projects</span>
                              <span>{Object.keys(locations).length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Categories</span>
                              <span>{Object.keys(categories).length}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="font-medium mb-4">Recent Activity</h3>
                          <div className="space-y-3">
                            {logs.slice(0, 3).map(log => (
                              <div key={log.id} className="text-sm flex gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                                <div>
                                  <p className="font-medium">{log.activityType}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatNewsDate(log.timestamp)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </section>
              </TabsContent>
              
              {/* Locations Tab Content */}
              <TabsContent value="locations" className="mt-6 space-y-8">
                <h2 className="text-2xl font-bold mb-6">Updates by Location</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(locations).map(([location, count], i) => {
                    const locationLogs = logs.filter(log => log.location === location);
                    const latestLog = locationLogs.sort((a, b) => 
                      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                    )[0];
                    
                    return (
                      <motion.div
                        key={location}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: i * 0.1 }}
                      >
                        <Card className="h-full">
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <CardTitle className="leading-tight">{location}</CardTitle>
                              <Badge variant="outline">{count} updates</Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {latestLog && (
                              <div className="space-y-1">
                                <div className="text-sm text-muted-foreground">Latest Update:</div>
                                <div className="font-medium">{latestLog.activityType}</div>
                                <div className="text-sm">{getExcerpt(latestLog.notes, 100)}</div>
                                <div className="text-xs text-muted-foreground">
                                  {formatNewsDate(latestLog.timestamp)}
                                </div>
                              </div>
                            )}
                            
                            <div>
                              <div className="text-sm text-muted-foreground mb-2">Activity Categories:</div>
                              <div className="flex flex-wrap gap-2">
                                {Array.from(new Set(locationLogs.map(log => log.activityCategory)))
                                  .slice(0, 3)
                                  .map(category => (
                                    <Badge key={category} variant="secondary" className="text-xs">
                                      {category}
                                    </Badge>
                                  ))
                                }
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter>
                            <Button variant="ghost" className="w-full" size="sm">
                              View All Updates
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </CardFooter>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </header>
      
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
          <div className="mt-6">
            {/* Tab content will be rendered in the header section */}
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="border-t bg-muted/20">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">ConstructNews Today</h3>
              <p className="text-sm text-muted-foreground">
                Your premier source for construction industry news, updates, and insights.
                Stay informed about the latest developments in real-time.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4">Categories</h3>
              <ul className="space-y-2 text-sm">
                {Object.keys(categories).slice(0, 5).map(category => (
                  <li key={category}>
                    <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                      {category}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4">Subscribe</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get the latest construction news delivered directly to your inbox.
              </p>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="Your email" 
                  className="px-3 py-2 text-sm rounded-md border w-full"
                />
                <Button>Subscribe</Button>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-4 border-t text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} ConstructNews Today. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
