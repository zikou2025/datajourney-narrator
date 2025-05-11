
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Calendar, MapPin, Bookmark, ChevronRight } from 'lucide-react';
import { LogEntry } from '@/lib/types';

interface IndexTrendingContentProps {
  getTrendingLogs: () => LogEntry[];
  logs: LogEntry[];
  formatNewsDate: (dateString: string) => string;
}

const IndexTrendingContent: React.FC<IndexTrendingContentProps> = ({
  getTrendingLogs,
  logs,
  formatNewsDate
}) => {
  const [expandedLogs, setExpandedLogs] = useState<{[key: string]: boolean}>({});
  
  const toggleExpanded = (logId: string) => {
    setExpandedLogs(prev => ({
      ...prev,
      [logId]: !prev[logId]
    }));
  };
  
  return (
    <div className="space-y-8">
      <section className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">Trending Updates</h2>
          </div>
          <Button variant="ghost" size="sm" className="gap-1">
            View All Trending
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {getTrendingLogs().map((log, i) => {
            const isExpanded = expandedLogs[log.id] || false;
            
            return (
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
                    
                    {isExpanded ? (
                      <>
                        <p className="text-muted-foreground mb-4">{log.notes}</p>
                        <Button variant="link" className="p-0 mb-4" onClick={() => toggleExpanded(log.id)}>
                          Show Less
                        </Button>
                      </>
                    ) : (
                      <>
                        <p className="text-muted-foreground mb-4">
                          {log.notes.length > 150 
                            ? `${log.notes.substring(0, 150)}...`
                            : log.notes
                          }
                        </p>
                        {log.notes.length > 150 && (
                          <Button variant="link" className="p-0 mb-4" onClick={() => toggleExpanded(log.id)}>
                            Read More
                          </Button>
                        )}
                      </>
                    )}
                    
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
            );
          })}
        </div>
      </section>
      
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Industry Insights</h2>
          <Button variant="ghost" size="sm" className="gap-1">
            View All Insights
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
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
                    <span>{new Set(logs.map(log => log.location)).size}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Categories</span>
                    <span>{new Set(logs.map(log => log.activityCategory)).size}</span>
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
    </div>
  );
};

export default IndexTrendingContent;
