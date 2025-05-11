
import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LogEntry } from '@/lib/types';
import { Calendar, ChevronRight, FileText, CalendarDays, MapPin } from 'lucide-react';

interface IndexFeaturedContentProps {
  featuredArticle: LogEntry | null;
  logs: LogEntry[];
  categories: {[key: string]: number};
  formatNewsDate: (dateString: string) => string;
  getExcerpt: (text: string, maxLength?: number) => string;
}

const IndexFeaturedContent: React.FC<IndexFeaturedContentProps> = ({
  featuredArticle,
  logs,
  categories,
  formatNewsDate,
  getExcerpt
}) => {
  return (
    <div className="space-y-8">
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
                    {`${featuredArticle.activityType} Progress at ${featuredArticle.location}`}
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
    </div>
  );
};

export default IndexFeaturedContent;
