import React from 'react';
import { Calendar, MapPin, Clipboard, BarChart, Search, X, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

interface LogHeaderProps {
  activeView: 'dashboard' | 'map' | 'list' | 'timeline' | 'network';
  setActiveView: (view: 'dashboard' | 'map' | 'list' | 'timeline' | 'network') => void;
  setSearchOpen: (open: boolean) => void;
}

const LogHeader: React.FC<LogHeaderProps> = ({ activeView, setActiveView, setSearchOpen }) => {
  const isMobile = useIsMobile();
  
  const navigationItems = [
    { view: 'dashboard', label: 'Dashboard', icon: <BarChart className="w-5 h-5" /> },
    { view: 'map', label: 'Map View', icon: <MapPin className="w-5 h-5" /> },
    { view: 'list', label: 'List View', icon: <Clipboard className="w-5 h-5" /> },
    { view: 'timeline', label: 'Timeline', icon: <Calendar className="w-5 h-5" /> },
    { view: 'network', label: 'Network', icon: (
      <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
    ) },
  ];
  
  const renderNavigation = () => (
    <nav className="flex items-center space-x-1">
      {navigationItems.map((item) => (
        <button
          key={item.view}
          onClick={() => setActiveView(item.view as any)}
          className={`flex items-center p-2 rounded-md transition-colors ${
            activeView === item.view
              ? 'text-primary bg-primary/10'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
        >
          {item.icon}
          <span className="ml-2 hidden md:inline">{item.label}</span>
        </button>
      ))}
    </nav>
  );
  
  return (
    <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-medium flex items-center mr-8">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6 mr-2 text-primary"
            >
              <path d="M14 3v4a1 1 0 0 0 1 1h4" />
              <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
              <path d="M12 17v-6" />
              <path d="M9 14l3 3 3-3" />
            </svg>
            Activity Logger
          </h1>
          
          {!isMobile && renderNavigation()}
        </div>
        
        <div className="flex items-center">
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>
          
          {isMobile && (
            <Sheet>
              <SheetTrigger asChild>
                <button className="ml-2 p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                  <Menu className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[240px] sm:w-[300px]">
                <div className="py-4">
                  <div className="flex items-center mb-6">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-6 h-6 mr-2 text-primary"
                    >
                      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                      <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
                      <path d="M12 17v-6" />
                      <path d="M9 14l3 3 3-3" />
                    </svg>
                    <h2 className="text-xl font-medium">Activity Logger</h2>
                  </div>
                  
                  <nav className="flex flex-col space-y-1">
                    {navigationItems.map((item) => (
                      <button
                        key={item.view}
                        onClick={() => setActiveView(item.view as any)}
                        className={`flex items-center p-3 rounded-md transition-colors ${
                          activeView === item.view
                            ? 'text-primary bg-primary/10'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        }`}
                      >
                        {item.icon}
                        <span className="ml-2">{item.label}</span>
                      </button>
                    ))}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </header>
  );
};

export default LogHeader;
