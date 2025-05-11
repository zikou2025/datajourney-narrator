
import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TranscriptionQA from '@/components/TranscriptionQA';
import ContentManager from '@/components/admin/ContentManager';
import { Separator } from '@/components/ui/separator';
import { LogOut, LayoutDashboard, FileText, Settings, Users, Bell } from 'lucide-react';

// Simple in-memory authentication for demo purposes
// In a real app, you'd use Supabase or another auth provider
const ADMIN_PASSWORD = "admin123";

const Admin: React.FC = () => {
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Check if admin is already logged in
  useEffect(() => {
    const isAdminAuthenticated = localStorage.getItem('adminAuthenticated') === 'true';
    setAuthenticated(isAdminAuthenticated);
  }, []);
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem('adminAuthenticated', 'true');
      setAuthenticated(true);
      setError(null);
    } else {
      setError("Invalid password");
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('adminAuthenticated');
    setAuthenticated(false);
    navigate('/');
  };
  
  if (!authenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>Enter your password to access the admin panel</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Input
                    id="password"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  {error && <p className="text-sm text-destructive">{error}</p>}
                </div>
                <Button type="submit">Login</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <div className="grid grid-cols-[240px_1fr] h-screen">
        {/* Admin Sidebar */}
        <div className="border-r bg-card p-4">
          <div className="flex items-center gap-2 mb-8">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
          </div>
          
          <nav className="space-y-1">
            <Button variant="ghost" className="w-full justify-start" asChild>
              <a href="#content" className="flex items-center">
                <FileText className="mr-2 h-4 w-4" />
                Content Management
              </a>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <a href="#transcription" className="flex items-center">
                <FileText className="mr-2 h-4 w-4" />
                Transcription Tools
              </a>
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Users className="mr-2 h-4 w-4" />
              User Management
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <Separator className="my-4" />
            <Button variant="ghost" className="w-full justify-start text-red-500" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </nav>
        </div>
        
        {/* Main Content */}
        <div className="p-6 overflow-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Admin Dashboard</h2>
            <Button variant="outline" size="sm" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </Button>
          </div>
          
          <Tabs defaultValue="content" className="space-y-6">
            <TabsList>
              <TabsTrigger value="content">Content Manager</TabsTrigger>
              <TabsTrigger value="transcription">Transcription Tools</TabsTrigger>
            </TabsList>
            
            <TabsContent value="content" id="content" className="space-y-6">
              <ContentManager />
            </TabsContent>
            
            <TabsContent value="transcription" id="transcription">
              <TranscriptionQA logs={[]} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Admin;
