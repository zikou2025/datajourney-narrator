
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TransitionLayout from './TransitionLayout';
import { LogEntry } from '@/lib/types';
import { Calendar, Clock, MapPin, Tag, FileText, Filter, ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';

interface LogTimelineProps {
  logs: LogEntry[];
  onSelectLog: (log: LogEntry) => void;
  className?: string;
}

// Map status to style configurations for better maintainability
const STATUS_STYLES = {
  'completed': 'bg-green-100 text-green-800',
  'in-progress': 'bg-blue-100 text-blue-800',
  'planned': 'bg-purple-100 text-purple-800',
  'delayed': 'bg-yellow-100 text-yellow-800',
  'cancelled': 'bg-red-100 text-red-800',
  'default': 'bg-gray-100 text-gray-800'
};

const LogTimeline: React.FC<LogTimelineProps> = ({ logs, onSelectLog, className }) => {
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  // Toggle date expansion
  const toggleDateExpansion = (date: string) => {
    const newSet = new Set(expandedDates);
    if (newSet.has(date)) {
      newSet.delete(date);
    } else {
      newSet.add(date);
    }
    setExpandedDates(newSet);
  };

  // Memoize sorted and grouped logs to avoid recalculation on re-renders
  const { logsByDate, dates, categories, locations } = useMemo(() => {
    // Sort logs by timestamp (newest first or oldest first)
    const sortedLogs = [...logs].sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return sortDirection === 'desc' ? timeB - timeA : timeA - timeB;
    });
    
    // Apply category filter if active
    const filteredLogs = activeFilter 
      ? sortedLogs.filter(log => 
          log.activityCategory === activeFilter ||
          log.location === activeFilter
        )
      : sortedLogs;
    
    // Group logs by date
    const grouped = filteredLogs.reduce((groups, log) => {
      const date = new Date(log.timestamp).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(log);
      return groups;
    }, {} as Record<string, LogEntry[]>);
    
    // Extract all unique categories and locations for filtering
    const uniqueCategories = Array.from(new Set(logs.map(log => log.activityCategory)));
    const uniqueLocations = Array.from(new Set(logs.map(log => log.location)));
    
    return { 
      logsByDate: grouped, 
      dates: Object.keys(grouped),
      categories: uniqueCategories,
      locations: uniqueLocations
    };
  }, [logs, sortDirection, activeFilter]);
  
  // Animation variants for better consistency
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1 
      }
    }
  };
  
  const dateGroupVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.05 
      }
    }
  };
  
  const logItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.4
      }
    }
  };
  
  // Helper function to format time
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const isEmpty = dates.length === 0;

  // Toggle sort direction
  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
  };
  
  return (
    <TransitionLayout animation="fade" className={cn("w-full", className)}>
      {/* Timeline Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 glass p-4 rounded-xl">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={toggleSortDirection}
            className="flex items-center gap-1"
          >
            <ArrowUpDown className="w-4 h-4 mr-1" />
            {sortDirection === 'desc' ? 'Newest First' : 'Oldest First'}
          </Button>
          
          <Badge variant="outline" className="text-xs">
            {logs.length} events
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Filter className="w-4 h-4 mr-1" />
                {activeFilter ? `Filter: ${activeFilter}` : 'Filter Timeline'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem 
                onClick={() => setActiveFilter(null)}
                className={!activeFilter ? "bg-accent/50" : ""}
              >
                All Events
              </DropdownMenuItem>
              
              {categories.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Categories</div>
                  {categories.map(category => (
                    <DropdownMenuItem 
                      key={`cat-${category}`}
                      onClick={() => setActiveFilter(category)}
                      className={activeFilter === category ? "bg-accent/50" : ""}
                    >
                      {category}
                    </DropdownMenuItem>
                  ))}
                </>
              )}
              
              {locations.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Locations</div>
                  {locations.map(location => (
                    <DropdownMenuItem 
                      key={`loc-${location}`}
                      onClick={() => setActiveFilter(location)}
                      className={activeFilter === location ? "bg-accent/50" : ""}
                    >
                      {location}
                    </DropdownMenuItem>
                  ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <p className="text-muted-foreground">No activity logs available</p>
        </div>
      ) : (
        <motion.div 
          className="relative w-full pb-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Vertical timeline line */}
          <div 
            className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2 -z-10" 
            aria-hidden="true"
          />
          
          <AnimatePresence>
            {dates.map((date, dateIndex) => (
              <motion.div 
                key={date} 
                className="mb-8"
                variants={dateGroupVariants}
                exit={{ opacity: 0 }}
              >
                <div className="flex justify-center mb-6">
                  <button
                    onClick={() => toggleDateExpansion(date)} 
                    className="glass px-4 py-2 rounded-full text-sm font-medium inline-flex items-center hover:shadow-md transition-all"
                    aria-label={`Events from ${date}`}
                  >
                    <Calendar className="w-4 h-4 mr-2 text-primary/70" aria-hidden="true" />
                    {date}
                    {expandedDates.has(date) ? (
                      <ChevronUp className="ml-2 w-4 h-4" />
                    ) : (
                      <ChevronDown className="ml-2 w-4 h-4" />
                    )}
                  </button>
                </div>
                
                {(expandedDates.has(date) || dateIndex === 0) && logsByDate[date].map((log, logIndex) => (
                  <motion.div
                    key={log.id}
                    variants={logItemVariants}
                    className="relative mb-8"
                    layout
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Time indicator (alternating sides on larger screens) */}
                      <div className={cn(
                        "flex items-center", 
                        logIndex % 2 === 0 ? "md:justify-end" : "md:order-2"
                      )}>
                        <div className="glass-darker text-sm px-3 py-1 rounded-full inline-flex items-center">
                          <Clock className="w-3 h-3 mr-1.5 text-primary/70" aria-hidden="true" />
                          <time dateTime={new Date(log.timestamp).toISOString()}>
                            {formatTime(log.timestamp)}
                          </time>
                        </div>
                      </div>
                      
                      {/* Timeline dot */}
                      <div 
                        className="absolute left-0 md:left-1/2 top-0 w-4 h-4 rounded-full bg-primary -translate-x-1/2 translate-y-1/2 border-2 border-white" 
                        aria-hidden="true"
                      />
                      
                      {/* Log card (alternating sides on larger screens) */}
                      <div className={cn(
                        "relative", 
                        logIndex % 2 === 0 ? "md:order-2" : ""
                      )}>
                        <button 
                          onClick={() => onSelectLog(log)}
                          className="glass w-full text-left p-4 rounded-xl hover:shadow-md transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                          aria-label={`View details of ${log.activityType} activity`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium">{log.activityType}</h4>
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded-full",
                              STATUS_STYLES[log.status as keyof typeof STATUS_STYLES] || STATUS_STYLES.default
                            )}>
                              {log.status}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-1 mb-2">
                            {log.location && (
                              <div className="flex items-center text-sm text-muted-foreground">
                                <MapPin className="w-3 h-3 mr-1.5 flex-shrink-0" aria-hidden="true" />
                                <span>{log.location}</span>
                              </div>
                            )}
                            {log.activityCategory && (
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Tag className="w-3 h-3 mr-1.5 flex-shrink-0" aria-hidden="true" />
                                <span>{log.activityCategory}</span>
                              </div>
                            )}
                          </div>
                          
                          {log.notes && (
                            <div className="flex items-start text-sm mt-2">
                              <FileText className="w-3 h-3 mr-1.5 mt-1 flex-shrink-0 text-primary/70" aria-hidden="true" />
                              <span className="line-clamp-2">{log.notes}</span>
                            </div>
                          )}
                          
                          <div className="text-xs text-right mt-2 text-muted-foreground opacity-70">
                            {log.id}
                          </div>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {!expandedDates.has(date) && dateIndex !== 0 && (
                  <div className="flex justify-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => toggleDateExpansion(date)}
                      className="text-xs text-muted-foreground"
                    >
                      Show {logsByDate[date].length} events from this date
                    </Button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </TransitionLayout>
  );
};

export default React.memo(LogTimeline);
