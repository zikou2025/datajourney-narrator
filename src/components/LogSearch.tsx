
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Calendar, MapPin, Tag, Users } from 'lucide-react';
import { LogEntry } from '@/lib/types';

interface LogSearchProps {
  isOpen: boolean;
  onClose: () => void;
  logs: LogEntry[];
  onSelectLog: (log: LogEntry) => void;
}

const LogSearch: React.FC<LogSearchProps> = ({
  isOpen,
  onClose,
  logs,
  onSelectLog,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<LogEntry[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

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
            className="w-full max-w-2xl glass border shadow-lg rounded-xl overflow-hidden"
          >
            <div className="flex items-center border-b p-4">
              <Search className="w-5 h-5 text-muted-foreground mr-3" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search logs by ID, location, activity..."
                className="flex-1 bg-transparent outline-none text-foreground"
              />
              <button
                onClick={onClose}
                className="ml-2 p-1 rounded-full hover:bg-secondary transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto">
              {results.length === 0 && searchTerm.trim() !== '' ? (
                <div className="p-6 text-center">
                  <p className="text-muted-foreground">No results found</p>
                </div>
              ) : (
                <AnimatePresence>
                  {results.map((log, index) => (
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
                            {new Date(log.timestamp).toLocaleDateString()}
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
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LogSearch;
