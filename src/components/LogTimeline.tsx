import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import TransitionLayout from './TransitionLayout';
import { LogEntry } from '@/lib/types';
import { Calendar, Clock, MapPin, Tag, FileText, Filter, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVirtualizer } from '@tanstack/react-virtual';
import { format, isSameDay, parseISO } from 'date-fns';

// Extended types for more functionality
interface LogTimelineProps {
  logs: LogEntry[];
  onSelectLog: (log: LogEntry) => void;
  className?: string;
  showFilters?: boolean;
  emptyStateMessage?: string;
  initialFilter?: TimelineFilters;
  highlightKeywords?: string[];
  onLogVisibilityChange?: (visibleLogIds: string[]) => void;
  virtualized?: boolean;
  maxHeight?: number | string;
}

interface TimelineFilters {
  status?: string[];
  category?: string[];
  searchTerm?: string;
  dateRange?: {
    start?: Date;
    end?: Date;
  };
}

// Rich status configuration
const STATUS_CONFIG = {
  'completed': {
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    icon: '✓',
    priority: 1
  },
  'in-progress': {
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    icon: '→',
    priority: 2
  },
  'planned': {
    className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
    icon: '◇',
    priority: 3
  },
  'delayed': {
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
    icon: '!',
    priority: 4
  },
  'cancelled': {
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
    icon: '✕',
    priority: 5
  },
  'default': {
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
    icon: '•',
    priority: 6
  }
};

/**
 * Highlight text segments that match search terms
 */
const HighlightedText: React.FC<{ text: string; highlight?: string }> = ({ text, highlight }) => {
  if (!highlight || highlight.trim() === '') {
    return <span>{text}</span>;
  }

  const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) => (
        regex.test(part) ? 
          <mark key={i} className="bg-yellow-100 dark:bg-yellow-800 px-0.5 rounded-sm font-medium">{part}</mark> : 
          <span key={i}>{part}</span>
      ))}
    </span>
  );
};

/**
 * Virtualized log timeline component with advanced features
 */
