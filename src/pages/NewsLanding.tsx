
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

// Placeholder data - In a real application, this would come from an API
const headlines = [
  {
    id: 1,
    title: "Major Construction Project Launches in Downtown Area",
    excerpt: "The city has approved a $50M construction project that will transform the downtown skyline.",
    category: "Infrastructure",
    date: new Date(2023, 4, 15),
    author: "Jane Smith",
    image: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2670&auto=format&fit=crop",
    trending: true,
    comments: 24
  },
  {
    id: 2,
    title: "New Environmental Regulations Coming Next Month",
    excerpt: "Companies will need to comply with stricter emissions standards starting June 1st.",
    category: "Regulatory",
    date: new Date(2023, 4, 14),
    author: "Michael Johnson",
    image: "https://images.unsplash.com/photo-1623110195982-3df7bd8e80c5?q=80&w=2670&auto=format&fit=crop",
    trending: false,
    comments: 12
  },
  {
    id: 3,
    title: "Technology Adoption Rates Soar in Construction Industry",
    excerpt: "Survey shows 70% of construction firms have implemented new tech solutions in the past year.",
    category: "Technology",
    date: new Date(2023, 4, 12),
    author: "Alex Chen",
    image: "https://images.unsplash.com/photo-1517404215738-15263e9f9178?q=80&w=2670&auto=format&fit=crop",
    trending: true,
    comments: 31
  },
  {
    id: 4,
    title: "Safety Training Initiative Reduces Workplace Incidents by 40%",
    excerpt: "New comprehensive safety program proves highly effective across multiple sites.",
    category: "Safety",
    date: new Date(2023, 4, 10),
    author: "Sarah Johnson",
    image: "https://images.unsplash.com/photo-1518709414768-a88981a4515d?q=80&w=2574&auto=format&fit=crop",
    trending: false,
    comments: 8
  },
  {
    id: 5,
    title: "Supply Chain Disruptions Expected to Continue Through Q3",
    excerpt: "Industry experts predict ongoing challenges with material availability and pricing.",
    category: "Supply Chain",
    date: new Date(2023, 4, 8),
    author: "Robert Miller",
    image: "https://images.unsplash.com/photo-1566995541428-ff6f0b3f7304?q=80&w=2672&auto=format&fit=crop",
    trending: true,
    comments: 17
  }
];

const upcomingEvents = [
  {
    id: 1,
    title: "Sustainable Building Materials Expo",
    date: new Date(2023, 5, 20),
    location: "Convention Center",
    type: "Conference"
  },
  {
    id: 2,
    title: "Safety Certification Workshop",
    date: new Date(2023, 5, 15),
    location: "Training Center",
    type: "Workshop"
  },
  {
    id: 3,
    title: "Industry Networking Mixer",
    date: new Date(2023, 5, 10),
    location: "Downtown Hotel",
    type: "Networking"
  }
];

