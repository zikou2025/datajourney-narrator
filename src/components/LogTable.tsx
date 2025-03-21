import React from 'react';
import { motion } from 'framer-motion';
import { LogEntry } from '@/lib/types';
import TransitionLayout from './TransitionLayout';
import { Calendar, MapPin, Tag, Wrench, Clock, Check, AlertCircle, Clock2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogTableProps {
  logs: LogEntry[];
  onSelectLog: (log: LogEntry) => void;
}

const LogTable: React.FC<LogTableProps> = ({ logs, onSelectLog }) => {
  const [sortConfig, setSortConfig] = React.useState<{
    key: keyof LogEntry;
    direction: 'ascending' | 'descending';
  }>({
    key: 'timestamp',
    direction: 'descending',
  });

  const sortedLogs = React.useMemo(() => {
    const sortableItems = [...logs];
    sortableItems.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
    return sortableItems;
  }, [logs, sortConfig]);

  const requestSort = (key: keyof LogEntry) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'planned':
        return <Clock2 className="w-4 h-4 text-purple-500" />;
      case 'delayed':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'cancelled':
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <TransitionLayout animation="fade" className="w-full overflow-x-auto">
      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full min-w-[800px] divide-y divide-gray-200">
          <thead className="bg-secondary/50">
            <tr>
              <TableHeader
                label="ID"
                sortKey="id"
                currentSort={sortConfig}
                onClick={() => requestSort('id')}
              />
              <TableHeader
                label="Timestamp"
                sortKey="timestamp"
                currentSort={sortConfig}
                onClick={() => requestSort('timestamp')}
              />
              <TableHeader
                label="Location"
                sortKey="location"
                currentSort={sortConfig}
                onClick={() => requestSort('location')}
              />
              <TableHeader
                label="Activity"
                sortKey="activityType"
                currentSort={sortConfig}
                onClick={() => requestSort('activityType')}
              />
              <TableHeader
                label="Equipment"
                sortKey="equipment"
                currentSort={sortConfig}
                onClick={() => requestSort('equipment')}
              />
              <TableHeader
                label="Status"
                sortKey="status"
                currentSort={sortConfig}
                onClick={() => requestSort('status')}
              />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedLogs.map((log, index) => (
              <motion.tr
                key={log.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
                className="hover:bg-secondary/30 cursor-pointer transition-colors"
                onClick={() => onSelectLog(log)}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{log.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-primary/70" />
                    <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-primary/70" />
                    <span>{log.location}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <span className="text-xs text-muted-foreground">
                      {log.activityCategory}
                    </span>
                    <div className="font-medium text-sm">{log.activityType}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center">
                    <Wrench className="w-4 h-4 mr-2 text-primary/70" />
                    <span>{log.equipment}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={cn(
                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                    {
                      'bg-green-100 text-green-800': log.status === 'completed',
                      'bg-blue-100 text-blue-800': log.status === 'in-progress',
                      'bg-purple-100 text-purple-800': log.status === 'planned',
                      'bg-yellow-100 text-yellow-800': log.status === 'delayed',
                      'bg-red-100 text-red-800': log.status === 'cancelled',
                    }
                  )}>
                    <span className="mr-1">{getStatusIcon(log.status)}</span>
                    {log.status}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </TransitionLayout>
  );
};

interface TableHeaderProps {
  label: string;
  sortKey: keyof LogEntry;
  currentSort: {
    key: keyof LogEntry;
    direction: 'ascending' | 'descending';
  };
  onClick: () => void;
}

const TableHeader: React.FC<TableHeaderProps> = ({
  label,
  sortKey,
  currentSort,
  onClick,
}) => {
  const isSorted = currentSort.key === sortKey;
  
  return (
    <th
      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-center">
        <span className="mr-2">{label}</span>
        <span className={cn(
          "transition-opacity",
          isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-50"
        )}>
          {isSorted ? (
            currentSort.direction === 'ascending' ? '↑' : '↓'
          ) : (
            '↓'
          )}
        </span>
      </div>
    </th>
  );
};

export default LogTable;
