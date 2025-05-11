
import { LogEntry } from "./types";
import { format, formatDistanceToNow } from "date-fns";

// Helper functions for news formatting
export const formatNewsDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";
    
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return formatDistanceToNow(date, { addSuffix: true });
    } else {
      return format(date, "MMM dd, yyyy");
    }
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Unknown date";
  }
};

export const getExcerpt = (text: string, maxLength: number = 150): string => {
  if (!text) return "";
  
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

export const getRecentLogs = (logs: LogEntry[], days: number): LogEntry[] => {
  if (!logs || logs.length === 0) return [];
  
  const now = new Date();
  const cutoff = new Date(now.setDate(now.getDate() - days));
  
  return logs
    .filter(log => new Date(log.timestamp) >= cutoff)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const getTrendingLogs = (logs: LogEntry[], count: number = 2): LogEntry[] => {
  if (!logs || logs.length === 0) return [];
  
  // In a real app, you might determine trending based on views/engagement
  // For now, we'll just take some of the most recent logs
  return logs
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, count);
};

export const getLocationCounts = (logs: LogEntry[]): {[key: string]: number} => {
  if (!logs || logs.length === 0) return {};
  
  const locations: {[key: string]: number} = {};
  
  logs.forEach(log => {
    if (log.location) {
      locations[log.location] = (locations[log.location] || 0) + 1;
    }
  });
  
  return locations;
};

export const getCategoryCounts = (logs: LogEntry[]): {[key: string]: number} => {
  if (!logs || logs.length === 0) return {};
  
  const categories: {[key: string]: number} = {};
  
  logs.forEach(log => {
    if (log.activityCategory) {
      categories[log.activityCategory] = (categories[log.activityCategory] || 0) + 1;
    }
  });
  
  return categories;
};

export const getFeaturedArticle = (logs: LogEntry[]): LogEntry | null => {
  if (!logs || logs.length === 0) return null;
  
  // In a real app, you might select featured based on importance/engagement
  // For now, we'll just take the most recent completed item
  const completed = logs.filter(log => log.status === "completed");
  if (completed.length === 0) return logs[0];
  
  return completed.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )[0];
};
