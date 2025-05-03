
import React from 'react';
import { motion } from 'framer-motion';
import { LogEntry } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  Calendar,
  MapPin,
  Tag,
  Wrench,
  Users,
  Package,
  BarChart,
  Clock,
  FileText,
  Link as LinkIcon,
  Video,
  Film
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";

interface LogCardProps {
  log: LogEntry;
  index: number;
}

const LogCard: React.FC<LogCardProps> = ({ log, index }) => {
  // Status color mapping
  const statusColors: Record<string, string> = {
    completed: 'bg-green-100 text-green-800 border-green-200',
    'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
    planned: 'bg-purple-100 text-purple-800 border-purple-200',
    delayed: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200'
  };

  // Detect if this log has related media (image or video)
  const hasMedia = log.media || (log.notes && log.notes.includes('video'));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="glass p-5 rounded-xl relative overflow-hidden group h-full flex flex-col"
    >
      {/* Status indicator with animation */}
      <div className="absolute top-0 left-0 h-1 w-full" style={{
        background: `linear-gradient(to right, transparent, ${
          log.status === 'completed' ? '#10b981' :
          log.status === 'in-progress' ? '#3b82f6' :
          log.status === 'planned' ? '#8b5cf6' :
          log.status === 'delayed' ? '#f59e0b' :
          log.status === 'cancelled' ? '#ef4444' : '#4f46e5'
        }80, transparent)`
      }}>
        <div className="absolute inset-0 animate-pulse opacity-50" style={{
          background: `linear-gradient(to right, transparent, ${
            log.status === 'completed' ? '#10b981' :
            log.status === 'in-progress' ? '#3b82f6' :
            log.status === 'planned' ? '#8b5cf6' :
            log.status === 'delayed' ? '#f59e0b' :
            log.status === 'cancelled' ? '#ef4444' : '#4f46e5'
          }, transparent)`
        }}></div>
      </div>
      
      {/* Episode indicator if available */}
      {log.episodeId && (
        <div className="absolute top-1 right-1">
          <Badge variant="outline" className="flex items-center gap-1 text-xs">
            <Film className="h-3 w-3" />
            Ep {log.episodeId.replace('ep-', '#')}
          </Badge>
        </div>
      )}
      
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-start mb-4 pt-2">
          <div>
            <span className="text-xs font-medium text-muted-foreground mb-1 flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <h3 className="text-lg font-medium">{log.activityType}</h3>
          </div>
          <span className={cn("text-xs px-2 py-1 rounded-full border", statusColors[log.status])}>
            {log.status}
          </span>
        </div>
        
        {/* Location */}
        <div className="flex items-center mb-3 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 mr-1 text-primary/70" />
          <span>{log.location}</span>
        </div>
        
        {/* Details grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <DetailItem icon={<Tag className="w-4 h-4 text-primary/70" />} label="Category" value={log.activityCategory} />
          <DetailItem icon={<Wrench className="w-4 h-4 text-primary/70" />} label="Equipment" value={log.equipment} />
          <DetailItem icon={<Users className="w-4 h-4 text-primary/70" />} label="Personnel" value={log.personnel} />
          <DetailItem icon={<Package className="w-4 h-4 text-primary/70" />} label="Material" value={log.material} />
          {log.measurement && (
            <DetailItem icon={<BarChart className="w-4 h-4 text-primary/70" />} label="Measurement" value={log.measurement} />
          )}
        </div>
        
        {/* Notes */}
        {log.notes && (
          <div className="mb-4">
            <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center">
              <FileText className="w-3 h-3 mr-1" />
              Notes
            </div>
            <p className="text-sm line-clamp-3 relative">
              {log.notes}
              {log.notes.length > 150 && (
                <span className="absolute bottom-0 right-0 bg-gradient-to-l from-white to-transparent px-2">...</span>
              )}
            </p>
          </div>
        )}
        
        {/* Image if available */}
        {log.media && (
          <div className="relative h-40 w-full mb-3 mt-auto overflow-hidden rounded-md">
            <img 
              src={log.media} 
              alt={`Media for ${log.activityType}`} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>
        )}
        
        {/* Video indicator if notes mention video */}
        {!log.media && log.notes && log.notes.toLowerCase().includes('video') && (
          <div className="relative h-20 w-full mb-3 mt-auto overflow-hidden rounded-md flex items-center justify-center bg-gray-100">
            <Video className="w-10 h-10 text-gray-400" />
            <span className="text-sm text-gray-500 mt-2">Video available</span>
          </div>
        )}
        
        {/* Footer */}
        <div className="flex justify-between items-center mt-auto text-xs text-muted-foreground">
          <div className="flex items-center">
            <LinkIcon className="w-3 h-3 mr-1" />
            <span>{log.referenceId}</span>
          </div>
          <div>{log.id}</div>
        </div>
      </div>
      
      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-xl" />
      
      {/* Interactive indicator */}
      <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-primary animate-ping opacity-0 group-hover:opacity-70" />
    </motion.div>
  );
};

interface DetailItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

const DetailItem: React.FC<DetailItemProps> = ({ icon, label, value }) => (
  <div className="flex items-start">
    <div className="mt-0.5 mr-2">{icon}</div>
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value || "N/A"}</div>
    </div>
  </div>
);

export default LogCard;
