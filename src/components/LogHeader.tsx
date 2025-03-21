
import React from 'react';
import { motion } from 'framer-motion';
import { Search, BarChart, MapPin, LayoutList, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogHeaderProps {
  activeView: 'dashboard' | 'map' | 'list' | 'timeline';
  setActiveView: (view: 'dashboard' | 'map' | 'list' | 'timeline') => void;
  setSearchOpen: (open: boolean) => void;
}

const LogHeader: React.FC<LogHeaderProps> = ({ 
  activeView, 
  setActiveView,
  setSearchOpen 
}) => {
  return (
    <header className="w-full sticky top-0 z-50 glass border-b backdrop-blur-lg">
      <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center mb-4 md:mb-0">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="mr-4"
          >
            <FileText className="w-6 h-6 text-primary" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-2xl font-light tracking-tight"
          >
            <span className="font-medium">Data</span>Journey
          </motion.h1>
        </div>
        
        <div className="flex items-center space-x-1">
          <ViewButton 
            icon={<BarChart className="w-4 h-4" />}
            label="Dashboard"
            isActive={activeView === 'dashboard'}
            onClick={() => setActiveView('dashboard')}
          />
          <ViewButton 
            icon={<MapPin className="w-4 h-4" />}
            label="Map"
            isActive={activeView === 'map'}
            onClick={() => setActiveView('map')}
          />
          <ViewButton 
            icon={<LayoutList className="w-4 h-4" />}
            label="List"
            isActive={activeView === 'list'}
            onClick={() => setActiveView('list')}
          />
          <ViewButton 
            icon={<Search className="w-4 h-4" />}
            label="Search"
            isActive={false}
            onClick={() => setSearchOpen(true)}
          />
        </div>
      </div>
    </header>
  );
};

interface ViewButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const ViewButton: React.FC<ViewButtonProps> = ({ icon, label, isActive, onClick }) => {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "relative px-3 py-2 rounded-full text-sm flex items-center transition-all duration-300",
        isActive 
          ? "bg-primary text-white shadow-md" 
          : "text-foreground/70 hover:bg-secondary"
      )}
    >
      <span className="mr-2">{icon}</span>
      <span>{label}</span>
      {isActive && (
        <motion.div
          layoutId="active-pill"
          className="absolute inset-0 bg-primary rounded-full -z-10"
          initial={false}
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
    </button>
  );
};

export default LogHeader;
