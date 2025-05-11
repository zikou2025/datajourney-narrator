
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Newspaper, Search, Menu, Bell, User } from 'lucide-react';

const NewsNavbar: React.FC = () => {
  return (
    <nav className="bg-black text-white py-3 sticky top-0 z-50 border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo and Main Navigation */}
          <div className="flex items-center gap-6">
            <Link to="/legacy-news" className="flex items-center gap-2 font-bold text-xl">
              <Newspaper className="h-6 w-6 text-primary" />
              <span>ConstructNews</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-4">
              <Button variant="ghost" className="text-white hover:text-white/80 hover:bg-white/10" asChild>
                <Link to="/legacy-news">Headlines</Link>
              </Button>
              <Button variant="ghost" className="text-white hover:text-white/80 hover:bg-white/10">
                Industry
              </Button>
              <Button variant="ghost" className="text-white hover:text-white/80 hover:bg-white/10">
                Technology
              </Button>
              <Button variant="ghost" className="text-white hover:text-white/80 hover:bg-white/10">
                Sustainability
              </Button>
            </div>
          </div>
          
          {/* Action Items */}
          <div className="flex items-center gap-2">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search news..."
                className="pl-10 bg-gray-800 border-gray-700 text-white w-[200px] focus-visible:ring-primary"
              />
            </div>
            
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" asChild>
              <Link to="/admin">
                <User className="h-5 w-5" />
              </Link>
            </Button>
            
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <Bell className="h-5 w-5" />
            </Button>
            
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NewsNavbar;
