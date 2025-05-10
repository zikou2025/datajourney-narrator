
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Calendar, MapPin, Tag, Users, ChevronRight, AlertTriangle, CheckCircle2, XCircle, Clock, TrendingUp } from 'lucide-react';
import { LogEntry } from '@/lib/types';
import { format, isSameDay, subDays } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface LogSearchProps {
  isOpen: boolean;
  onClose: () => void;
  logs: LogEntry[];
  onSelectLog: (log: LogEntry) => void;
}

const COLORS = ['#4f46e5', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#ef4444', '#64748b'];
const STATUS_COLORS = {
  completed: '#10b981',
  'in-progress': '#3b82f6',
  planned: '#f59e0b',
  delayed: '#ef4444',
  cancelled: '#64748b'
};

const LogSearch: React.FC<LogSearchProps> = ({
  isOpen,
  onClose,
  logs,
  onSelectLog,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<LogEntry[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'story' | 'analytics'>('list');
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('all');

  // Store search terms in local storage
  useEffect(() => {
    const storedHistory = localStorage.getItem('searchHistory');
    if (storedHistory) {
      setSearchHistory(JSON.parse(storedHistory));
    }
  }, []);

  // Save search history to local storage
  const addToSearchHistory = (term: string) => {
    if (!term.trim()) return;
    
    setSearchHistory(prevHistory => {
      const newHistory = [
        term, 
        ...prevHistory.filter(item => item !== term)
      ].slice(0, 10); // Keep only the latest 10 searches
      
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  // Focus input when search opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    addToSearchHistory(term);
  };

  // Filter logs based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setResults([]);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = logs.filter(log => 
      log.id.toLowerCase().includes(term) ||
      log.location.toLowerCase().includes(term) ||
      log.activityCategory.toLowerCase().includes(term) ||
      log.activityType.toLowerCase().includes(term) ||
      log.equipment.toLowerCase().includes(term) ||
      log.personnel.toLowerCase().includes(term) ||
      log.notes.toLowerCase().includes(term) ||
      log.referenceId.toLowerCase().includes(term)
    );

    setResults(filtered);
  }, [searchTerm, logs]);

  // Filter results by tab
  const filteredResults = useMemo(() => {
    if (activeTab === 'all') return results;
    
    const now = new Date();
    
    switch(activeTab) {
      case 'today':
        return results.filter(log => isSameDay(new Date(log.timestamp), now));
      case 'yesterday':
        return results.filter(log => isSameDay(new Date(log.timestamp), subDays(now, 1)));
      case 'week':
        const weekAgo = subDays(now, 7);
        return results.filter(log => new Date(log.timestamp) >= weekAgo);
      default:
        return results;
    }
  }, [results, activeTab]);

  // Generate insights from search results
  const searchInsights = useMemo(() => {
    if (!results.length) return null;

    // Categories distribution
    const categoryCount = results.reduce((acc, log) => {
      acc[log.activityCategory] = (acc[log.activityCategory] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const categoryData = Object.entries(categoryCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    
    // Status distribution
    const statusCount = results.reduce((acc, log) => {
      acc[log.status] = (acc[log.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const statusData = Object.entries(statusCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    
    // Locations
    const locations = [...new Set(results.map(log => log.location))];
    
    // Activity Types
    const activityTypes = [...new Set(results.map(log => log.activityType))];
    
    // Date range
    const dates = results.map(log => new Date(log.timestamp));
    const startDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const endDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    // Time distribution
    const dateGroups = results.reduce((acc, log) => {
      const dateStr = format(new Date(log.timestamp), 'yyyy-MM-dd');
      acc[dateStr] = (acc[dateStr] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const timeSeriesData = Object.entries(dateGroups)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    return {
      totalResults: results.length,
      categories: categoryData,
      statuses: statusData,
      locations,
      activityTypes,
      startDate,
      endDate,
      timeSeriesData
    };
  }, [results]);

  // Story summary generator
  const generateSearchStory = () => {
    if (!searchInsights) return "";
    
    const { totalResults, categories, statuses, locations, startDate, endDate } = searchInsights;
    
    const topCategory = categories.length ? categories[0].name : "various categories";
    const topStatus = statuses.length ? statuses[0].name : "various statuses";
    const locationText = locations.length <= 3 
      ? locations.join(", ") 
      : `${locations.slice(0, 2).join(", ")} and ${locations.length - 2} other locations`;
    
    return `Found ${totalResults} activities primarily in ${topCategory} category with status mostly "${topStatus}" across ${locationText}. These activities occurred from ${format(startDate, 'MMM d, yyyy')} to ${format(endDate, 'MMM d, yyyy')}.`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/20 backdrop-blur-sm"
        >
          <motion.div
            ref={searchRef}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-3xl glass border shadow-lg rounded-xl overflow-hidden"
          >
            <div className="flex items-center border-b p-4">
              <Search className="w-5 h-5 text-muted-foreground mr-3" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(searchTerm);
                  }
                }}
                placeholder="Search logs by ID, location, activity..."
                className="flex-1 bg-transparent outline-none text-foreground"
              />
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => handleSearch(searchTerm)}
                className="mr-1"
              >
                <Search className="h-4 w-4" />
              </Button>
              <button
                onClick={onClose}
                className="ml-1 p-1 rounded-full hover:bg-secondary transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Search history */}
            {searchTerm === '' && searchHistory.length > 0 && (
              <div className="border-b p-2">
                <div className="text-xs text-muted-foreground mb-2 px-2">Recent searches</div>
                <div className="flex flex-wrap gap-2 px-2">
                  {searchHistory.map((term, index) => (
                    <Badge 
                      key={index} 
                      variant="outline" 
                      className="cursor-pointer hover:bg-secondary/50"
                      onClick={() => setSearchTerm(term)}
                    >
                      <Clock className="mr-1 h-3 w-3" />
                      {term}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Search View Toggle */}
            {results.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b px-4 py-2 gap-2">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                  <TabsList className="w-full sm:w-auto">
                    <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                    <TabsTrigger value="today" className="text-xs">Today</TabsTrigger>
                    <TabsTrigger value="yesterday" className="text-xs">Yesterday</TabsTrigger>
                    <TabsTrigger value="week" className="text-xs">This Week</TabsTrigger>
                  </TabsList>
                </Tabs>
                
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium mr-2">
                    {filteredResults.length} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant={viewMode === 'list' ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="h-8 text-xs"
                    >
                      List
                    </Button>
                    <Button 
                      variant={viewMode === 'story' ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setViewMode('story')}
                      className="h-8 text-xs"
                    >
                      Story
                    </Button>
                    <Button 
                      variant={viewMode === 'analytics' ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setViewMode('analytics')}
                      className="h-8 text-xs"
                    >
                      Analytics
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="max-h-[60vh] overflow-y-auto">
              {results.length === 0 && searchTerm.trim() !== '' ? (
                <div className="p-6 text-center">
                  <p className="text-muted-foreground">No results found</p>
                </div>
              ) : viewMode === 'list' ? (
                <AnimatePresence>
                  {filteredResults.map((log, index) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                    >
                      <button
                        onClick={() => {
                          onSelectLog(log);
                          onClose();
                        }}
                        className="w-full text-left p-4 hover:bg-secondary/50 border-b transition-colors"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-medium">{log.activityType}</h4>
                          <span className="text-xs text-muted-foreground">{log.id}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center text-muted-foreground">
                            <Calendar className="w-3 h-3 mr-1" />
                            {format(new Date(log.timestamp), 'MMM d, yyyy')}
                          </div>
                          <div className="flex items-center text-muted-foreground">
                            <MapPin className="w-3 h-3 mr-1" />
                            {log.location}
                          </div>
                          <div className="flex items-center text-muted-foreground">
                            <Tag className="w-3 h-3 mr-1" />
                            {log.activityCategory}
                          </div>
                          <div className="flex items-center text-muted-foreground">
                            <Users className="w-3 h-3 mr-1" />
                            {log.personnel}
                          </div>
                        </div>
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              ) : viewMode === 'story' ? (
                <AnimatePresence>
                  {searchInsights && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                      className="p-4"
                    >
                      <Card className="mb-4 overflow-hidden border-t-4 border-t-primary">
                        <CardContent className="p-4">
                          <h3 className="text-lg font-medium mb-2 text-primary">Search Story</h3>
                          <p className="text-muted-foreground mb-4">{generateSearchStory()}</p>
                          
                          <div className="flex flex-wrap -mx-2">
                            <div className="w-full md:w-1/2 px-2 mb-4">
                              <h4 className="text-sm font-medium mb-2">Activity Categories</h4>
                              <div className="h-[180px]">
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={searchInsights.categories}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={40}
                                      outerRadius={80}
                                      fill="#8884d8"
                                      dataKey="value"
                                      label={({ name }) => name}
                                    >
                                      {searchInsights.categories.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                      ))}
                                    </Pie>
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                            <div className="w-full md:w-1/2 px-2 mb-4">
                              <h4 className="text-sm font-medium mb-2">Status Distribution</h4>
                              <div className="space-y-2">
                                {searchInsights.statuses.map((status, idx) => (
                                  <div key={idx} className="flex items-center">
                                    <div 
                                      className="w-3 h-3 rounded-full mr-2" 
                                      style={{ backgroundColor: STATUS_COLORS[status.name as keyof typeof STATUS_COLORS] || '#64748b' }}
                                    />
                                    <span className="text-sm flex-1">{status.name}</span>
                                    <span className="text-sm font-medium">{status.value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <div className="mt-6">
                        <h3 className="text-lg font-medium mb-4">Highlighted Entries</h3>
                        <div className="space-y-4">
                          {filteredResults.slice(0, 5).map((log, index) => (
                            <SearchStoryCard 
                              key={log.id} 
                              log={log} 
                              index={index} 
                              onClick={() => {
                                onSelectLog(log);
                                onClose();
                              }}
                            />
                          ))}
                          
                          {filteredResults.length > 5 && (
                            <Button 
                              variant="link" 
                              className="w-full mt-2"
                              onClick={() => setViewMode('list')}
                            >
                              View all {filteredResults.length} results <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              ) : (
                <AnimatePresence>
                  {searchInsights && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                      className="p-4"
                    >
                      <Card className="mb-4">
                        <CardContent className="p-4">
                          <h3 className="text-lg font-medium mb-4 flex items-center">
                            <TrendingUp className="w-5 h-5 mr-2" />
                            Activity Trends
                          </h3>
                          
                          {searchInsights.timeSeriesData.length > 1 ? (
                            <div className="h-[200px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={searchInsights.timeSeriesData}>
                                  <XAxis 
                                    dataKey="date" 
                                    tick={{ fontSize: 12 }}
                                    tickFormatter={(date) => format(new Date(date), 'MM/dd')}
                                  />
                                  <YAxis tick={{ fontSize: 12 }} />
                                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                                  <Tooltip
                                    formatter={(value: number) => [`${value} activities`, 'Count']}
                                    labelFormatter={(date) => format(new Date(date), 'MMM d, yyyy')}
                                  />
                                  <Line
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#4f46e5"
                                    strokeWidth={2}
                                    dot={{ r: 4, strokeWidth: 2 }}
                                    activeDot={{ r: 6 }}
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          ) : (
                            <div className="text-center p-4 text-muted-foreground">
                              Not enough time data to generate a trend chart.
                            </div>
                          )}
                        </CardContent>
                      </Card>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <Card>
                          <CardContent className="p-4">
                            <h4 className="text-sm font-medium mb-3">Activity Breakdown</h4>
                            <div className="space-y-2">
                              {searchInsights.categories.slice(0, 5).map((category, idx) => (
                                <div key={idx} className="flex items-center justify-between">
                                  <span className="text-sm truncate max-w-[70%]">{category.name}</span>
                                  <div className="flex items-center">
                                    <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden mr-2">
                                      <div 
                                        className="h-full bg-primary rounded-full" 
                                        style={{ width: `${(category.value / searchInsights.totalResults) * 100}%` }}
                                      />
                                    </div>
                                    <span className="text-xs font-medium w-8 text-right">{category.value}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="p-4">
                            <h4 className="text-sm font-medium mb-3">Top Locations</h4>
                            <div className="space-y-2">
                              {searchInsights.locations.slice(0, 5).map((location, idx) => {
                                const count = filteredResults.filter(log => log.location === location).length;
                                return (
                                  <div key={idx} className="flex items-center justify-between">
                                    <span className="text-sm truncate max-w-[70%]">{location}</span>
                                    <Badge variant="outline">{count}</Badge>
                                  </div>
                                );
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <Button
                        variant="outline"
                        className="w-full mt-2"
                        onClick={() => setViewMode('list')}
                      >
                        View All Results
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface SearchStoryCardProps {
  log: LogEntry;
  index: number;
  onClick: () => void;
}

const SearchStoryCard: React.FC<SearchStoryCardProps> = ({ log, index, onClick }) => {
  const isDelayed = log.status === 'delayed';
  const isCancelled = log.status === 'cancelled';
  const isCompleted = log.status === 'completed';
  
  let Icon = CheckCircle2;
  if (isDelayed) Icon = AlertTriangle;
  if (isCancelled) Icon = XCircle;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card 
        className={cn(
          "overflow-hidden hover:border-primary cursor-pointer transition-colors",
          isDelayed && "border-amber-400/40",
          isCancelled && "border-red-400/40",
          isCompleted && "border-emerald-400/40"
        )}
        onClick={onClick}
      >
        <CardContent className="p-0">
          <div className={cn(
            "p-4 border-l-4",
            isDelayed && "border-amber-400 bg-amber-50/10",
            isCancelled && "border-red-400 bg-red-50/10",
            isCompleted && "border-emerald-400 bg-emerald-50/10",
            !isDelayed && !isCancelled && !isCompleted && "border-gray-300"
          )}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">{log.activityType}</h4>
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
                {log.status}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm mb-2">
              <div className="flex items-center text-muted-foreground">
                <Calendar className="w-3 h-3 mr-1" />
                {format(new Date(log.timestamp), 'MMM d, yyyy')}
              </div>
              <div className="flex items-center text-muted-foreground">
                <MapPin className="w-3 h-3 mr-1" />
                {log.location}
              </div>
              <div className="flex items-center text-muted-foreground">
                <Tag className="w-3 h-3 mr-1" />
                {log.activityCategory}
              </div>
              <div className="flex items-center text-muted-foreground">
                <Users className="w-3 h-3 mr-1" />
                {log.personnel}
              </div>
            </div>
            
            {log.notes && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                {log.notes}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default LogSearch;
