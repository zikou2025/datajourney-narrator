
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, Plus, Edit, Trash2, Calendar, Clock } from 'lucide-react';
import { headlines, categories } from '@/lib/newsData';
import { format } from 'date-fns';

const ContentManager: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isEditing, setIsEditing] = useState(false);
  const [editingHeadline, setEditingHeadline] = useState<any>(null);
  
  // Filter headlines based on search term and category
  const filteredHeadlines = headlines.filter(headline => {
    const matchesSearch = headline.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          headline.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || headline.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  
  const handleEdit = (headline: any) => {
    setEditingHeadline({...headline});
    setIsEditing(true);
  };
  
  const handleSave = () => {
    // In a real app, you would save to the database here
    alert('Changes saved! (In a real app, this would update the database)');
    setIsEditing(false);
    setEditingHeadline(null);
  };
  
  const handleCancel = () => {
    setIsEditing(false);
    setEditingHeadline(null);
  };
  
  const handleDelete = (id: number) => {
    // In a real app, you would delete from the database
    if (confirm('Are you sure you want to delete this article?')) {
      alert(`Article ${id} would be deleted in a real app`);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Content Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="articles">
            <TabsList>
              <TabsTrigger value="articles">Articles</TabsTrigger>
              <TabsTrigger value="create">Create New</TabsTrigger>
            </TabsList>
            
            <TabsContent value="articles" className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 py-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input 
                    placeholder="Search articles..." 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHeadlines.map(headline => (
                      <TableRow key={headline.id}>
                        <TableCell className="font-medium">{headline.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{headline.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5 mr-1" />
                            {format(headline.date, 'MMM d, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={headline.trending ? "default" : "secondary"}>
                            {headline.trending ? 'Trending' : 'Published'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEdit(headline)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDelete(headline.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="create">
              <div className="space-y-4 py-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <Input placeholder="Article title" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.filter(c => c !== 'All').map(category => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Author</label>
                    <Input placeholder="Author name" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Excerpt</label>
                  <Textarea placeholder="Brief excerpt of the article" rows={3} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Content</label>
                  <Textarea placeholder="Full article content" rows={10} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Image URL</label>
                  <Input placeholder="https://example.com/image.jpg" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline">Save Draft</Button>
                  <Button>Publish</Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Edit Modal */}
      {isEditing && editingHeadline && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Edit Article</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <Input 
                  value={editingHeadline.title}
                  onChange={e => setEditingHeadline({...editingHeadline, title: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <Select 
                    value={editingHeadline.category}
                    onValueChange={(value) => setEditingHeadline({...editingHeadline, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.filter(c => c !== 'All').map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Author</label>
                  <Input 
                    value={editingHeadline.author}
                    onChange={e => setEditingHeadline({...editingHeadline, author: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Excerpt</label>
                <Textarea 
                  rows={3}
                  value={editingHeadline.excerpt}
                  onChange={e => setEditingHeadline({...editingHeadline, excerpt: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                <Button onClick={handleSave}>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ContentManager;
