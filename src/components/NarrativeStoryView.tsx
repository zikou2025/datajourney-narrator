
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { LogEntry, StorySegment } from '@/lib/types';
import { ChevronRight, ChevronLeft, Book, Quote, Map, Clock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';

interface NarrativeStoryViewProps {
  logs: LogEntry[];
}

const NarrativeStoryView: React.FC<NarrativeStoryViewProps> = ({ logs }) => {
  const [storySegments, setStorySegments] = useState<StorySegment[]>([]);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (logs.length > 0) {
      generateStorySegments();
    }
  }, [logs]);

  const generateStorySegments = () => {
    setLoading(true);
    
    // Group logs by location
    const locationGroups: Record<string, LogEntry[]> = {};
    logs.forEach(log => {
      if (!locationGroups[log.location]) {
        locationGroups[log.location] = [];
      }
      locationGroups[log.location].push(log);
    });
    
    // Create story segments from location groups
    const segments: StorySegment[] = Object.entries(locationGroups).map(([location, locationLogs]) => {
      // Sort logs by timestamp
      const sortedLogs = [...locationLogs].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      // Find first and last timestamp for this location
      const firstTimestamp = sortedLogs[0]?.timestamp || '';
      const lastTimestamp = sortedLogs[sortedLogs.length - 1]?.timestamp || '';
      
      // Generate a summary based on the logs
      const activityTypes = [...new Set(sortedLogs.map(log => log.activityType))];
      const primaryActivities = activityTypes.slice(0, 3).join(', ');
      
      const title = `The ${location} Chronicle`;
      
      // Create a narrative summary
      let summary = `At ${location}, a series of important events unfolded. `;
      
      if (activityTypes.length > 0) {
        summary += `The area saw various activities including ${primaryActivities}. `;
      }
      
      // Add some specific details from logs
      if (sortedLogs.length > 0) {
        const randomLog = sortedLogs[Math.floor(Math.random() * sortedLogs.length)];
        summary += `One notable event was when "${randomLog.notes}". `;
      }
      
      // Add a conclusion
      summary += `This location continues to be a critical part of the ongoing operations.`;
      
      return {
        title,
        location,
        start: firstTimestamp,
        end: lastTimestamp,
        timeSpan: `From ${format(parseISO(firstTimestamp), 'MMM d')} to ${format(parseISO(lastTimestamp), 'MMM d')}`,
        logs: sortedLogs,
        coordinates: sortedLogs[0]?.coordinates,
        summary
      };
    });
    
    setStorySegments(segments);
    setLoading(false);
  };

  const handleNext = () => {
    setActiveSegmentIndex(prev => (prev + 1) % storySegments.length);
  };

  const handlePrev = () => {
    setActiveSegmentIndex(prev => (prev - 1 + storySegments.length) % storySegments.length);
  };

  const activeSegment = storySegments[activeSegmentIndex];

  // Get random quotes from the logs
  const getRandomQuotes = (logs: LogEntry[], count: number = 3): string[] => {
    if (logs.length === 0) return [];
    
    const quotes: string[] = [];
    const noteableLogs = logs.filter(log => log.notes && log.notes.length > 20);
    
    for (let i = 0; i < Math.min(count, noteableLogs.length); i++) {
      const randomIndex = Math.floor(Math.random() * noteableLogs.length);
      const randomLog = noteableLogs[randomIndex];
      
      // Make sure we don't add duplicate quotes
      if (!quotes.includes(randomLog.notes)) {
        quotes.push(randomLog.notes);
      }
      
      // Remove this log to avoid duplicates
      noteableLogs.splice(randomIndex, 1);
    }
    
    return quotes;
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="border-b bg-muted/20">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Book className="w-5 h-5 mr-2 text-primary" />
            Narrative Storytelling
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={generateStorySegments} disabled={loading}>
              <Sparkles className="w-4 h-4 mr-1" />
              Regenerate Stories
            </Button>
          </div>
        </div>
        <CardDescription>
          Experience your data as immersive narrative journeys
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-0">
        {storySegments.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <Book className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Stories Available</h3>
            <p className="text-muted-foreground max-w-md">
              There aren't enough logs to generate compelling stories. 
              Add more transcriptions or logs to create narrative journeys.
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Story navigation */}
            <div className="flex justify-between p-4 border-b">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handlePrev}
                disabled={storySegments.length <= 1}
                className="flex items-center"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous Story
              </Button>
              
              <Badge variant="outline" className="text-xs">
                {activeSegmentIndex + 1} of {storySegments.length} Stories
              </Badge>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleNext}
                disabled={storySegments.length <= 1}
                className="flex items-center"
              >
                Next Story
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSegmentIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="p-6"
              >
                {activeSegment && (
                  <div className="space-y-8">
                    {/* Story Header */}
                    <div>
                      <h2 className="text-2xl font-bold mb-2">{activeSegment.title}</h2>
                      
                      <div className="flex flex-wrap gap-3 mb-4">
                        <Badge className="flex items-center gap-1 bg-primary">
                          <Map className="w-3 h-3" />
                          {activeSegment.location}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {activeSegment.timeSpan}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Story Content */}
                    <div className="prose max-w-none">
                      <div className="bg-muted/20 p-5 rounded-lg mb-8 border-l-4 border-primary italic text-muted-foreground leading-relaxed">
                        {activeSegment.summary}
                      </div>
                      
                      {/* Location description */}
                      <h3 className="text-lg font-medium mb-4">The Setting</h3>
                      <p className="mb-6">
                        {activeSegment.location} is a hub of activity where 
                        {activeSegment.logs.length} distinct events were recorded during this period. 
                        The area has been central to operations and continues to play a vital role 
                        in the broader narrative of this region.
                      </p>
                      
                      {/* Notable quotes */}
                      <h3 className="text-lg font-medium mb-2">Notable Moments</h3>
                      <ScrollArea className="h-[200px]">
                        <div className="space-y-4">
                          {getRandomQuotes(activeSegment.logs).map((quote, i) => (
                            <div key={i} className="flex gap-3">
                              <div>
                                <Quote className="w-5 h-5 text-primary/60 flex-shrink-0 mt-1" />
                              </div>
                              <div className="bg-muted/10 p-3 rounded-md border border-muted/40 flex-1">
                                <p className="text-sm">{quote}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      
                      {/* Timeline */}
                      <h3 className="text-lg font-medium mt-6 mb-2">Key Events</h3>
                      <div className="relative pl-8 border-l-2 border-muted/50 space-y-6">
                        {activeSegment.logs.slice(0, 5).map((log, i) => (
                          <div key={i} className="relative">
                            <div className="absolute -left-[25px] w-4 h-4 rounded-full bg-primary"></div>
                            <p className="text-xs text-muted-foreground mb-1">
                              {format(parseISO(log.timestamp), 'MMMM d, yyyy')}
                            </p>
                            <h4 className="text-md font-medium">{log.activityType}</h4>
                            <p className="text-sm text-muted-foreground">{log.notes}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NarrativeStoryView;
