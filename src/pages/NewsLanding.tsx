
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from 'date-fns';
import { Calendar, Clock, MessageSquare, Share, Bookmark, ChevronRight, Search, TrendingUp } from 'lucide-react';
import NewsHero from '@/components/news/NewsHero';
import NewsFilters from '@/components/news/NewsFilters';
import BreakingNewsCard from '@/components/news/BreakingNewsCard';
import HeadlinesGrid from '@/components/news/HeadlinesGrid';
import CategoryNews from '@/components/news/CategoryNews';
import EventsSidebar from '@/components/news/EventsSidebar';
import { headlines, upcomingEvents, categories } from '@/lib/newsData';
import NewsNavbar from '@/components/news/NewsNavbar';

const NewsLanding: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filter headlines based on active category and search term
  const filteredHeadlines = headlines.filter(headline => {
    const matchesCategory = activeCategory === "All" || headline.category === activeCategory;
    const matchesSearch = headline.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          headline.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar - Ground News style */}
      <NewsNavbar />
      
      {/* Hero Section */}
      <NewsHero />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Search and Category Filter */}
            <NewsFilters 
              categories={categories}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
            />
            
            {/* Breaking News */}
            <BreakingNewsCard />
            
            {/* Featured Headlines */}
            <HeadlinesGrid headlines={filteredHeadlines} />
            
            {/* Category Tabs */}
            <CategoryNews headlines={headlines} />
            
            {/* Admin Access Button */}
            <div className="mt-8 text-center">
              <Button variant="outline" className="gap-2" asChild>
                <Link to="/admin">
                  Access Admin Dashboard
                </Link>
              </Button>
            </div>
          </div>
          
          {/* Sidebar */}
          <EventsSidebar events={upcomingEvents} />
        </div>
      </div>
    </div>
  );
};

export default NewsLanding;