const categories = [
  "All", "Infrastructure", "Technology", "Regulatory", 
  "Safety", "Supply Chain", "Sustainability", "Business", "Innovation"
];

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
  
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/10 via-primary/5 to-background pt-16 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Construction Industry News & Insights
            </h1>
            <p className="text-xl text-muted-foreground mb-6">
              Stay informed with the latest updates, trends, and developments in the construction sector
            </p>
            <div className="flex gap-4">
              <Button>Latest Updates</Button>
              <Button variant="outline">Subscribe</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Search and Category Filter */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search news..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <ScrollArea className="w-full md:w-auto">
                <div className="flex space-x-2 pb-2">
                  {categories.map(category => (
                    <Button
                      key={category}
                      variant={activeCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveCategory(category)}
                      className="whitespace-nowrap"
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
            
            {/* Breaking News */}
            <Card className="mb-8 border-red-500/20 bg-red-50/10 dark:bg-red-900/5">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center">
                    <Badge variant="destructive" className="mr-2">Breaking</Badge>
                    Breaking News
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-xs">View All</Button>
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="text-xl font-bold mb-2">Major Policy Changes Announced for Urban Development Projects</h3>
                <p className="text-muted-foreground mb-4">
                  Government officials have just released new guidelines that will significantly impact planning and permitting processes for all metropolitan construction projects.
                </p>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>20 minutes ago</span>
                  </div>
                  <Button size="sm" variant="outline">Read More</Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Featured Headlines */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Top Headlines</h2>
                <Button variant="ghost" size="sm">View All</Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredHeadlines.slice(0, 4).map(headline => (
                  <Card key={headline.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="aspect-video relative overflow-hidden">
                      <img 
                        src={headline.image} 
                        alt={headline.title} 
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" 
                      />
                      <Badge className="absolute top-2 right-2" variant="secondary">{headline.category}</Badge>
                      {headline.trending && (
                        <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md flex items-center">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Trending
                        </div>
                      )}
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg line-clamp-2">{headline.title}</CardTitle>
                      <CardDescription className="flex items-center text-xs">
                        <Calendar className="h-3 w-3 mr-1" />
                        {format(headline.date, 'MMM d, yyyy')}
                        <Separator orientation="vertical" className="mx-2 h-3" />
                        {headline.author}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <p className="text-muted-foreground text-sm line-clamp-2">{headline.excerpt}</p>
                    </CardContent>
                    <CardFooter className="pt-0 flex justify-between">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        {headline.comments} comments
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <Share className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <Bookmark className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
            
            {/* Category Tabs */}
            <Tabs defaultValue="technology" className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">News by Category</h2>
                <TabsList>
                  <TabsTrigger value="technology">Technology</TabsTrigger>
                  <TabsTrigger value="safety">Safety</TabsTrigger>
                  <TabsTrigger value="regulatory">Regulatory</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="technology" className="space-y-4">
                {headlines.filter(h => h.category === "Technology").map(headline => (
                  <Card key={headline.id}>
                    <CardHeader>
                      <CardTitle>{headline.title}</CardTitle>
                      <CardDescription>{format(headline.date, 'MMMM d, yyyy')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p>{headline.excerpt}</p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="ml-auto">Read More</Button>
                    </CardFooter>
                  </Card>
                ))}
              </TabsContent>
              
              <TabsContent value="safety" className="space-y-4">
                {headlines.filter(h => h.category === "Safety").map(headline => (
                  <Card key={headline.id}>
                    <CardHeader>
                      <CardTitle>{headline.title}</CardTitle>
                      <CardDescription>{format(headline.date, 'MMMM d, yyyy')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p>{headline.excerpt}</p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="ml-auto">Read More</Button>
                    </CardFooter>
                  </Card>
                ))}
              </TabsContent>
              
              <TabsContent value="regulatory" className="space-y-4">
                {headlines.filter(h => h.category === "Regulatory").map(headline => (
                  <Card key={headline.id}>
                    <CardHeader>
                      <CardTitle>{headline.title}</CardTitle>
                      <CardDescription>{format(headline.date, 'MMMM d, yyyy')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p>{headline.excerpt}</p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="ml-auto">Read More</Button>
                    </CardFooter>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-8">
            {/* Next Event */}
            <Card className="bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Next Industry Event
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingEvents[0] && (
                  <>
                    <h3 className="text-xl font-bold mb-2">{upcomingEvents[0].title}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{format(upcomingEvents[0].date, 'MMMM d, yyyy')}</span>
                      </div>
                      <div className="flex items-start">
                        <MessageSquare className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                        <span>{upcomingEvents[0].location}</span>
                      </div>
                      <Badge variant="outline">{upcomingEvents[0].type}</Badge>
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter>
                <Button className="w-full">Register Now</Button>
              </CardFooter>
            </Card>
            
            {/* All Events */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
                <CardDescription>Mark your calendar for these industry gatherings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingEvents.slice(1).map(event => (
                  <div key={event.id} className="flex items-start">
                    <div className="bg-muted rounded-md p-2 mr-4 text-center w-14">
                      <div className="text-xs uppercase">{format(event.date, 'MMM')}</div>
                      <div className="text-lg font-bold">{format(event.date, 'd')}</div>
                    </div>
                    <div>
                      <h4 className="font-medium">{event.title}</h4>
                      <p className="text-sm text-muted-foreground">{event.location}</p>
                      <Badge variant="outline" className="mt-1">{event.type}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">View All Events</Button>
              </CardFooter>
            </Card>
            
            {/* Popular Tags */}
            <Card>
              <CardHeader>
                <CardTitle>Popular Topics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {["Construction", "Safety", "Technology", "Urban Planning", 
                   "Sustainability", "Materials", "Equipment", "Regulations", 
                   "Project Management", "Design", "Innovation"].map(tag => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer">{tag}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Newsletter */}
            <Card>
              <CardHeader>
                <CardTitle>Stay Updated</CardTitle>
                <CardDescription>Subscribe to our weekly industry newsletter</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input placeholder="Your email address" />
                <Button className="w-full">Subscribe</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsLanding;
