
import React from 'react';
import { Button } from "@/components/ui/button";
import { PieChart, BarChart3, Map, List, Calendar, Search, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useMobile } from "@/hooks/use-mobile";
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

type ActiveView = 'dashboard' | 'map' | 'list' | 'timeline' | 'timeseries';

interface LogHeaderProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  setSearchOpen: (isOpen: boolean) => void;
}

const LogHeader: React.FC<LogHeaderProps> = ({ activeView, setActiveView, setSearchOpen }) => {
  const isMobile = useMobile();
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: PieChart },
    { id: 'map', label: 'Map View', icon: Map },
    { id: 'list', label: 'List View', icon: List },
    { id: 'timeline', label: 'Timeline', icon: Calendar },
    { id: 'timeseries', label: 'Time Series', icon: BarChart3 },
  ];
  
  const DesktopNav = () => (
    <nav className="flex items-center space-x-1">
      {navItems.map((item) => (
        <Button
          key={item.id}
          variant={activeView === item.id ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveView(item.id as ActiveView)}
          className={cn(
            "flex items-center px-3 gap-1.5",
            activeView === item.id ? "bg-primary text-primary-foreground" : ""
          )}
        >
          <item.icon className="w-4 h-4" />
          {item.label}
          {activeView === item.id && (
            <motion.div
              layoutId="active-nav"
              className="absolute inset-0 rounded-md bg-primary z-[-1]"
              transition={{ type: "spring", duration: 0.6 }}
            />
          )}
        </Button>
      ))}
    </nav>
  );
  
  const MobileNav = () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Menu className="h-4 w-4" />
          <span className="sr-only">Toggle navigation</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <div className="flex flex-col space-y-2 pt-4">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant={activeView === item.id ? "default" : "ghost"}
              onClick={() => setActiveView(item.id as ActiveView)}
              className="justify-start"
            >
              <item.icon className="mr-2 h-5 w-5" />
              {item.label}
            </Button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
  
  return (
    <header className="border-b backdrop-blur-md bg-background/70 sticky top-0 z-40">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-white font-bold mr-3">
              LA
            </div>
            <div>
              <h1 className="text-lg font-semibold">Log Analyzer</h1>
              <p className="text-xs text-muted-foreground">
                Analyze activity logs with AI
              </p>
            </div>
          </div>

          {!isMobile && <div className="h-8 border-l mx-4" />}
          
          {isMobile ? <MobileNav /> : <DesktopNav />}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setSearchOpen(true)}
            className="h-9 w-9"
          >
            <Search className="h-4 w-4" />
            <span className="sr-only">Search logs</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default LogHeader;
