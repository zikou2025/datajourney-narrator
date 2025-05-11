
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight } from 'lucide-react';
import { LogEntry } from '@/lib/types';

interface IndexLocationsContentProps {
  locations: {[key: string]: number};
  logs: LogEntry[];
  formatNewsDate: (dateString: string) => string;
  getExcerpt: (text: string, maxLength?: number) => string;
}

const IndexLocationsContent: React.FC<IndexLocationsContentProps> = ({
  locations,
  logs,
  formatNewsDate,
  getExcerpt
}) => {
  return (
    <div className="space-y-8">
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
    </div>
  );
};

export default IndexLocationsContent;
