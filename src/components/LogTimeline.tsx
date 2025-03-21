
import React from 'react';
import { motion } from 'framer-motion';
import TransitionLayout from './TransitionLayout';
import { LogEntry } from '@/lib/types';
import { Calendar, Clock, MapPin, Tag, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogTimelineProps {
  logs: LogEntry[];
  onSelectLog: (log: LogEntry) => void;
}

const LogTimeline: React.FC<LogTimelineProps> = ({ logs, onSelectLog }) => {
  // Sort logs by timestamp
  const sortedLogs = [...logs].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  
  // Group logs by date
  const logsByDate = sortedLogs.reduce((groups, log) => {
    const date = new Date(log.timestamp).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(log);
    return groups;
  }, {} as Record<string, LogEntry[]>);
  
  const dates = Object.keys(logsByDate);
  
  return (
    <TransitionLayout animation="fade" className="w-full">
      <div className="relative w-full pb-10">
        {/* Vertical timeline line */}
        <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2 -z-10" />
        
        {dates.map((date, dateIndex) => (
          <div key={date} className="mb-8">
            <div className="flex justify-center mb-6">
              <span className="glass px-4 py-2 rounded-full text-sm font-medium inline-flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-primary/70" />
                {date}
              </span>
            </div>
            
            {logsByDate[date].map((log, logIndex) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: (dateIndex * 0.1) + (logIndex * 0.05) }}
                className="relative mb-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Time indicator (alternating sides on larger screens) */}
                  <div className={cn(
                    "flex items-center", 
                    logIndex % 2 === 0 ? "md:justify-end" : "md:order-2"
                  )}>
                    <div className="glass-darker text-sm px-3 py-1 rounded-full inline-flex items-center">
                      <Clock className="w-3 h-3 mr-1.5 text-primary/70" />
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  
                  {/* Timeline dot */}
                  <div className="absolute left-0 md:left-1/2 top-0 w-4 h-4 rounded-full bg-primary -translate-x-1/2 translate-y-1/2 border-2 border-white" />
                  
                  {/* Log card (alternating sides on larger screens) */}
                  <div className={cn(
                    "relative", 
                    logIndex % 2 === 0 ? "md:order-2" : ""
                  )}>
                    <button 
                      onClick={() => onSelectLog(log)}
                      className="glass w-full text-left p-4 rounded-xl hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{log.activityType}</h4>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          {
                            'bg-green-100 text-green-800': log.status === 'completed',
                            'bg-blue-100 text-blue-800': log.status === 'in-progress',
                            'bg-purple-100 text-purple-800': log.status === 'planned',
                            'bg-yellow-100 text-yellow-800': log.status === 'delayed',
                            'bg-red-100 text-red-800': log.status === 'cancelled',
                          }
                        )}>
                          {log.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-1 mb-2">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="w-3 h-3 mr-1.5 flex-shrink-0" />
                          <span>{log.location}</span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Tag className="w-3 h-3 mr-1.5 flex-shrink-0" />
                          <span>{log.activityCategory}</span>
                        </div>
                      </div>
                      
                      {log.notes && (
                        <div className="flex items-start text-sm mt-2">
                          <FileText className="w-3 h-3 mr-1.5 mt-1 flex-shrink-0 text-primary/70" />
                          <span className="line-clamp-2">{log.notes}</span>
                        </div>
                      )}
                      
                      <div className="text-xs text-right mt-2 text-muted-foreground">
                        {log.id}
                      </div>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ))}
      </div>
    </TransitionLayout>
  );
};

export default LogTimeline;
