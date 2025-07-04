"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Bot, MessageSquare, User, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getUser, getAccessToken, isAuthenticated, authenticatedAxios } from '@/lib/auth';

const UserDashboard = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [assignedGpts, setAssignedGpts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated()) {
        toast.error('Please login to access this page');
        return;
      }

      const currentUser = getUser();
      setUser(currentUser);
    };

    checkAuth();
  }, []);

  // Fetch assigned GPTs
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const userId = user.userId;
        
        const assignedGptsResponse = await authenticatedAxios.get(
          `/api/gpt/assigned/${userId}`
        );
        
        if (assignedGptsResponse.data.success) {
          setAssignedGpts(assignedGptsResponse.data.assignedGpts || []);
        }
      } catch (error) {
        console.error('Error fetching assigned GPTs:', error);
        toast.error('Failed to fetch assigned GPTs');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Format date helper
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle start conversation - Updated to navigate to user chat
  const handleStartConversation = (gpt) => {
    router.push(`/user/chat/${gpt._id}`);
  };

  if (loading) {  
    return (
      <div className="p-6 space-y-6 bg-gray-100 dark:bg-[#1A1A1A] min-h-full rounded-lg">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-300 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-100 dark:bg-[#1A1A1A] min-h-full rounded-lg">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Welcome, {user?.name || 'User'}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Here's your personalized dashboard
        </p>
      </div>
      
      {/* Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="bg-white dark:bg-[#2A2A2A] border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Assigned GPTs</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{assignedGpts.length}</p>
              </div>
              <Bot className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent/Featured GPTs */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Your GPTs
        </h2>

        {assignedGpts.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-[#2A2A2A] rounded-lg border border-gray-200 dark:border-gray-700">
            <Bot className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600" />
            <p className="text-lg font-medium text-gray-500 dark:text-gray-400 mt-4">
              No GPTs assigned yet
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Contact your administrator to get access to GPTs
            </p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {assignedGpts.map((gpt) => (
              <Card key={gpt._id} className="bg-white dark:bg-[#2A2A2A] border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    {gpt.imageUrl ? (
                      <img 
                        src={gpt.imageUrl} 
                        alt={gpt.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                        <Bot className="h-6 w-6 text-purple-600" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                        {gpt.name}
                      </CardTitle>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {gpt.model || 'Default Model'}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {gpt.description}
                  </p>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
                    <Calendar className="h-3 w-3" />
                    <span>Created {formatDate(gpt.createdAt)}</span>
                  </div>
                  
                  <Button 
                    onClick={() => handleStartConversation(gpt)} 
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Start Chat
                  </Button>
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