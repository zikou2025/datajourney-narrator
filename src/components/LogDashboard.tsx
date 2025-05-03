
import React from 'react';
import { LogEntry } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, CheckCircle, Clock, MapPin, BarChart2, PieChart } from "lucide-react";
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import TransitionLayout from './TransitionLayout';

interface LogDashboardProps {
  logs: LogEntry[];
}

const LogDashboard: React.FC<LogDashboardProps> = ({ logs }) => {
  // Calculate stats from logs
  const statusCounts = logs.reduce((acc, log) => {
    acc[log.status] = (acc[log.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryCounts = logs.reduce((acc, log) => {
    acc[log.activityCategory] = (acc[log.activityCategory] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const locationGroups = logs.reduce((acc, log) => {
    const existing = acc.find(l => l.location === log.location);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({
        location: log.location,
        count: 1,
        coordinates: log.coordinates
      });
    }
    return acc;
  }, [] as { location: string; count: number; coordinates?: [number, number] }[]);

  // Format date as "May 15, 2023"
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <TransitionLayout animation="fade">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <DashboardCard 
            title="Total Logs"
            value={logs.length}
            description="Total number of activity logs"
            icon={<BarChart className="h-4 w-4 text-muted-foreground" />}
            className="bg-primary/5"
          />
          
          <DashboardCard 
            title="Locations"
            value={locationGroups.length}
            description="Unique activity locations"
            icon={<MapPin className="h-4 w-4 text-muted-foreground" />}
            className="bg-blue-500/5"
          />
          
          <DashboardCard 
            title="Completed"
            value={statusCounts.completed || 0}
            description="Completed activities"
            icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
            className="bg-green-500/5"
          />
          
          <DashboardCard 
            title="In Progress"
            value={statusCounts["in-progress"] || 0}
            description="Activities in progress"
            icon={<Clock className="h-4 w-4 text-muted-foreground" />}
            className="bg-orange-500/5"
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Activity Distribution</CardTitle>
              <CardDescription>Breakdown by category and status</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="category" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="category">
                    <PieChart className="w-4 h-4 mr-2" />
                    By Category
                  </TabsTrigger>
                  <TabsTrigger value="status">
                    <BarChart2 className="w-4 h-4 mr-2" />
                    By Status
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="category" className="pt-4">
                  <div className="space-y-2">
                    {Object.entries(categoryCounts).map(([category, count], index) => (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <motion.div 
                            className="w-3 h-3 rounded-full mr-3"
                            style={{ 
                              backgroundColor: `hsl(${index * 40}, 70%, 60%)`,
                              marginRight: '0.75rem'
                            }}
                          />
                          <span>{category}</span>
                        </div>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="status" className="pt-4">
                  <div className="space-y-2">
                    {Object.entries(statusCounts).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <motion.div 
                            className={cn("w-3 h-3 rounded-full", {
                              "bg-green-500": status === "completed",
                              "bg-blue-500": status === "in-progress",
                              "bg-purple-500": status === "planned",
                              "bg-yellow-500": status === "delayed",
                              "bg-red-500": status === "cancelled",
                            })}
                            style={{ marginRight: '0.75rem' }}
                          />
                          <span className="capitalize">{status}</span>
                        </div>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
              <CardDescription>Latest log entries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {logs.slice(0, 5).map((log, index) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-start space-x-3 p-3 rounded-md hover:bg-secondary/50 transition-colors"
                  >
                    <div className={cn(
                      "w-2 h-2 mt-2 rounded-full flex-shrink-0",
                      {
                        "bg-green-500": log.status === "completed",
                        "bg-blue-500": log.status === "in-progress",
                        "bg-purple-500": log.status === "planned",
                        "bg-yellow-500": log.status === "delayed",
                        "bg-red-500": log.status === "cancelled",
                      }
                    )} />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {log.activityType} - {log.activityCategory}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(log.timestamp)} at {log.location}
                      </p>
                      <p className="text-xs line-clamp-1">{log.notes}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TransitionLayout>
  );
};

interface DashboardCardProps {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  className?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ 
  title, 
  value, 
  description, 
  icon,
  className
}) => {
  return (
    <Card className={cn("flex-1", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground pt-1">
          {description}
        </p>
      </CardContent>
    </Card>
  );
};

export default LogDashboard;
