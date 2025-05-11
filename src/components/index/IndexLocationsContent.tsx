
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight } from 'lucide-react';
import { LogEntry } from '@/lib/types';

interface IndexLocationsContentProps {
  locations: {[key: string]: number} | undefined;
  logs: LogEntry[];
  formatNewsDate: (dateString: string) => string;
  getExcerpt: (text: string, maxLength?: number) => string;
}

const IndexLocationsContent: React.FC<IndexLocationsContentProps> = ({
  locations = {}, // Add default empty object
  logs,
  formatNewsDate,
  getExcerpt
}) => {
  // Ensure locations is never undefined
  const locationsList = locations || {};
  const [expandedNotes, setExpandedNotes] = useState<{[key: string]: boolean}>({});
  
  const toggleExpanded = (locationId: string) => {
    setExpandedNotes(prev => ({
      ...prev,
      [locationId]: !prev[locationId]
    }));
  };
  
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Updates by Location</h2>
        <Button variant="ghost" size="sm" className="gap-1">
          View All Locations
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      {Object.keys(locationsList).length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(locationsList).map(([location, count], i) => {
            const locationLogs = logs.filter(log => log.location === location);
            const latestLog = locationLogs.length > 0 ? 
              locationLogs.sort((a, b) => 
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
              )[0] : null;
            
            const isExpanded = expandedNotes[location] || false;
            
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
                        <div className="text-sm">
                          {isExpanded 
                            ? latestLog.notes
                            : getExcerpt(latestLog.notes, 100)
                          }
                          {latestLog.notes.length > 100 && (
                            <Button 
                              variant="link" 
                              size="sm" 
                              onClick={() => toggleExpanded(location)}
                              className="p-0 h-auto"
                            >
                              {isExpanded ? "Show less" : "Read more"}
                            </Button>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatNewsDate(latestLog.timestamp)}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Activity Categories:</div>
                      <div className="flex flex-wrap gap-2">
                        {locationLogs.length > 0 ? (
                          Array.from(new Set(locationLogs.map(log => log.activityCategory)))
                            .slice(0, 3)
                            .map(category => (
                              <Badge key={category} variant="secondary" className="text-xs">
                                {category}
                              </Badge>
                            ))
                        ) : (
                          <span className="text-sm text-muted-foreground">No categories available</span>
                        )}
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
      ) : (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No location data available</p>
        </Card>
      )}
    </div>
  );
};

export default IndexLocationsContent;
