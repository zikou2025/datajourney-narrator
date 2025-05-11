
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const BreakingNewsCard: React.FC = () => {
  return (
    <Card className="mb-8 border-red-500/20 bg-gradient-to-r from-red-50/20 to-background dark:from-red-900/10 dark:to-background">
      <CardHeader className="pb-3 border-b border-red-200/20">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <Badge variant="destructive" className="mr-2 bg-red-500">Breaking</Badge>
            Breaking News
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-xs" asChild>
            <Link to="/legacy-news">View All</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <h3 className="text-xl font-bold mb-3">Major Policy Changes Announced for Urban Development Projects</h3>
        <p className="text-muted-foreground mb-4">
          Government officials have just released new guidelines that will significantly impact planning and permitting processes for all metropolitan construction projects.
        </p>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            <span>20 minutes ago</span>
          </div>
          <Button size="sm" variant="default" className="bg-red-500 hover:bg-red-600">Read More</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BreakingNewsCard;
