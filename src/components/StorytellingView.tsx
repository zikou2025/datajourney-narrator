
import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { LogEntry } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronRight, ChevronLeft, PlayCircle, PauseCircle, Map as MapIcon, CalendarDays, Clock, FileText, Tag, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import TransitionLayout from './TransitionLayout';

interface StorytellingViewProps {
  logs: LogEntry[];
}

const COLORS = ['#4f46e5', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#ef4444', '#64748b'];
const STATUS_COLORS = {
  completed: '#10b981',
  'in-progress': '#3b82f6',
  planned: '#f59e0b',
  delayed: '#ef4444',
  cancelled: '#64748b'
};

const StorytellingView: React.FC<StorytellingViewProps> = ({ logs }) => {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Group logs by location and sort chronologically
  const storySegments = React.useMemo(() => {
    if (!logs.length) return [];
    
    // Sort by timestamp
    const sortedLogs = [...logs].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // Group logs by episode if available, otherwise by location
    const episodeGroups = new Map<string, LogEntry[]>();
    sortedLogs.forEach(log => {
      const key = log.episodeId || log.location;
      if (!episodeGroups.has(key)) {
        episodeGroups.set(key, []);
      }
      episodeGroups.get(key)?.push(log);
    });
    
    // Convert map to array of story segments
    return Array.from(episodeGroups.entries()).map(([key, segmentLogs]) => {
      const firstLog = segmentLogs[0];
      const lastLog = segmentLogs[segmentLogs.length - 1];
      const timeSpan = differenceInDays(
        new Date(lastLog.timestamp),
        new Date(firstLog.timestamp)
      );
      
      return {
        title: firstLog.episodeId || `Activities at ${firstLog.location}`,
        location: firstLog.location,
        start: firstLog.timestamp,
        end: lastLog.timestamp,
        timeSpan: timeSpan <= 0 ? "Same day" : `${timeSpan} days`,
        logs: segmentLogs,
        coordinates: firstLog.coordinates,
        summary: generateStorySummary(segmentLogs),
      };
    }).sort((a, b) => 
      new Date(a.start).getTime() - new Date(b.start).getTime()
    );
  }, [logs]);

  // Generate a concise summary of the log group
  const generateStorySummary = (logs: LogEntry[]) => {
    const categories = new Set(logs.map(log => log.activityCategory));
    const categoryText = Array.from(categories).join(", ");
    
    const statusCounts = logs.reduce((acc, log) => {
      acc[log.status] = (acc[log.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const primaryStatus = Object.entries(statusCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([status]) => status)[0];
    
    return `${logs.length} activities involving ${categoryText}. Mostly ${primaryStatus}.`;
  };
  
  // Auto-advance story
  useEffect(() => {
    if (isPlaying && storySegments.length > 0) {
      timerRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setCurrentStoryIndex(idx => (idx + 1) % storySegments.length);
            return 0;
          }
          return prev + 0.5;
        });
      }, 50);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, storySegments.length]);
  
  const navigateStory = (direction: 'next' | 'prev') => {
    if (direction === 'next') {
      setCurrentStoryIndex(idx => (idx + 1) % storySegments.length);
    } else {
      setCurrentStoryIndex(idx => (idx - 1 + storySegments.length) % storySegments.length);
    }
    setProgress(0);
  };
  
  if (!logs.length) {
    return (
      <TransitionLayout animation="fade" className="w-full p-4">
        <div className="flex flex-col items-center justify-center h-[70vh] text-center">
          <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Stories to Tell Yet</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Add activity logs to start building compelling data-driven stories about your operations.
          </p>
          <Button variant="outline" size="lg" className="gap-2">
            <PlayCircle className="h-5 w-5" />
            Add Your First Log
          </Button>
        </div>
      </TransitionLayout>
    );
  }
  
  // Current story segment being displayed
  const currentStory = storySegments[currentStoryIndex];
  const currentLogs = currentStory?.logs || [];
  
  // Insights derived from current story segment
  const insights = React.useMemo(() => {
    if (!currentLogs.length) return { categories: [], statuses: [] };
    
    // Category distribution
    const categoryCount = currentLogs.reduce((acc, log) => {
      acc[log.activityCategory] = (acc[log.activityCategory] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const categories = Object.entries(categoryCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    
    // Status distribution
    const statusCount = currentLogs.reduce((acc, log) => {
      acc[log.status] = (acc[log.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const statuses = Object.entries(statusCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    
    // Generate timeline data for line chart
    const timelineData = currentLogs
      .reduce((acc, log) => {
        const date = format(parseISO(log.timestamp), 'MM/dd');
        if (!acc[date]) acc[date] = { date, count: 0 };
        acc[date].count += 1;
        return acc;
      }, {} as Record<string, { date: string, count: number }>);
    
    const timeline = Object.values(timelineData).sort((a, b) => 
      a.date.localeCompare(b.date)
    );
    
    return { categories, statuses, timeline };
  }, [currentLogs]);
  
  // Generate story chapters (key events)
  const storyChapters = React.useMemo(() => {
    if (!currentLogs.length) return [];
    
    // Find important logs based on status
    const importantStatuses = ['delayed', 'cancelled', 'completed'];
    const keyLogs = currentLogs.filter(log => importantStatuses.includes(log.status))
      .slice(0, 3);
    
    // Ensure we have at least some chapters
    if (keyLogs.length < 2) {
      keyLogs.push(...currentLogs
        .filter(log => !keyLogs.includes(log))
        .slice(0, 3 - keyLogs.length));
    }
    
    return keyLogs.map(log => ({
      title: log.activityType,
      timestamp: log.timestamp,
      status: log.status,
      notes: log.notes
    }));
  }, [currentLogs]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <TransitionLayout animation="fade" className="w-full">
      <div className="relative">
        {/* Controls */}
        <div className="sticky top-16 z-10 bg-background/80 backdrop-blur-md border-b py-2">
          <div className="container px-4 mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateStory('prev')}
                disabled={storySegments.length <= 1}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    Story {currentStoryIndex + 1} of {storySegments.length}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 h-7"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? (
                      <>
                        <PauseCircle className="h-3.5 w-3.5" />
                        Pause
                      </>
                    ) : (
                      <>
                        <PlayCircle className="h-3.5 w-3.5" />
                        Auto-play
                      </>
                    )}
                  </Button>
                </div>
                <Progress value={progress} className="h-1 mt-2" />
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateStory('next')}
                disabled={storySegments.length <= 1}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Story Content */}
        <div className="container mx-auto py-8 px-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStoryIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              {/* Story Header */}
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="mb-12 text-center"
              >
                <motion.h1 
                  variants={itemVariants}
                  className="text-3xl sm:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600"
                >
                  {currentStory.title}
                </motion.h1>
                <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-4 mb-6">
                  <Badge variant="secondary" className="text-sm flex items-center gap-1.5 px-3 py-1">
                    <MapIcon className="h-3.5 w-3.5" />
                    {currentStory.location}
                  </Badge>
                  <Badge variant="secondary" className="text-sm flex items-center gap-1.5 px-3 py-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {format(new Date(currentStory.start), 'MMM d, yyyy')}
                  </Badge>
                  <Badge variant="secondary" className="text-sm flex items-center gap-1.5 px-3 py-1">
                    <Clock className="h-3.5 w-3.5" />
                    {currentStory.timeSpan}
                  </Badge>
                </motion.div>
                <motion.p variants={itemVariants} className="text-xl text-muted-foreground max-w-3xl mx-auto">
                  {currentStory.summary}
                </motion.p>
              </motion.div>
              
              {/* Key Insights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {/* Timeline Trend */}
                <Card className="md:col-span-3">
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-medium mb-4">Activity Timeline</h3>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={insights.timeline}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Line 
                            type="monotone" 
                            dataKey="count" 
                            name="Activities"
                            stroke="#4f46e5" 
                            strokeWidth={2}
                            activeDot={{ r: 8 }} 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Category Distribution */}
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Categories
                    </h3>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={insights.categories}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {insights.categories.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value} activities`, 'Count']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Status Distribution */}
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Status Distribution
                    </h3>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          layout="vertical"
                          data={insights.statuses}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.2} />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={100} />
                          <Tooltip formatter={(value) => [`${value} activities`, 'Count']} />
                          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                            {insights.statuses.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] || COLORS[index % COLORS.length]} 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Key Metrics */}
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-medium mb-4">Key Metrics</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Total Activities</span>
                        <span className="font-medium text-xl">{currentLogs.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Unique Activity Types</span>
                        <span className="font-medium text-xl">
                          {new Set(currentLogs.map(log => log.activityType)).size}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Completion Rate</span>
                        <span className="font-medium text-xl">
                          {Math.round((currentLogs.filter(log => log.status === 'completed').length / currentLogs.length) * 100)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Key Events/Chapters */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="mb-12"
              >
                <motion.h2 
                  variants={itemVariants} 
                  className="text-2xl font-bold mb-6 text-center"
                >
                  Key Moments
                </motion.h2>
                <div className="space-y-8">
                  {storyChapters.map((chapter, idx) => {
                    const isDelayed = chapter.status === 'delayed';
                    const isCancelled = chapter.status === 'cancelled';
                    const isCompleted = chapter.status === 'completed';
                    
                    let Icon = CheckCircle2;
                    if (isDelayed) Icon = AlertTriangle;
                    if (isCancelled) Icon = XCircle;
                    
                    return (
                      <ChapterCard 
                        key={idx}
                        index={idx + 1}
                        title={chapter.title}
                        timestamp={chapter.timestamp}
                        status={chapter.status}
                        notes={chapter.notes}
                        Icon={Icon}
                        isDelayed={isDelayed}
                        isCancelled={isCancelled}
                        isCompleted={isCompleted}
                      />
                    );
                  })}
                </div>
              </motion.div>
              
              {/* Log Details */}
              <div className="mt-12 pt-8 border-t">
                <h2 className="text-xl font-bold mb-6">All Activities</h2>
                <div className="space-y-2">
                  {currentLogs.map((log, idx) => (
                    <LogItem key={idx} log={log} />
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </TransitionLayout>
  );
};

interface ChapterCardProps {
  index: number;
  title: string;
  timestamp: string;
  status: string;
  notes: string;
  Icon: React.FC<{ className?: string }>;
  isDelayed: boolean;
  isCancelled: boolean;
  isCompleted: boolean;
}

const ChapterCard: React.FC<ChapterCardProps> = ({
  index, title, timestamp, status, notes, Icon, isDelayed, isCancelled, isCompleted
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  
  return (
    <motion.div 
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={cn(
        "relative pl-12 pb-12",
        index !== 3 && "border-l-2 border-muted ml-6"
      )}
    >
      <div className="absolute top-0 -left-6 flex items-center justify-center w-12 h-12 rounded-full bg-background border-2 shadow-md">
        <span className="text-lg font-bold">{index}</span>
      </div>
      <Card className={cn(
        "overflow-hidden",
        isDelayed && "border-amber-400/40",
        isCancelled && "border-red-400/40",
        isCompleted && "border-emerald-400/40"
      )}>
        <CardContent className="p-0">
          <div className={cn(
            "p-4 border-l-4",
            isDelayed && "border-amber-400 bg-amber-50/10",
            isCancelled && "border-red-400 bg-red-50/10",
            isCompleted && "border-emerald-400 bg-emerald-50/10",
            !isDelayed && !isCancelled && !isCompleted && "border-gray-300"
          )}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-lg">{title}</h3>
              <Badge
                variant={
                  isDelayed ? "outline" : 
                  isCancelled ? "destructive" : 
                  isCompleted ? "default" : "secondary"
                }
                className={cn(
                  "flex items-center gap-1",
                  isDelayed && "border-amber-400 text-amber-600",
                  isCancelled && "bg-red-500"
                )}
              >
                <Icon className="h-3 w-3" />
                {status}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground mb-2">
              {format(new Date(timestamp), 'MMMM d, yyyy • h:mm a')}
            </div>
            <p className="text-sm">{notes}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

interface LogItemProps {
  log: LogEntry;
}

const LogItem: React.FC<LogItemProps> = ({ log }) => {
  return (
    <div className="flex items-center p-2 hover:bg-muted/50 rounded-md transition-colors">
      <div className="w-24 flex-shrink-0 text-muted-foreground text-sm">
        {format(new Date(log.timestamp), 'MM/dd/yyyy')}
      </div>
      <div className="flex-1 ml-4">
        {log.activityType}
      </div>
      <div className="w-28 flex-shrink-0">
        <Badge
          variant="outline"
          className={cn(
            "font-normal",
            log.status === 'completed' && "border-emerald-400 text-emerald-600",
            log.status === 'in-progress' && "border-blue-400 text-blue-600",
            log.status === 'planned' && "border-amber-400 text-amber-600",
            log.status === 'delayed' && "border-orange-400 text-orange-600",
            log.status === 'cancelled' && "border-red-400 text-red-600"
          )}
        >
          {log.status}
        </Badge>
      </div>
      <div className="w-32 flex-shrink-0 text-sm text-muted-foreground truncate">
        {log.location}
      </div>
    </div>
  );
};

export default StorytellingView;
