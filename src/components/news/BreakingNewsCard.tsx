
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from 'lucide-react';

const BreakingNewsCard: React.FC = () => {
  return (
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
  );
};

export default BreakingNewsCard;
