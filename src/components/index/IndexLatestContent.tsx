
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, ChevronRight } from 'lucide-react';
import { LogEntry } from '@/lib/types';

interface IndexLatestContentProps {
  getRecentLogs: (days: number) => LogEntry[];
  formatNewsDate: (dateString: string) => string;
  getExcerpt: (text: string, maxLength?: number) => string;
}

const IndexLatestContent: React.FC<IndexLatestContentProps> = ({
  getRecentLogs,
  formatNewsDate,
  getExcerpt
}) => {
  return (
    <div className="space-y-8">
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
    </div>
  );
};

export default IndexLatestContent;
