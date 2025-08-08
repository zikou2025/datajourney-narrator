
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Map,
  List,
  Search,
  TimerReset,
  LineChart,
  BookOpen,
  Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LogHeaderProps {
  activeView: 'dashboard' | 'map' | 'list' | 'timeline' | 'timeseries' | 'story' | 'narrative' | 'qa';
  setActiveView: (view: 'dashboard' | 'map' | 'list' | 'timeline' | 'timeseries' | 'story' | 'narrative' | 'qa') => void;
  setSearchOpen: (isOpen: boolean) => void;
}

const LogHeader: React.FC<LogHeaderProps> = ({
  activeView,
  setActiveView,
  setSearchOpen,
}) => {
  const NavButton = ({
    view,
    icon,
    label,
  }: {
    view: 'dashboard' | 'map' | 'list' | 'timeline' | 'timeseries' | 'story' | 'narrative' | 'qa';
    icon: React.ReactNode;
    label: string;
  }) => (
    <Button
      variant={activeView === view ? "default" : "ghost"}
      className={cn(
        "h-9 gap-1.5",
        activeView === view ? "bg-primary" : "hover:bg-muted"
      )}
      onClick={() => setActiveView(view)}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );

  return (
    <header className="border-b bg-background sticky top-0 z-10">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 hidden md:flex">
          <Link className="mr-6 flex items-center space-x-2" to="/">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M10 20.5A7.5 7.5 0 1 0 10 5.5V20.5Z"></path>
              <path d="M14 5.5a7.5 7.5 0 1 1 0 15V5.5Z"></path>
              <path d="M7.5 10H12.5"></path>
              <path d="M11.5 14H16.5"></path>
            </svg>
            <span className="font-bold">ActivityLog</span>
          </Link>
        </div>
        <div className="flex items-center space-x-1.5">
          <NavButton
            view="dashboard"
            icon={<BarChart3 className="h-4 w-4" />}
            label="Dashboard"
          />
          <NavButton 
            view="map" 
            icon={<Map className="h-4 w-4" />}
            label="Map" 
          />
          <NavButton
            view="list"
            icon={<List className="h-4 w-4" />}
            label="List"
          />
          <NavButton
            view="timeline"
            icon={<TimerReset className="h-4 w-4" />}
            label="Timeline"
          />
          <NavButton
            view="timeseries"
            icon={<LineChart className="h-4 w-4" />}
            label="TimeSeries"
          />
          <NavButton
            view="story"
            icon={<BookOpen className="h-4 w-4" />}
            label="Story"
          />
          <NavButton
            view="qa"
            icon={<Brain className="h-4 w-4" />}
            label="Q&A"
          />
        </div>
        <div className="ml-auto flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-4 w-4" />
            <span className="sr-only">Search</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default LogHeader;
