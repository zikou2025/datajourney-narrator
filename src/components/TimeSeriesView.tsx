
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Area, 
  AreaChart, ComposedChart, Scatter
} from 'recharts';
import { LogEntry, TimeSeriesData } from '@/lib/types';
import { 
  BarChart3, CalendarDays, Clock, Filter, LineChart as LineChartIcon, 
  List, PieChart, RefreshCw, SlidersHorizontal, CalendarIcon
} from 'lucide-react';
import { format, subDays, differenceInDays, parseISO, differenceInHours, differenceInMinutes } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import TransitionLayout from './TransitionLayout';

interface TimeSeriesViewProps {
  logs: LogEntry[];
  isLoading?: boolean;
}

type ChartType = 'line' | 'bar' | 'area' | 'combined' | 'scatter';
type GroupBy = 'hour' | 'day' | 'week' | 'month';
type FilterBy = 'all' | 'category' | 'location' | 'status';

const COLORS = [
  '#4f46e5', '#3b82f6', '#a78bfa', '#8b5cf6', '#ec4899', 
  '#f59e0b', '#10b981', '#06b6d4', '#ef4444', '#64748b'
];

const TimeSeriesView: React.FC<TimeSeriesViewProps> = ({ logs, isLoading = false }) => {
  const [chartType, setChartType] = useState<ChartType>('area');
  const [groupBy, setGroupBy] = useState<GroupBy>('day');
  const [filterBy, setFilterBy] = useState<FilterBy>('all');
  const [selectedValue, setSelectedValue] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<number>(30); // days
  const [activeTab, setActiveTab] = useState('trends');

  // Extract unique values for filtering
  const categories = useMemo(() => 
    Array.from(new Set(logs.map(log => log.activityCategory))).sort(),
    [logs]
  );
  
  const locations = useMemo(() => 
    Array.from(new Set(logs.map(log => log.location))).sort(),
    [logs]
  );
  
  const statuses = useMemo(() => 
    Array.from(new Set(logs.map(log => log.status))).sort() as string[],
    [logs]
  );

  // Calculate time series data
  const timeSeriesData = useMemo(() => {
    if (logs.length === 0) return [];
    
    // Filter logs by time range
    const cutoffDate = subDays(new Date(), timeRange);
    const filteredLogs = logs.filter(log => {
      const timestamp = new Date(log.timestamp);
      return timestamp >= cutoffDate;
    });
    
    // Filter logs by selected value if applicable
    let displayLogs = filteredLogs;
    if (filterBy !== 'all' && selectedValue !== 'all') {
      switch(filterBy) {
        case 'category':
          displayLogs = filteredLogs.filter(log => log.activityCategory === selectedValue);
          break;
        case 'location':
          displayLogs = filteredLogs.filter(log => log.location === selectedValue);
          break;
        case 'status':
          displayLogs = filteredLogs.filter(log => log.status === selectedValue);
          break;
      }
    }
    
    // Group logs by time period
    const groupedData = new Map<string, TimeSeriesData[]>();
    
    displayLogs.forEach(log => {
      const date = new Date(log.timestamp);
      let groupKey: string;
      
      switch(groupBy) {
        case 'hour':
          groupKey = format(date, 'yyyy-MM-dd HH:00');
          break;
        case 'day':
          groupKey = format(date, 'yyyy-MM-dd');
          break;
        case 'week':
          groupKey = format(date, 'yyyy-[W]ww');
          break;
        case 'month':
          groupKey = format(date, 'yyyy-MM');
          break;
        default:
          groupKey = format(date, 'yyyy-MM-dd');
      }
      
      if (!groupedData.has(groupKey)) {
        groupedData.set(groupKey, []);
      }
      
      const group = groupedData.get(groupKey)!;
      
      // Add entry for each dimension we want to track
      const entry: TimeSeriesData = {
        timestamp: date,
        count: 1,
        category: log.activityCategory,
        location: log.location,
        status: log.status
      };
      
      group.push(entry);
    });
    
    // Convert to chart data
    const chartData: any[] = Array.from(groupedData.entries()).map(([key, group]) => {
      const result: any = {
        name: key,
        timestamp: group[0].timestamp, // Use first log's timestamp for sorting
        count: group.length,
      };
      
      // Add counts by filter type
      if (filterBy === 'all') {
        // Just use total count
      } else if (filterBy === 'category') {
        categories.forEach(cat => {
          result[cat] = group.filter(item => item.category === cat).length;
        });
      } else if (filterBy === 'location') {
        locations.forEach(loc => {
          const safeLoc = loc.replace(/[^a-zA-Z0-9]/g, '_');
          result[safeLoc] = group.filter(item => item.location === loc).length;
        });
      } else if (filterBy === 'status') {
        statuses.forEach(status => {
          result[status] = group.filter(item => item.status === status).length;
        });
      }
      
      return result;
    });
    
    // Sort by timestamp
    return chartData.sort((a, b) => a.timestamp - b.timestamp);
  }, [logs, timeRange, groupBy, filterBy, selectedValue, categories, locations, statuses]);

  // Get labels for the chart
  const getChartElements = () => {
    if (filterBy === 'all') {
      return [
        <Line 
          key="count" 
          type="monotone" 
          dataKey="count" 
          stroke="#4f46e5" 
          strokeWidth={2}
          activeDot={{ r: 8 }} 
          name="Log Count"
        />
      ];
    }
    
    let items: string[] = [];
    let nameKey = 'name';
    
    if (filterBy === 'category') {
      items = categories;
      nameKey = 'category';
    } else if (filterBy === 'location') {
      items = locations.map(loc => loc.replace(/[^a-zA-Z0-9]/g, '_'));
      nameKey = 'location';
    } else if (filterBy === 'status') {
      items = statuses;
      nameKey = 'status';
    }
    
    if (chartType === 'line') {
      return items.map((item, index) => (
        <Line
          key={item}
          type="monotone"
          dataKey={item}
          stroke={COLORS[index % COLORS.length]}
          strokeWidth={2}
          activeDot={{ r: 6 }}
          name={item}
        />
      ));
    } else if (chartType === 'bar') {
      return items.map((item, index) => (
        <Bar
          key={item}
          dataKey={item}
          fill={COLORS[index % COLORS.length]}
          name={item}
          radius={[4, 4, 0, 0]}
        />
      ));
    } else if (chartType === 'area') {
      return items.map((item, index) => (
        <Area
          key={item}
          type="monotone"
          dataKey={item}
          fill={COLORS[index % COLORS.length]}
          stroke={COLORS[index % COLORS.length]}
          stackId="1"
          fillOpacity={0.6}
          name={item}
        />
      ));
    } else if (chartType === 'combined') {
      return [
        ...items.slice(0, Math.min(3, items.length)).map((item, index) => (
          <Bar
            key={`bar-${item}`}
            dataKey={item}
            fill={COLORS[index % COLORS.length]}
            name={item}
            radius={[4, 4, 0, 0]}
          />
        )),
        <Line
          key="total"
          type="monotone"
          dataKey="count"
          stroke="#000"
          strokeWidth={2}
          dot={{ stroke: '#000', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6 }}
          name="Total"
        />
      ];
    } else { // scatter
      return [
        <Scatter
          key="scatter"
          name="Log Entries"
          data={timeSeriesData.flatMap(point => {
            const results = [];
            items.forEach(item => {
              if (point[item] > 0) {
                results.push({
                  x: new Date(point.timestamp).getTime(),
                  y: point[item],
                  name: item,
                  count: point[item]
                });
              }
            });
            return results;
          })}
          fill="#4f46e5"
        />
      ];
    }
  };

  // Generate chart based on type
  const renderChart = () => {
    if (timeSeriesData.length === 0) {
      return (
        <div className="h-[300px] flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-medium">No data available</p>
            <p className="text-muted-foreground">Try adjusting your filters or add more logs</p>
          </div>
        </div>
      );
    }
    
    const getChartComponent = () => {
      switch(chartType) {
        case 'line':
          return (
            <LineChart data={timeSeriesData} margin={{ top: 10, right: 30, left: 10, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }} 
                angle={-45}
                textAnchor="end"
              />
              <YAxis tick={{ fontSize: 12 }} />
              <RechartsTooltip 
                formatter={(value: number, name: string) => [`${value} logs`, name]}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Legend />
              {getChartElements()}
            </LineChart>
          );
        case 'bar':
          return (
            <BarChart data={timeSeriesData} margin={{ top: 10, right: 30, left: 10, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }} 
                angle={-45}
                textAnchor="end"
              />
              <YAxis tick={{ fontSize: 12 }} />
              <RechartsTooltip 
                formatter={(value: number, name: string) => [`${value} logs`, name]}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Legend />
              {getChartElements()}
            </BarChart>
          );
        case 'area':
          return (
            <AreaChart data={timeSeriesData} margin={{ top: 10, right: 30, left: 10, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }} 
                angle={-45}
                textAnchor="end"
              />
              <YAxis tick={{ fontSize: 12 }} />
              <RechartsTooltip 
                formatter={(value: number, name: string) => [`${value} logs`, name]}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Legend />
              {getChartElements()}
            </AreaChart>
          );
        case 'combined':
          return (
            <ComposedChart data={timeSeriesData} margin={{ top: 10, right: 30, left: 10, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }} 
                angle={-45}
                textAnchor="end"
              />
              <YAxis tick={{ fontSize: 12 }} />
              <RechartsTooltip 
                formatter={(value: number, name: string) => [`${value} logs`, name]}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Legend />
              {getChartElements()}
            </ComposedChart>
          );
        case 'scatter':
          return (
            <ComposedChart margin={{ top: 10, right: 30, left: 10, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis
                type="number"
                dataKey="x"
                name="Date"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(tick) => format(new Date(tick), 'MM/dd')}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                dataKey="y"
                name="Count" 
                tick={{ fontSize: 12 }}
              />
              <RechartsTooltip
                formatter={(value: any, name: string, props: any) => {
                  if (name === 'Log Entries') {
                    return [props.payload.count, props.payload.name];
                  }
                  return [value, name];
                }}
                labelFormatter={(label: any) => format(new Date(label), 'MM/dd/yyyy HH:mm')}
              />
              <Legend />
              {getChartElements()}
            </ComposedChart>
          );
        default:
          return <LineChart data={timeSeriesData} />;
      }
    };
    
    return (
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {getChartComponent()}
        </ResponsiveContainer>
      </div>
    );
  };

  // Compute activity metrics
  const activityMetrics = useMemo(() => {
    if (logs.length === 0) return { mostActive: null, leastActive: null, recent: null, avgPerDay: 0 };
    
    const locationCounts = new Map<string, number>();
    logs.forEach(log => {
      if (log.location) {
        locationCounts.set(log.location, (locationCounts.get(log.location) || 0) + 1);
      }
    });
    
    // Sort locations by activity
    const sortedLocations = Array.from(locationCounts.entries())
      .sort((a, b) => b[1] - a[1]);
    
    // Get most recent log
    const sortedByTime = [...logs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    // Get earliest and latest logs for time span calculation
    const earliest = new Date(Math.min(...logs.map(log => new Date(log.timestamp).getTime())));
    const latest = new Date(Math.max(...logs.map(log => new Date(log.timestamp).getTime())));
    
    // Calculate days spanned
    const daysDiff = Math.max(1, differenceInDays(latest, earliest));
    
    return {
      mostActive: sortedLocations[0] || null,
      leastActive: sortedLocations[sortedLocations.length - 1] || null,
      recent: sortedByTime[0] || null,
      avgPerDay: logs.length / daysDiff
    };
  }, [logs]);

  // Generate timeseries breakdown for metrics
  const timeBreakdown = useMemo(() => {
    if (logs.length === 0) return [];
    
    const now = new Date();
    const stats = [
      { label: 'Last 24 hours', count: logs.filter(log => {
        const logTime = new Date(log.timestamp);
        return differenceInHours(now, logTime) <= 24;
      }).length },
      { label: 'Last 7 days', count: logs.filter(log => {
        const logTime = new Date(log.timestamp);
        return differenceInDays(now, logTime) <= 7;
      }).length },
      { label: 'Last 30 days', count: logs.filter(log => {
        const logTime = new Date(log.timestamp);
        return differenceInDays(now, logTime) <= 30;
      }).length },
      { label: 'All time', count: logs.length }
    ];
    
    return stats;
  }, [logs]);

  // Generate activity sequence analysis
  const sequenceAnalysis = useMemo(() => {
    if (logs.length < 2) return [];
    
    // Sort logs by timestamp
    const sortedLogs = [...logs].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // Calculate time elapsed since first log for each entry
    const firstLogTime = new Date(sortedLogs[0].timestamp).getTime();
    
    sortedLogs.forEach((log, index) => {
      const logTime = new Date(log.timestamp).getTime();
      const timeElapsedMinutes = Math.floor((logTime - firstLogTime) / (1000 * 60));
      log.timeElapsed = timeElapsedMinutes;
    });
    
    // Generate sequence patterns
    const patterns: {
      sequence: string[];
      timeSpan: number;
      locations: string[];
      startTime: string;
    }[] = [];
    
    // For demonstration, extract some sequences
    for (let i = 0; i < sortedLogs.length - 2 && patterns.length < 5; i++) {
      const start = sortedLogs[i];
      const middle = sortedLogs[i+1];
      const end = sortedLogs[i+2];
      
      const sequence = [start.activityType, middle.activityType, end.activityType];
      const locations = Array.from(new Set([start.location, middle.location, end.location]));
      const timeSpan = (end.timeElapsed || 0) - (start.timeElapsed || 0);
      
      if (timeSpan > 0 && timeSpan < 1440) { // Less than 24 hours
        patterns.push({
          sequence,
          timeSpan,
          locations,
          startTime: start.timestamp
        });
      }
    }
    
    return patterns;
  }, [logs]);

  // Loading skeletons
  if (isLoading) {
    return (
      <TransitionLayout animation="fade" className="w-full">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Time Series Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-[400px] w-full" />
              <div className="flex gap-4">
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>
      </TransitionLayout>
    );
  }

  // Empty state
  if (logs.length === 0) {
    return (
      <TransitionLayout animation="fade" className="w-full">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Time Series Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center p-10">
            <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Log Data Available</h3>
            <p className="text-muted-foreground mb-6">
              Enter a video transcription above to generate activity logs for time series analysis.
            </p>
          </CardContent>
        </Card>
      </TransitionLayout>
    );
  }

  return (
    <TransitionLayout animation="fade" className="w-full">
      <Card className="overflow-hidden">
        <CardHeader className="bg-secondary/30 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Time Series Analysis
            </CardTitle>
            
            <div className="flex flex-wrap gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setTimeRange(7)} 
                className={timeRange === 7 ? "bg-primary text-primary-foreground" : ""}
              >
                7 Days
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setTimeRange(30)} 
                className={timeRange === 30 ? "bg-primary text-primary-foreground" : ""}
              >
                30 Days
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setTimeRange(90)} 
                className={timeRange === 90 ? "bg-primary text-primary-foreground" : ""}
              >
                90 Days
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setTimeRange(365)} 
                className={timeRange === 365 ? "bg-primary text-primary-foreground" : ""}
              >
                All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex border-b border-border w-full overflow-x-auto">
              <TabsList className="mx-6 my-1.5">
                <TabsTrigger value="trends" className="px-4">
                  <LineChartIcon className="w-4 h-4 mr-2" />
                  Trends
                </TabsTrigger>
                <TabsTrigger value="metrics" className="px-4">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Metrics
                </TabsTrigger>
                <TabsTrigger value="patterns" className="px-4">
                  <CalendarDays className="w-4 h-4 mr-2" />
                  Patterns
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="trends" className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex flex-wrap items-center gap-4 mb-4 sm:mb-0">
                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className={chartType === 'line' ? "border-primary bg-primary/10" : ""} 
                            onClick={() => setChartType('line')}
                          >
                            <LineChartIcon className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Line Chart</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className={chartType === 'area' ? "border-primary bg-primary/10" : ""} 
                            onClick={() => setChartType('area')}
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M3 13L9 7L13 11L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M21 3V8.4M21 3H15.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M21 3L3 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 3"/>
                              <path d="M3 8V21H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M3 13L9 7L13 11L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.2"/>
                            </svg>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Area Chart</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className={chartType === 'bar' ? "border-primary bg-primary/10" : ""} 
                            onClick={() => setChartType('bar')}
                          >
                            <BarChart3 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Bar Chart</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className={chartType === 'combined' ? "border-primary bg-primary/10" : ""} 
                            onClick={() => setChartType('combined')}
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <rect x="3" y="12" width="3" height="9" rx="1" fill="currentColor"/>
                              <rect x="9" y="8" width="3" height="13" rx="1" fill="currentColor"/>
                              <rect x="15" y="5" width="3" height="16" rx="1" fill="currentColor"/>
                              <path d="M3 7L9 9L15 7L21 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Combined Chart</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className={chartType === 'scatter' ? "border-primary bg-primary/10" : ""} 
                            onClick={() => setChartType('scatter')}
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Scatter Chart</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <Separator orientation="vertical" className="h-8 mx-2" />
                    
                    <Select value={groupBy} onValueChange={(value) => setGroupBy(value as GroupBy)}>
                      <SelectTrigger className="w-[110px]">
                        <SelectValue placeholder="Group by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hour">By Hour</SelectItem>
                        <SelectItem value="day">By Day</SelectItem>
                        <SelectItem value="week">By Week</SelectItem>
                        <SelectItem value="month">By Month</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="flex items-center gap-1">
                          <Filter className="h-4 w-4 mr-1" />
                          {filterBy === 'all' ? 'All Data' : `By ${filterBy}`}
                          {filterBy !== 'all' && selectedValue !== 'all' && (
                            <Badge variant="secondary" className="ml-1 text-xs">
                              {selectedValue}
                            </Badge>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56">
                        <DropdownMenuItem 
                          onClick={() => {setFilterBy('all'); setSelectedValue('all');}}
                          className={filterBy === 'all' ? "bg-secondary" : ""}
                        >
                          All Data
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {setFilterBy('category'); setSelectedValue('all');}}
                          className={filterBy === 'category' ? "bg-secondary" : ""}
                        >
                          By Category
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {setFilterBy('location'); setSelectedValue('all');}}
                          className={filterBy === 'location' ? "bg-secondary" : ""}
                        >
                          By Location
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {setFilterBy('status'); setSelectedValue('all');}}
                          className={filterBy === 'status' ? "bg-secondary" : ""}
                        >
                          By Status
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    {filterBy !== 'all' && (
                      <Select value={selectedValue} onValueChange={setSelectedValue}>
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder={`Select ${filterBy}`} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All {filterBy}s</SelectItem>
                          {filterBy === 'category' && categories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                          {filterBy === 'location' && locations.map(loc => (
                            <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                          ))}
                          {filterBy === 'status' && statuses.map(status => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
                
                <Button size="sm" variant="outline" className="flex items-center gap-1">
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  Refresh
                </Button>
              </div>
              
              {renderChart()}
              
              <div className="mt-6 text-sm text-muted-foreground">
                {logs.length > 0 && (
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    Showing {timeSeriesData.length} time periods with {logs.length} log entries
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="metrics" className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Activity Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Total Logs</span>
                        <span className="font-medium">{logs.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Avg. Logs Per Day</span>
                        <span className="font-medium">{activityMetrics.avgPerDay.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Most Active Location</span>
                        <span className="font-medium">{activityMetrics.mostActive?.[0] || 'None'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Most Recent Activity</span>
                        <span className="font-medium">
                          {activityMetrics.recent ? format(new Date(activityMetrics.recent.timestamp), 'MM/dd/yyyy') : 'None'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Time Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {timeBreakdown.map((period, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-muted-foreground">{period.label}</span>
                          <div className="flex items-center">
                            <div className="w-32 h-2 rounded-full bg-secondary overflow-hidden mr-3">
                              <div 
                                className="h-full bg-primary rounded-full" 
                                style={{ 
                                  width: `${Math.min(100, (period.count / logs.length) * 100)}%` 
                                }}
                              ></div>
                            </div>
                            <span className="font-medium">{period.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="md:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Category Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {categories.map((category, index) => {
                        const count = logs.filter(log => log.activityCategory === category).length;
                        const percentage = (count / logs.length) * 100;
                        
                        return (
                          <div key={index} className="flex flex-col p-4 border rounded-lg">
                            <span className="text-sm text-muted-foreground mb-1">{category}</span>
                            <div className="flex items-end justify-between mt-1">
                              <span className="text-2xl font-semibold">{count}</span>
                              <span className="text-sm text-muted-foreground">
                                {percentage.toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full h-1 bg-secondary rounded-full mt-2 overflow-hidden">
                              <div 
                                className="h-full rounded-full" 
                                style={{ 
                                  width: `${percentage}%`,
                                  backgroundColor: COLORS[index % COLORS.length]
                                }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Status Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={timeSeriesData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        {statuses.map((status, index) => (
                          <Area
                            key={status}
                            type="monotone"
                            dataKey={status}
                            stackId="1"
                            fill={COLORS[index % COLORS.length]}
                            stroke={COLORS[index % COLORS.length]}
                            fillOpacity={0.6}
                            name={status}
                          />
                        ))}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="patterns" className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Activity Sequences</h3>
                {sequenceAnalysis.length > 0 ? (
                  <div className="space-y-4">
                    {sequenceAnalysis.map((pattern, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <h4 className="font-medium mb-1">Sequence #{index + 1}</h4>
                              <div className="flex items-center text-sm text-muted-foreground mb-2">
                                <Clock className="w-3.5 h-3.5 mr-1" />
                                {format(new Date(pattern.startTime), 'MM/dd/yyyy HH:mm')}
                                <span className="mx-2">•</span>
                                <span>{pattern.timeSpan} min duration</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {pattern.locations.map((loc, idx) => (
                                <Badge key={idx} variant="outline">{loc}</Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex items-center mt-3">
                            {pattern.sequence.map((step, idx) => (
                              <React.Fragment key={idx}>
                                <div className="flex-1 p-2 bg-primary/10 rounded text-center text-xs">
                                  {step}
                                </div>
                                {idx < pattern.sequence.length - 1 && (
                                  <div className="w-8 flex justify-center">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  </div>
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-10 border rounded-lg">
                    <h4 className="text-lg font-medium mb-2">No Patterns Detected</h4>
                    <p className="text-muted-foreground">
                      Add more log data to detect activity patterns and sequences.
                    </p>
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Log Frequency Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="md:col-span-2">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Hourly Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={Array.from({ length: 24 }, (_, hour) => {
                              const count = logs.filter(log => {
                                const logDate = new Date(log.timestamp);
                                return logDate.getHours() === hour;
                              }).length;
                              
                              return {
                                hour: hour.toString().padStart(2, '0'),
                                count
                              };
                            })}
                            margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                            <XAxis
                              dataKey="hour"
                              tick={{ fontSize: 10 }}
                              tickFormatter={(hour) => `${hour}:00`}
                            />
                            <YAxis tick={{ fontSize: 10 }} />
                            <RechartsTooltip
                              formatter={(value: number) => [`${value} logs`, 'Count']}
                              labelFormatter={(hour) => `${hour}:00 - ${hour}:59`}
                            />
                            <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Weekly Pattern</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={Array.from({ length: 7 }, (_, day) => {
                              const count = logs.filter(log => {
                                const logDate = new Date(log.timestamp);
                                return logDate.getDay() === day;
                              }).length;
                              
                              return {
                                day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day],
                                count
                              };
                            })}
                            margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                            <XAxis
                              dataKey="day"
                              tick={{ fontSize: 10 }}
                            />
                            <YAxis tick={{ fontSize: 10 }} />
                            <RechartsTooltip
                              formatter={(value: number) => [`${value} logs`, 'Count']}
                            />
                            <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </TransitionLayout>
  );
};

export default TimeSeriesView;
