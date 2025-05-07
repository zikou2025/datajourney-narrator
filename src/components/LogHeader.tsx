
import React from 'react';
import { Button } from "@/components/ui/button";
import { Search, LayoutDashboard, Map, ListFilter, Timeline, LineChart, BookOpen, MessageSquare } from 'lucide-react';
import { cn } from "@/lib/utils";

interface LogHeaderProps {
  activeView: 'dashboard' | 'map' | 'list' | 'timeline' | 'timeseries' | 'story' | 'qa';
  setActiveView: (view: 'dashboard' | 'map' | 'list' | 'timeline' | 'timeseries' | 'story' | 'qa') => void;
  setSearchOpen: (open: boolean) => void;
}

const LogHeader: React.FC<LogHeaderProps> = ({
  activeView,
  setActiveView,
  setSearchOpen,
}) => {
  return (
    <header className="border-b sticky top-0 z-30 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 hidden md:flex">
          <a className="mr-6 flex items-center space-x-2" href="/">
            <BookOpen className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">
              DataJourney Narrator
            </span>
          </a>
          <nav className="flex items-center gap-6 text-sm">
            <Button
              variant="ghost"
              className={cn(
                "h-8 gap-1",
                activeView === "dashboard" && "bg-accent text-accent-foreground"
              )}
              onClick={() => setActiveView("dashboard")}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>
            <Button
              variant="ghost"
              className={cn(
                "h-8 gap-1",
                activeView === "map" && "bg-accent text-accent-foreground"
              )}
              onClick={() => setActiveView("map")}
            >
              <Map className="h-4 w-4" />
              Map
            </Button>
            <Button
              variant="ghost"
              className={cn(
                "h-8 gap-1",
                activeView === "list" && "bg-accent text-accent-foreground"
              )}
              onClick={() => setActiveView("list")}
            >
              <ListFilter className="h-4 w-4" />
              List
            </Button>
            <Button
              variant="ghost"
              className={cn(
                "h-8 gap-1",
                activeView === "timeline" && "bg-accent text-accent-foreground"
              )}
              onClick={() => setActiveView("timeline")}
            >
              <Timeline className="h-4 w-4" />
              Timeline
            </Button>
            <Button
              variant="ghost"
              className={cn(
                "h-8 gap-1",
                activeView === "timeseries" && "bg-accent text-accent-foreground"
              )}
              onClick={() => setActiveView("timeseries")}
            >
              <LineChart className="h-4 w-4" />
              Time Series
            </Button>
            <Button
              variant="ghost"
              className={cn(
                "h-8 gap-1",
                activeView === "story" && "bg-accent text-accent-foreground"
              )}
              onClick={() => setActiveView("story")}
            >
              <BookOpen className="h-4 w-4" />
              Story
            </Button>
            <Button
              variant="ghost"
              className={cn(
                "h-8 gap-1",
                activeView === "qa" && "bg-accent text-accent-foreground"
              )}
              onClick={() => setActiveView("qa")}
            >
              <MessageSquare className="h-4 w-4" />
              Q&A
            </Button>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-full justify-start text-sm text-muted-foreground md:w-[240px]"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="mr-2 h-4 w-4" />
              Search logs...
              <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                ⌘K
              </kbd>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default LogHeader;
