"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye, 
  Plus, 
  Search,
  Filter,
  Bot,
  Calendar,
  User,
  Globe,
  FileText,
  Image as ImageIcon,
  Brain,
  MessageSquare,
  Star,
  RefreshCw,
  Heart
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { getUser, getUserRole, getToken, isAuthenticated } from '@/lib/auth';
import axios from 'axios';

const AdminCollections = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  
  const [gpts, setGpts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGpt, setSelectedGpt] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Check authentication and admin role
  useEffect(() => {
    const checkAuth = () => {
      if (!isAuthenticated()) {
        toast.error('Please login to access this page');
        router.push('/auth/sign-in');
        return;
      }

      const currentUser = getUser();
      const userRole = getUserRole();

      if (!currentUser || userRole !== 'admin') {
        toast.error('Access denied. Admin privileges required.');
        router.push('/admin/dashboard');
        return;
      }

      setUser(currentUser);
    };

    checkAuth();
  }, [router]);

  // Configure axios
  useEffect(() => {
    axios.defaults.withCredentials = true;
    
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = getToken();
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
    };
  }, []);

  // Fetch all GPTs
  const fetchGpts = useCallback(async () => {
    try {
      setLoading(true);
      
      console.log("Fetching GPTs...");
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/gpt/all`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });
      
      if (response.data.success) {
        const gptData = response.data.customGpts || [];
        console.log("Received GPT data:", gptData);
        
        const validatedGpts = gptData.map(gpt => ({
          ...gpt,
          name: gpt.name || "Unnamed GPT",
          description: gpt.description || "No description",
          model: gpt.model || "default",
          capabilities: gpt.capabilities || { webBrowsing: true }
        }));
        
        setGpts(validatedGpts);
      } else {
        throw new Error("API returned success: false");
      }
    } catch (error) {
      console.error('Error fetching GPTs:', error);
      toast.error('Failed to fetch GPTs');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    if (user && getUserRole() === 'admin') {
      fetchGpts();
    }
  }, [user, fetchGpts]);

  // Filter GPTs based on search term
  const filteredGpts = gpts.filter(gpt =>
    gpt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gpt.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gpt.createdBy?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gpt.createdBy?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Delete GPT
  const handleDelete = async () => {
    if (!selectedGpt) return;

    try {
      setDeleting(true);
      const response = await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/gpt/${selectedGpt._id}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });
      
      if (response.data.success) {
        toast.success('GPT deleted successfully');
        setGpts(gpts.filter(gpt => gpt._id !== selectedGpt._id));
        setDeleteDialogOpen(false);
        setSelectedGpt(null);
      }
    } catch (error) {
      console.error('Error deleting GPT:', error);
      toast.error(error.response?.data?.message || 'Failed to delete GPT');
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = (gptId) => {
    router.push(`/admin/create-gpt?id=${gptId}`);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get capability badges
  const getCapabilityBadges = (capabilities) => {
    const badges = [];
    if (capabilities?.webBrowsing) badges.push('Web Browsing');
    if (capabilities?.mcp) badges.push('MCP');
    if (capabilities?.hybridSearch) badges.push('Hybrid Search');
    if (capabilities?.imageAnalysis) badges.push('Image Analysis');
    return badges;
  };

  if (loading) {  
    return (
      <div className="p-6 space-y-6 bg-gray-100 dark:bg-[#1A1A1A] min-h-full rounded-lg">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-300 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 bg-gray-100 dark:bg-[#1A1A1A] min-h-full rounded-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="w-full sm:w-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-center sm:text-left">GPT Collections</h1>
          <p className="text-muted-foreground text-center sm:text-left">Manage your custom GPTs</p>
        </div>
        <div className="w-full sm:w-auto self-stretch">
          <Button 
            onClick={() => router.push('/admin/create-gpt')}
            className="bg-purple-600 hover:bg-purple-700 text-white cursor-pointer w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New GPT
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center w-full">
        <div className="relative w-full max-w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search GPTs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </div>

      {/* GPTs Grid */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          All GPTs ({filteredGpts.length})
        </h2>
        
        {filteredGpts.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <Bot className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 dark:text-gray-600" />
            <p className="text-base sm:text-lg font-medium text-gray-500 dark:text-gray-400 mt-4">
              {searchTerm 
                ? 'No GPTs found matching your search' 
                : 'No GPTs created yet'}
            </p>
            <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 mt-2">
              {searchTerm 
                ? 'Try adjusting your search terms' 
                : 'Create your first GPT to get started'}
            </p>
            {!searchTerm && (
              <Button 
                onClick={() => router.push('/admin/create-gpt')}
                className="mt-4 bg-purple-600 hover:bg-purple-700 text-white"
              >
                Create Your First GPT
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {filteredGpts.map((gpt) => (
              <Card 
                key={gpt._id} 
                className="bg-white dark:bg-[#2A2A2A] border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow group flex flex-col h-full overflow-hidden"
              >
                <CardHeader className="p-4 pb-2 sm:pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 max-w-[calc(100%-40px)] overflow-hidden">
                      {gpt.imageUrl ? (
                        <img 
                          src={gpt.imageUrl} 
                          alt={gpt.name}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
                          <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white break-words line-clamp-2 leading-tight">
                          {gpt.name}
                        </CardTitle>
                        <div className="flex items-center gap-1 sm:gap-2 mt-1 flex-wrap">
                          <Badge variant="outline" className="text-xs whitespace-nowrap max-w-full truncate">
                            {gpt.model || 'Default Model'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-70 sm:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/admin/chat/${gpt._id}`)}>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Start Chat
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(gpt._id)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedGpt(gpt);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex-1 flex flex-col overflow-hidden">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 break-words line-clamp-3 leading-relaxed hyphens-auto">
                    {gpt.description}
                  </p>
                  
                  <div className="space-y-2 sm:space-y-3 mt-auto">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 overflow-hidden">
                      <User className="h-3 w-3 flex-shrink-0" />
                      <span className="break-words truncate">
                        {gpt.createdBy?.firstName} {gpt.createdBy?.lastName}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <Calendar className="h-3 w-3 flex-shrink-0" />
                      <span className="break-words truncate">{formatDate(gpt.createdAt)}</span>
                    </div>
                    
                    {gpt.knowledgeFiles?.length > 0 && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 overflow-hidden">
                        <FileText className="h-3 w-3 flex-shrink-0" />
                        <span className="break-words truncate">{gpt.knowledgeFiles.length} knowledge files</span>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-1 min-h-[20px] overflow-hidden">
                      {getCapabilityBadges(gpt.capabilities).map((capability) => (
                        <Badge key={capability} variant="outline" className="text-xs break-words max-w-full">
                          {capability}
                        </Badge>
                      ))}
                    </div>
                    
                    <Button 
                      onClick={() => router.push(`/admin/chat/${gpt._id}`)}
                      className="w-full mt-2 bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm"
                    >
                      <MessageSquare className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      Start Chat
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-[90%] sm:max-w-md md:max-w-lg mx-auto">
          <DialogHeader>
            <DialogTitle>Delete GPT</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedGpt?.name}"? This action cannot be undone and will permanently remove all associated files and data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleting}
              className="w-full sm:w-auto"
            >
              {deleting ? 'Deleting...' : 'Delete GPT'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCollections;