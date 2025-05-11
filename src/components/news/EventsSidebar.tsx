
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { Event } from "@/lib/newsData";

interface EventsSidebarProps {
  events: Event[];
}

const EventsSidebar: React.FC<EventsSidebarProps> = ({ events }) => {
  return (
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
          {events[0] && (
            <>
              <h3 className="text-xl font-bold mb-2">{events[0].title}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{format(events[0].date, 'MMMM d, yyyy')}</span>
                </div>
                <div className="flex items-start">
                  <MessageSquare className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                  <span>{events[0].location}</span>
                </div>
                <Badge variant="outline">{events[0].type}</Badge>
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
          {events.slice(1).map(event => (
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
  );
};

export default EventsSidebar;