const LogTimeline: React.FC<LogTimelineProps> = ({
  logs,
  onSelectLog,
  className,
  showFilters = false,
  emptyStateMessage = "No activity logs available",
  initialFilter = {},
  highlightKeywords = [],
  onLogVisibilityChange,
  virtualized = true,
  maxHeight = "calc(100vh - 200px)"
}) => {
  // State for filters and UI
  const [filters, setFilters] = useState<TimelineFilters>(initialFilter);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [visibleLogIds, setVisibleLogIds] = useState<string[]>([]);
  const prefersReducedMotion = useReducedMotion();
  
  // References
  const timelineRef = useRef<HTMLDivElement>(null);
  const scrollToDateRef = useRef<Date | null>(null);
  
  // Extract all available categories for filters
  const availableCategories = useMemo(() => 
    Array.from(new Set(logs.map(log => log.activityCategory).filter(Boolean))),
    [logs]
  );
  
  // Filter logs based on criteria
  const filteredLogs = useMemo(() => {
    let result = [...logs];
    
    if (filters.status?.length) {
      result = result.filter(log => filters.status?.includes(log.status));
    }
    
    if (filters.category?.length) {
      result = result.filter(log => filters.category?.includes(log.activityCategory));
    }
    
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      result = result.filter(log => 
        log.activityType.toLowerCase().includes(searchLower) ||
        (log.notes && log.notes.toLowerCase().includes(searchLower)) ||
        (log.location && log.location.toLowerCase().includes(searchLower)) ||
        (log.activityCategory && log.activityCategory.toLowerCase().includes(searchLower))
      );
    }
    
    if (filters.dateRange?.start) {
      result = result.filter(log => new Date(log.timestamp) >= (filters.dateRange?.start || new Date(0)));
    }
    
    if (filters.dateRange?.end) {
      const endDate = filters.dateRange?.end;
      if (endDate) {
        // Set time to end of day for inclusive filtering
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        result = result.filter(log => new Date(log.timestamp) <= endOfDay);
      }
    }
    
    return result;
  }, [logs, filters]);
  
  // Group and prepare logs
  const { logsByDate, dates, allLogsByIndex } = useMemo(() => {
    // Sort logs by timestamp (newest first)
    const sortedLogs = [...filteredLogs].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    // Group logs by date
    const grouped = sortedLogs.reduce((groups, log) => {
      const date = format(new Date(log.timestamp), 'MMMM d, yyyy');
      
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(log);
      return groups;
    }, {} as Record<string, LogEntry[]>);
    
    // Create a flat array for virtualization
    const allFlatLogs: Array<{type: 'date'|'log', date?: string, log?: LogEntry, index: number}> = [];
    let currentIndex = 0;
    
    Object.entries(grouped).forEach(([date, logsForDate]) => {
      // Add date header
      allFlatLogs.push({
        type: 'date',
        date,
        index: currentIndex++
      });
      
      // Add logs for this date
      logsForDate.forEach(log => {
        allFlatLogs.push({
          type: 'log',
          log,
          date,
          index: currentIndex++
        });
      });
    });
    
    return { 
      logsByDate: grouped, 
      dates: Object.keys(grouped),
      allLogsByIndex: allFlatLogs
    };
  }, [filteredLogs]);
  
  // Setup virtualization for performance with large lists
  const rowVirtualizer = useVirtualizer({
    count: allLogsByIndex.length,
    getScrollElement: () => timelineRef.current,
    estimateSize: useCallback((index) => {
      const item = allLogsByIndex[index];
      return item?.type === 'date' ? 80 : 160; // Estimated heights
    }, [allLogsByIndex]),
    overscan: 10,
  });
  
  // Animation variants based on user preference
  const animations = useMemo(() => ({
    container: prefersReducedMotion ? {} : {
      hidden: { opacity: 0 },
      visible: { 
        opacity: 1,
        transition: { staggerChildren: 0.05 }
      }
    },
    
    dateGroup: prefersReducedMotion ? {} : {
      hidden: { opacity: 0 },
      visible: { 
        opacity: 1,
        transition: { staggerChildren: 0.03 }
      }
    },
    
    item: prefersReducedMotion ? {} : {
      hidden: { opacity: 0, y: 10 },
      visible: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.3 }
      }
    }
  }), [prefersReducedMotion]);
  
  // Handle filter changes
  const updateFilter = useCallback((newFilter: Partial<TimelineFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilter
    }));
  }, []);
  
  // Track visible logs for external components
  useEffect(() => {
    if (onLogVisibilityChange) {
      onLogVisibilityChange(visibleLogIds);
    }
  }, [visibleLogIds, onLogVisibilityChange]);
  
  // Handle scroll to specific date
  const scrollToDate = useCallback((targetDate: Date) => {
    if (!timelineRef.current) return;
    
    const dateString = format(targetDate, 'MMMM d, yyyy');
    const targetIndex = allLogsByIndex.findIndex(
      item => item.type === 'date' && item.date === dateString
    );
    
    if (targetIndex !== -1) {
      rowVirtualizer.scrollToIndex(targetIndex, { align: 'start' });
    }
  }, [allLogsByIndex, rowVirtualizer]);
  
  // Expose scrollToDate method to parent via ref
  React.useImperativeHandle(
    { current: { scrollToDate } } as React.RefObject<{ scrollToDate: (date: Date) => void }>,
    () => ({ scrollToDate }),
    [scrollToDate]
  );
  
  // Handle log observation for animation and tracking
  const observeLog = useCallback((logId: string, isVisible: boolean) => {
    setVisibleLogIds(prev => {
      if (isVisible && !prev.includes(logId)) {
        return [...prev, logId];
      } else if (!isVisible && prev.includes(logId)) {
        return prev.filter(id => id !== logId);
      }
      return prev;
    });
  }, []);
  
  // Format time with consistent method
  const formatTime = useCallback((timestamp: string) => {
    return format(parseISO(timestamp), 'h:mm a');
  }, []);
  
  // Get status style with fallback
  const getStatusStyle = useCallback((status: string) => {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.default;
  }, []);
  
  // Log card component with visibility tracking
  const LogCard = useCallback(({ log, isOdd, dateString }: { log: LogEntry, isOdd: boolean, dateString: string }) => {
    const { ref, inView } = useInView({
      threshold: 0.3,
      triggerOnce: false,
    });
    
    useEffect(() => {
      observeLog(log.id, inView);
    }, [inView, log.id]);
  
    const statusConfig = getStatusStyle(log.status);
    const searchTerm = filters.searchTerm || '';
    
    return (
      <motion.div
        ref={ref}
        variants={animations.item}
        className="relative mb-6 md:mb-8"
        layout={!prefersReducedMotion}
        data-date={dateString}
        data-log-id={log.id}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Time indicator (alternating sides on larger screens) */}
          <div className={cn(
            "flex items-center", 
            isOdd ? "md:justify-end" : "md:order-2"
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
            className={cn(
              "absolute left-0 md:left-1/2 top-0 w-4 h-4 rounded-full -translate-x-1/2 translate-y-1/2 z-10",
              "border-2 border-white dark:border-gray-800 flex items-center justify-center",
              "before:content-[''] before:absolute before:w-6 before:h-6 before:bg-white/20 before:dark:bg-white/5 before:rounded-full before:shadow-sm"
            )}
            style={{ backgroundColor: log.status === 'completed' ? 'var(--green-500)' : 'var(--primary)' }}
            aria-hidden="true"
          >
            <span className="text-[8px] text-white font-bold">{statusConfig.icon}</span>
          </div>
          
          {/* Log card (alternating sides on larger screens) */}
          <div className={cn(
            "relative", 
            isOdd ? "md:order-2" : ""
          )}>
            <button 
              onClick={() => onSelectLog(log)}
              className={cn(
                "glass w-full text-left p-4 rounded-xl",
                "hover:shadow-md active:shadow-inner transition-all duration-200",
                "focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
                "border border-transparent hover:border-primary/10"
              )}
              aria-label={`View details of ${log.activityType} activity`}
            >
              <div className="flex justify-between items-start mb-2 gap-2">
                <h4 className="font-medium">
                  <HighlightedText text={log.activityType} highlight={searchTerm} />
                </h4>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full flex items-center",
                  statusConfig.className
                )}>
                  <span className="mr-1">{statusConfig.icon}</span>
                  {log.status}
                </span>
              </div>
              
              <div className="grid grid-cols-1 gap-1 mb-2">
                {log.location && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="w-3 h-3 mr-1.5 flex-shrink-0" aria-hidden="true" />
                    <HighlightedText text={log.location} highlight={searchTerm} />
                  </div>
                )}
                {log.activityCategory && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Tag className="w-3 h-3 mr-1.5 flex-shrink-0" aria-hidden="true" />
                    <HighlightedText text={log.activityCategory} highlight={searchTerm} />
                  </div>
                )}
              </div>
              
              {log.notes && (
                <div className="flex items-start text-sm mt-2">
                  <FileText className="w-3 h-3 mr-1.5 mt-1 flex-shrink-0 text-primary/70" aria-hidden="true" />
                  <span className="line-clamp-2">
                    <HighlightedText text={log.notes} highlight={searchTerm} />
                  </span>
                </div>
              )}
              
              <div className="text-xs text-right mt-2 text-muted-foreground opacity-70">
                {log.id}
              </div>
            </button>
          </div>
        </div>
      </motion.div>
    );
  }, [animations.item, filters.searchTerm, formatTime, getStatusStyle, observeLog, onSelectLog, prefersReducedMotion]);
  
  // Date header component
  const DateHeader = useCallback(({ date }: { date: string }) => (
    <div className="flex justify-center mb-6 sticky top-0 z-10 py-2">
      <span 
        className="glass px-4 py-2 rounded-full text-sm font-medium inline-flex items-center shadow-sm backdrop-blur-sm"
        aria-label={`Events from ${date}`}
      >
        <Calendar className="w-4 h-4 mr-2 text-primary/70" aria-hidden="true" />
        {date}
      </span>
    </div>
  ), []);
  
  // Empty state with helpful message
  const EmptyState = (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[200px]">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <Calendar className="w-6 h-6 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground mb-2">{emptyStateMessage}</p>
      {Object.keys(filters).some(k => 
        filters[k as keyof TimelineFilters] !== undefined && 
        (Array.isArray(filters[k as keyof TimelineFilters]) 
          ? (filters[k as keyof TimelineFilters] as any[]).length > 0 
          : filters[k as keyof TimelineFilters]
        )
      ) && (
        <button 
          className="text-sm text-primary hover:underline" 
          onClick={() => setFilters({})}
        >
          Clear all filters
        </button>
      )}
    </div>
  );
  
  return (
    <TransitionLayout animation="fade" className={cn("w-full", className)}>
      {/* Filter bar */}
      {showFilters && (
        <div className="mb-6 sticky top-0 z-20 bg-background/80 backdrop-blur-sm pb-2 border-b border-border">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search logs..."
                className="w-full glass pl-9 pr-4 py-2 rounded-lg text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                value={filters.searchTerm || ''}
                onChange={(e) => updateFilter({ searchTerm: e.target.value })}
              />
            </div>
            
            <button
              className="glass px-3 py-1.5 rounded-lg text-sm inline-flex items-center"
              onClick={() => setIsFilterExpanded(!isFilterExpanded)}
              aria-expanded={isFilterExpanded}
            >
              <Filter className="w-4 h-4 mr-1.5" />
              Filters
              <ChevronDown className={cn(
                "w-4 h-4 ml-1 transition-transform",
                isFilterExpanded && "transform rotate-180"
              )} />
            </button>
          </div>
          
          <AnimatePresence>
            {isFilterExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden mt-3"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 glass rounded-lg">
                  {/* Status filter */}
                  <div>
                    <h5 className="text-sm font-medium mb-2">Status</h5>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(STATUS_CONFIG).filter(key => key !== 'default').map(status => (
                        <button
                          key={status}
                          className={cn(
                            "text-xs px-2 py-1 rounded-full border transition-colors",
                            filters.status?.includes(status)
                              ? cn("border-primary/30", STATUS_CONFIG[status as keyof typeof STATUS_CONFIG].className)
                              : "border-border text-muted-foreground hover:border-primary/20"
                          )}
                          onClick={() => {
                            const currentStatuses = filters.status || [];
                            const newStatuses = currentStatuses.includes(status)
                              ? currentStatuses.filter(s => s !== status)
                              : [...currentStatuses, status];
                            
                            updateFilter({ status: newStatuses.length ? newStatuses : undefined });
                          }}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Category filter */}
                  <div>
                    <h5 className="text-sm font-medium mb-2">Category</h5>
                    <div className="flex flex-wrap gap-2">
                      {availableCategories.map(category => (
                        <button
                          key={category}
                          className={cn(
                            "text-xs px-2 py-1 rounded-full border transition-colors",
                            filters.category?.includes(category)
                              ? "bg-primary/10 border-primary/30 text-primary"
                              : "border-border text-muted-foreground hover:border-primary/20"
                          )}
                          onClick={() => {
                            const currentCategories = filters.category || [];
                            const newCategories = currentCategories.includes(category)
                              ? currentCategories.filter(c => c !== category)
                              : [...currentCategories, category];
                            
                            updateFilter({ category: newCategories.length ? newCategories : undefined });
                          }}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Date range filter */}
                  <div>
                    <h5 className="text-sm font-medium mb-2">Date Range</h5>
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="date" 
                        className="text-xs px-2 py-1 glass rounded-md w-full"
                        value={filters.dateRange?.start?.toISOString().split('T')[0] || ''}
                        onChange={(e) => {
                          const newDate = e.target.value ? new Date(e.target.value) : undefined;
                          updateFilter({ 
                            dateRange: { 
                              ...filters.dateRange,
                              start: newDate
                            } 
                          });
                        }}
                        aria-label="Start date"
                      />
                      <input 
                        type="date" 
                        className="text-xs px-2 py-1 glass rounded-md w-full"
                        value={filters.dateRange?.end?.toISOString().split('T')[0] || ''}
                        onChange={(e) => {
                          const newDate = e.target.value ? new Date(e.target.value) : undefined;
                          updateFilter({ 
                            dateRange: { 
                              ...filters.dateRange,
                              end: newDate
                            } 
                          });
                        }}
                        aria-label="End date"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      
      {dates.length === 0 ? (
        EmptyState
      ) : virtualized ? (
        // Virtualized timeline for performance with large datasets
        <div 
          ref={timelineRef} 
          style={{ 
            height: maxHeight,
            overflow: 'auto',
            position: 'relative'
          }}
          className="scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent"
        >
          {/* Vertical timeline line */}
          <div 
            className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2 -z-10" 
            aria-hidden="true"
          />
          
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative'
            }}
          >
            {rowVirtualizer.getVirtualItems().map(virtualRow => {
              const item = allLogsByIndex[virtualRow.index];
              if (!item) return null;
              
              return (
                <div
                  key={item.type === 'date' ? `date-${item.date}` : `log-${item.log?.id}`}
                  data-index={virtualRow.index}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: virtualRow.size,
                    transform: `translateY(${virtualRow.start}px)`
                  }}
                >
                  {item.type === 'date' ? (
                    <DateHeader date={item.date!} />
                  ) : (
                    <LogCard 
                      log={item.log!} 
                      isOdd={virtualRow.index % 2 === 1}
                      dateString={item.date!}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        // Standard timeline for smaller datasets
        <motion.div 
          className="relative w-full pb-10"
          variants={animations.container}
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
                variants={animations.dateGroup}
                exit={{ opacity: 0 }}
              >
                <DateHeader date={date} />
                
                {logsByDate[date].map((log, logIndex) => (
                  <LogCard 
                    key={log.id}
                    log={log} 
                    isOdd={logIndex % 2 === 1}
                    dateString={date}
                  />
                ))}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </TransitionLayout>
  );
};

// Export with memo for performance
export default React.memo(LogTimeline);
