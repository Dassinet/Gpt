"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  Search,
  Bot,
  Calendar,
  FileText,
  MessageSquare,
  Star,
  User,
  Heart
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { getUser, getToken, isAuthenticated } from '@/lib/auth';
import axios from 'axios';

const UserDashboard = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [assignedGpts, setAssignedGpts] = useState([]);
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [addingToFavourites, setAddingToFavourites] = useState({});

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated()) {
        toast.error('Please login to access this page');
        router.push('/auth/sign-in');
        return;
      }

      const currentUser = getUser();
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
          config.headers['Content-Type'] = 'application/json';
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
    };
  }, []);

  // Fetch assigned GPTs and favourites
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        const userId = user.userId;
        
        // Fetch GPTs assigned to this user
        const assignedGptsResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/gpt/assigned/${userId}`,
          {
            headers: {
              'Authorization': `Bearer ${getToken()}`,
              'Content-Type': 'application/json'
            },
            timeout: 5000
          }
        );
        
        if (assignedGptsResponse.data.success) {
          setAssignedGpts(assignedGptsResponse.data.assignedGpts || []);
        }

        // Fetch user's favourites
        const favouritesResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/gpt/favourites/${userId}`,
          {
            headers: {
              'Authorization': `Bearer ${getToken()}`,
              'Content-Type': 'application/json'
            },
            timeout: 5000
          }
        );

        if (favouritesResponse.data.success) {
          setFavourites(favouritesResponse.data.favourites || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        if (error.response?.status === 401) {
          toast.error('Session expired. Please login again.');
          router.push('/auth/sign-in');
        } else {
          toast.error('Failed to fetch data');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, router]);

  // Check if GPT is in favourites
  const isGptInFavourites = (gptId) => {
    return favourites.some(fav => fav.gpt._id === gptId);
  };

  // Add to favourites
  const handleAddToFavourites = async (gptId) => {
    if (addingToFavourites[gptId]) return;
    
    setAddingToFavourites(prev => ({ ...prev, [gptId]: true }));
    
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/gpt/${gptId}/favourites`,
        { folder: 'Uncategorized' },
        {
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast.success('Added to favourites');
        const favouritesResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/gpt/favourites/${user.userId}`,
          {
            headers: {
              'Authorization': `Bearer ${getToken()}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (favouritesResponse.data.success) {
          setFavourites(favouritesResponse.data.favourites || []);
        }
      }
    } catch (error) {
      console.error('Error adding to favourites:', error);
      toast.error('Failed to add to favourites');
    } finally {
      setAddingToFavourites(prev => ({ ...prev, [gptId]: false }));
    }
  };

  // Remove from favourites
  const handleRemoveFromFavourites = async (gptId) => {
    if (addingToFavourites[gptId]) return;
    
    setAddingToFavourites(prev => ({ ...prev, [gptId]: true }));
    
    try {
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/gpt/favourites/${gptId}`,
        {
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast.success('Removed from favourites');
        const favouritesResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/gpt/favourites/${user.userId}`,
          {
            headers: {
              'Authorization': `Bearer ${getToken()}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (favouritesResponse.data.success) {
          setFavourites(favouritesResponse.data.favourites || []);
        }
      }
    } catch (error) {
      console.error('Error removing from favourites:', error);
      toast.error('Failed to remove from favourites');
    } finally {
      setAddingToFavourites(prev => ({ ...prev, [gptId]: false }));
    }
  };

  // Filter GPTs based on search term
  const filteredGpts = assignedGpts.filter(gpt =>
    gpt?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gpt?.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    if (capabilities?.hybridSearch) badges.push('Hybrid Search');
    if (capabilities?.imageAnalysis) badges.push('Image Analysis');
    return badges;
  };

  // Handle start conversation with validation
  const handleStartConversation = (gpt) => {
    // Validate GPT ID before navigation
    if (!gpt._id || !gpt._id.match(/^[0-9a-fA-F]{24}$/)) {
      toast.error('Invalid GPT ID. Please refresh the page.');
      return;
    }
    
    // Check if GPT is still available
    if (!gpt.name || !gpt.description) {
      toast.error('This GPT appears to be corrupted. Please contact support.');
      return;
    }
    
    router.push(`/user/chat/${gpt._id}`);
  };

  if (loading) {  
    return (
      <div className="container mx-auto px-4 py-6 space-y-6 max-w-7xl bg-gray-100 dark:bg-[#1A1A1A] min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-300 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-300 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (  
    <div className="container mx-auto px-4 py-6 space-y-6 max-w-7xl bg-gray-100 dark:bg-[#1A1A1A] min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0 w-full sm:w-auto">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white break-words line-clamp-2">
            Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 break-words">
            Manage your GPTs
          </p>
        </div>
        <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search GPTs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9 text-sm bg-white dark:bg-[#2A2A2A] border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 w-full"
            />
          </div>
          <Button 
            onClick={() => router.push('/user/favourites')}
            variant="outline"
            className="h-9 text-sm border-gray-200 dark:border-gray-700 whitespace-nowrap"
          >
            <Heart className="mr-2 h-4 w-4" />
            Favourites
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white dark:bg-[#2A2A2A] border-gray-200 dark:border-gray-700 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1 mr-2">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 break-words line-clamp-2">My GPTs</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{assignedGpts.length}</p>
              </div>
              <Bot className="h-6 w-6 text-purple-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-[#2A2A2A] border-gray-200 dark:border-gray-700 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Favourites</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{favourites.length}</p>
              </div>
              <Heart className="h-6 w-6 text-red-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-[#2A2A2A] border-gray-200 dark:border-gray-700 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate">With Knowledge</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {assignedGpts.filter(gpt => gpt?.knowledgeFiles?.length > 0).length}
                </p>
              </div>
              <FileText className="h-6 w-6 text-green-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-[#2A2A2A] border-gray-200 dark:border-gray-700 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Featured</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {Math.min(assignedGpts.length, 3)}
                </p>
              </div>
              <Star className="h-6 w-6 text-yellow-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* GPTs Grid */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">
          My Assigned GPTs ({filteredGpts.length})
        </h2>
        
        {filteredGpts.length === 0 ? (
          <div className="text-center py-12">
            <Bot className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
            <p className="text-lg font-medium text-gray-500 dark:text-gray-400 mt-4">
              {searchTerm 
                ? 'No GPTs found matching your search' 
                : 'No GPTs have been assigned to you yet'}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              {searchTerm 
                ? 'Try adjusting your search terms' 
                : 'Contact your administrator to get access to GPTs'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredGpts.map((gpt) => (
              <Card key={gpt._id} className="bg-white dark:bg-[#2A2A2A] border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow overflow-hidden h-full flex flex-col">
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
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (isGptInFavourites(gpt._id)) {
                          handleRemoveFromFavourites(gpt._id);
                        } else {
                          handleAddToFavourites(gpt._id);
                        }
                      }}
                      disabled={addingToFavourites[gpt._id]}
                      className={`p-1 h-8 w-8 flex-shrink-0 ${
                        isGptInFavourites(gpt._id) 
                          ? 'text-red-500 hover:text-red-600' 
                          : 'text-gray-400 hover:text-red-500'
                      }`}
                    >
                      <Heart 
                        className={`h-4 w-4 ${
                          isGptInFavourites(gpt._id) ? 'fill-current' : ''
                        }`} 
                      />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex-1 flex flex-col overflow-hidden">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 break-words line-clamp-3 leading-relaxed hyphens-auto">
                    {gpt.description}
                  </p>
                  
                  <div className="space-y-2 sm:space-y-3 mt-auto">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 overflow-hidden">
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
                      onClick={() => handleStartConversation(gpt)} 
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
    </div>
  );
};

export default UserDashboard;