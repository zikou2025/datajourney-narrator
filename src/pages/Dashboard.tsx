import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LogMap from '@/components/LogMap';
import LogTable from '@/components/LogTable';
import LogTimeline from '@/components/LogTimeline';
import TimeSeriesView from '@/components/TimeSeriesView';
import StorytellingView from '@/components/StorytellingView';
import TranscriptionQA from '@/components/TranscriptionQA';
import { LogEntry } from '@/lib/types';
import { Bell, LogOut, User } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const navigate = useNavigate();

  const handleSelectLog = (log: LogEntry) => {
    setSelectedLog(log);
  };

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/');
        return;
      }
      setUser(session.user);
      setLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">CN</span>
              </div>
              <span className="text-xl font-bold">ConstructNews Dashboard</span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <User className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.email}</h1>
          <p className="text-muted-foreground">Access your exclusive construction industry insights</p>
        </div>

        <Tabs defaultValue="map" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="map">Map</TabsTrigger>
            <TabsTrigger value="list">List</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="timeseries">TimeSeries</TabsTrigger>
            <TabsTrigger value="story">Story</TabsTrigger>
            <TabsTrigger value="qa">Q&A</TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Construction Activity Map</CardTitle>
              </CardHeader>
              <CardContent>
                <LogMap 
                  logs={logs} 
                  selectedLocation={selectedLocation}
                  setSelectedLocation={setSelectedLocation}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="list" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Activity List</CardTitle>
              </CardHeader>
              <CardContent>
                <LogTable logs={logs} onSelectLog={handleSelectLog} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <LogTimeline logs={logs} onSelectLog={handleSelectLog} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeseries" className="mt-6">
            <TimeSeriesView logs={logs} />
          </TabsContent>

          <TabsContent value="story" className="mt-6">
            <StorytellingView logs={logs} />
          </TabsContent>

          <TabsContent value="qa" className="mt-6">
            <TranscriptionQA logs={logs} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;