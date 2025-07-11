"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bot, Calendar, FileText, MessageSquare, Search, Heart, ArrowLeft, Folder } from 'lucide-react';
import { toast } from 'sonner';
import { getToken, getUser, isAuthenticated } from '@/lib/auth';
import axios from 'axios';

const FavouritesPage = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [removingFromFavourites, setRemovingFromFavourites] = useState({});

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

  // Fetch favourites
  useEffect(() => {
    const fetchFavourites = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        const userId = user.userId;
        
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/gpt/favourites/${userId}`,
          {
            headers: {
              'Authorization': `Bearer ${getToken()}`,
              'Content-Type': 'application/json'
            },
            timeout: 5000
          }
        );

        if (response.data.success) {
          setFavourites(response.data.favourites || []);
        }
      } catch (error) {
        console.error('Error fetching favourites:', error);
        if (error.response?.status === 401) {
          toast.error('Session expired. Please login again.');
          router.push('/auth/sign-in');
        } else {
          toast.error('Failed to fetch favourites');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFavourites();
  }, [user, router]);

  // Remove from favourites
  const handleRemoveFromFavourites = async (gptId) => {
    if (removingFromFavourites[gptId]) return;
    
    setRemovingFromFavourites(prev => ({ ...prev, [gptId]: true }));
    
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
        // Remove from local state
        setFavourites(prev => prev.filter(fav => fav.gpt._id !== gptId));
      }
    } catch (error) {
      console.error('Error removing from favourites:', error);
      toast.error('Failed to remove from favourites');
    } finally {
      setRemovingFromFavourites(prev => ({ ...prev, [gptId]: false }));
    }
  };

  // Get unique folders
  const folders = [...new Set(favourites.map(fav => fav.folder))];

  // Filter favourites based on search term and folder
  const filteredFavourites = favourites.filter(fav => {
    const matchesSearch = fav.gpt?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fav.gpt?.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFolder = selectedFolder === 'all' || fav.folder === selectedFolder;
    return matchesSearch && matchesFolder;
  });

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

  // Handle start conversation
  const handleStartConversation = (gpt) => {
    router.push(`/user/chat/${gpt._id}`);
  };

  // Group favourites by folder
  const groupedFavourites = filteredFavourites.reduce((acc, fav) => {
    const folder = fav.folder || 'Uncategorized';
    if (!acc[folder]) acc[folder] = [];
    acc[folder].push(fav);
    return acc;
  }, {});

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
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 text-center sm:text-left">
              <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
              Favourites
            </h1>
            <p className="text-muted-foreground text-center sm:text-left">Your favourite GPTs</p>
          </div>
        </div>
        <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search favourites..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <Select value={selectedFolder} onValueChange={setSelectedFolder}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="All Folders" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Folders</SelectItem>
              {folders.map(folder => (
                <SelectItem key={folder} value={folder}>
                  {folder}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="bg-white dark:bg-[#2A2A2A] border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Favourites</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{favourites.length}</p>
              </div>
              <Heart className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-[#2A2A2A] border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Folders</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{folders.length}</p>
              </div>
              <Folder className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-[#2A2A2A] border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Filtered</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredFavourites.length}</p>
              </div>
              <Search className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Favourites Content */}
      <div>
        {filteredFavourites.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <Heart className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 dark:text-gray-600" />
            <p className="text-base sm:text-lg font-medium text-gray-500 dark:text-gray-400 mt-4">
              {searchTerm || selectedFolder !== 'all'
                ? 'No favourites found matching your filters' 
                : 'No favourites yet'}
            </p>
            <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 mt-2">
              {searchTerm || selectedFolder !== 'all'
                ? 'Try adjusting your search or folder filter' 
                : 'Add some GPTs to your favourites from the dashboard'}
            </p>
            {(!searchTerm && selectedFolder === 'all') && (
              <Button 
                onClick={() => router.push('/user/dashboard')}
                className="mt-4"
              >
                Go to Dashboard
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {selectedFolder === 'all' ? (
              // Show grouped by folders
              Object.entries(groupedFavourites).map(([folder, favs]) => (
                <div key={folder} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Folder className="h-5 w-5 text-blue-500" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {folder} ({favs.length})
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                    {favs.map((fav) => (
                      <Card key={fav._id} className="bg-white dark:bg-[#2A2A2A] border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow h-full overflow-hidden flex flex-col">
                        <CardHeader className="p-4 pb-2 sm:pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0 max-w-[calc(100%-40px)] overflow-hidden">
                              {fav.gpt.imageUrl ? (
                                <img 
                                  src={fav.gpt.imageUrl} 
                                  alt={fav.gpt.name}
                                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
                                  <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                                </div>
                              )}
                              <div className="min-w-0 flex-1 overflow-hidden">
                                <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white break-words line-clamp-2 leading-tight">
                                  {fav.gpt.name}
                                </CardTitle>
                                <div className="flex items-center gap-1 sm:gap-2 mt-1 flex-wrap">
                                  <Badge variant="outline" className="text-xs whitespace-nowrap max-w-full truncate">
                                    {fav.gpt.model || 'Default Model'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveFromFavourites(fav.gpt._id)}
                              disabled={removingFromFavourites[fav.gpt._id]}
                              className="p-1 h-8 w-8 text-red-500 hover:text-red-600 flex-shrink-0"
                            >
                              <Heart className="h-4 w-4 fill-current" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 flex-1 flex flex-col overflow-hidden">
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 break-words line-clamp-3 leading-relaxed hyphens-auto">
                            {fav.gpt.description}
                          </p>
                          
                          <div className="space-y-2 sm:space-y-3 mt-auto">
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 overflow-hidden">
                              <Calendar className="h-3 w-3 flex-shrink-0" />
                              <span className="break-words truncate">Added {formatDate(fav.createdAt)}</span>
                            </div>
                            
                            {fav.gpt.knowledgeFiles?.length > 0 && (
                              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 overflow-hidden">
                                <FileText className="h-3 w-3 flex-shrink-0" />
                                <span className="break-words truncate">{fav.gpt.knowledgeFiles.length} knowledge files</span>
                              </div>
                            )}
                            
                            <div className="flex flex-wrap gap-1 min-h-[20px] overflow-hidden">
                              {getCapabilityBadges(fav.gpt.capabilities).map((capability) => (
                                <Badge key={capability} variant="outline" className="text-xs break-words max-w-full">
                                  {capability}
                                </Badge>
                              ))}
                            </div>
                            
                            <Button 
                              onClick={() => handleStartConversation(fav.gpt)} 
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
                </div>
              ))
            ) : (
              // Show only selected folder
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Folder className="h-5 w-5 text-blue-500" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedFolder} ({filteredFavourites.length})
                  </h3>
                </div>
                <div className="grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {filteredFavourites.map((fav) => (
                    <Card key={fav._id} className="bg-white dark:bg-[#2A2A2A] border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow h-full overflow-hidden flex flex-col">
                      <CardHeader className="p-4 pb-2 sm:pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0 max-w-[calc(100%-40px)] overflow-hidden">
                            {fav.gpt.imageUrl ? (
                              <img 
                                src={fav.gpt.imageUrl} 
                                alt={fav.gpt.name}
                                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
                                <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1 overflow-hidden">
                              <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white break-words line-clamp-2 leading-tight">
                                {fav.gpt.name}
                              </CardTitle>
                              <div className="flex items-center gap-1 sm:gap-2 mt-1 flex-wrap">
                                <Badge variant="outline" className="text-xs whitespace-nowrap max-w-full truncate">
                                  {fav.gpt.model || 'Default Model'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFromFavourites(fav.gpt._id)}
                            disabled={removingFromFavourites[fav.gpt._id]}
                            className="p-1 h-8 w-8 text-red-500 hover:text-red-600 flex-shrink-0"
                          >
                            <Heart className="h-4 w-4 fill-current" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 flex-1 flex flex-col overflow-hidden">
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 break-words line-clamp-3 leading-relaxed hyphens-auto">
                          {fav.gpt.description}
                        </p>
                        
                        <div className="space-y-2 sm:space-y-3 mt-auto">
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 overflow-hidden">
                            <Calendar className="h-3 w-3 flex-shrink-0" />
                            <span className="break-words truncate">Added {formatDate(fav.createdAt)}</span>
                          </div>
                          
                          {fav.gpt.knowledgeFiles?.length > 0 && (
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 overflow-hidden">
                              <FileText className="h-3 w-3 flex-shrink-0" />
                              <span className="break-words truncate">{fav.gpt.knowledgeFiles.length} knowledge files</span>
                            </div>
                          )}
                          
                          <div className="flex flex-wrap gap-1 min-h-[20px] overflow-hidden">
                            {getCapabilityBadges(fav.gpt.capabilities).map((capability) => (
                              <Badge key={capability} variant="outline" className="text-xs break-words max-w-full">
                                {capability}
                              </Badge>
                            ))}
                          </div>
                          
                          <Button 
                            onClick={() => handleStartConversation(fav.gpt)} 
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
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavouritesPage; 