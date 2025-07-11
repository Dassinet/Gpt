"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { MessageSquare, Calendar, Search, Trash2, Bot, User, RefreshCw } from "lucide-react";
import { getUser, getToken, isAuthenticated } from "@/lib/auth";
import { toast } from "sonner";
import axios from 'axios';

const UserHistory = () => {
  const router = useRouter();
  const [conversations, setConversations] = useState([]);
  const [groupedConversations, setGroupedConversations] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  // Fetch current user data
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        if (!isAuthenticated()) {
          router.push('/auth/sign-in');
          return;
        }

        const user = getUser();
        if (user) {
          setCurrentUser(user);
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
        toast.error('Failed to get user information');
        router.push('/auth/sign-in');
      }
    };

    fetchCurrentUser();
  }, [router]);

  // Group conversations by gptId
  const groupConversationsByGptId = (chats) => {
    const grouped = {};
    
    // Sort by updatedAt date first (newest first)
    const sortedChats = [...chats].sort((a, b) => 
      new Date(b.updatedAt) - new Date(a.updatedAt)
    );
    
    sortedChats.forEach(chat => {
      // Create a unique key for each GPT
      const key = chat.gptId;
      
      if (!grouped[key]) {
        grouped[key] = {
          _id: chat._id, // Use the most recent chat's ID
          gptId: chat.gptId,
          gptName: chat.gptName,
          model: chat.model,
          lastMessage: chat.lastMessage,
          updatedAt: chat.updatedAt,
          createdAt: chat.createdAt,
          messageCount: 1,
          allMessages: [chat],
        };
      } else {
        // If this chat is newer than what we have, update the main properties
        if (new Date(chat.updatedAt) > new Date(grouped[key].updatedAt)) {
          grouped[key]._id = chat._id;
          grouped[key].lastMessage = chat.lastMessage;
          grouped[key].updatedAt = chat.updatedAt;
        }
        
        // Always increment the message count and add to all messages
        grouped[key].messageCount += 1;
        grouped[key].allMessages.push(chat);
      }
    });
    
    // Convert object to array
    return Object.values(grouped);
  };

  // Fetch chat history from backend
  const fetchHistory = async (showToast = false) => {
    if (!currentUser?.userId) return;

    try {
      setIsRefreshing(showToast);
      
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/chat/all?userId=${currentUser.userId}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data?.success) {
        const rawChats = response.data.data || [];
        setConversations(rawChats);
        
        // Group conversations by gptId
        const grouped = groupConversationsByGptId(rawChats);
        setGroupedConversations(grouped);
        setFilteredConversations(grouped);
        
        if (showToast) {
          toast.success('Chat history refreshed');
        }
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
      toast.error('Failed to load chat history');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Fetch history when user data is available
  useEffect(() => {
    if (currentUser?.userId) {
      fetchHistory();
    }
  }, [currentUser]);

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredConversations(groupedConversations);
    } else {
      const filtered = groupedConversations.filter(conv => 
        conv.gptName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredConversations(filtered);
    }
  }, [searchQuery, groupedConversations]);

  // Delete conversation and all related messages
  const handleDelete = async (conversation) => {
    try {
      // Delete the main conversation
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/chat/${conversation._id}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });
      
      // If there are additional messages to delete
      if (conversation.allMessages && conversation.allMessages.length > 1) {
        // Delete all related messages except the main one we already deleted
        const deletePromises = conversation.allMessages
          .filter(msg => msg._id !== conversation._id)
          .map(msg => 
            axios.delete(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/chat/${msg._id}`, {
              headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
              }
            })
          );
          
        // Wait for all deletions to complete
        await Promise.allSettled(deletePromises);
      }

      // Update the UI state
      setGroupedConversations(prev => prev.filter(conv => conv.gptId !== conversation.gptId));
      setFilteredConversations(prev => prev.filter(conv => conv.gptId !== conversation.gptId));
      
      toast.success('Conversation deleted');
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Failed to delete conversation');
    }
  };

  // Navigate to conversation
  const handleOpenConversation = (conversation) => {
    router.push(`/user/chat/${conversation.gptId}?conversationId=${conversation._id}`);
  };

  // Manual refresh
  const handleRefresh = () => {
    fetchHistory(true);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-gray-100 dark:bg-[#1A1A1A] px-4 sm:px-6 md:px-8 lg:px-12 py-4 sm:py-6 md:py-8">
        <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
          <Skeleton className="h-8 w-40 sm:w-48" />
          <div className="space-y-3 sm:space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="bg-white dark:bg-[#2A2A2A] border-gray-200 dark:border-gray-700">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-24 sm:w-32" />
                      <Skeleton className="h-3 w-48 sm:w-64" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-100 dark:bg-[#1A1A1A] px-4 sm:px-6 md:px-8 lg:px-12 py-4 sm:py-6 md:py-8">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Chat History</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              View and manage your conversation history
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full text-xs sm:text-sm h-8 sm:h-9 border-gray-200 dark:border-gray-700"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="w-full sm:w-auto h-8 sm:h-9 border-gray-200 dark:border-gray-700"
            >
              {isRefreshing ? (
                <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 animate-spin mr-1.5 sm:mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
              )}
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          <Card className="bg-white dark:bg-[#2A2A2A] border-gray-200 dark:border-gray-700">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Conversations</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{groupedConversations.length}</p>
                </div>
                <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-[#2A2A2A] border-gray-200 dark:border-gray-700">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Messages</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{conversations.length}</p>
                </div>
                <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conversations List */}
        <div className="space-y-3 sm:space-y-4 md:space-y-6">
          {filteredConversations.length === 0 ? (
            <Card className="bg-white dark:bg-[#2A2A2A] border-gray-200 dark:border-gray-700">
              <CardContent className="p-8 sm:p-12 text-center">
                <MessageSquare className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {searchQuery ? 'No conversations found' : 'No chat history yet'}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {searchQuery 
                    ? 'Try adjusting your search terms' 
                    : 'Start a conversation with a GPT to see it here'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredConversations.map((conversation) => (
              <Card 
                key={conversation._id} 
                className="bg-white dark:bg-[#2A2A2A] border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleOpenConversation(conversation)}
              >
                <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-5 pb-2 sm:pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                        <AvatarFallback className="bg-purple-100 dark:bg-purple-900/20">
                          <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base sm:text-lg text-gray-900 dark:text-white">{conversation.gptName}</CardTitle>
                        <CardDescription className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm overflow-hidden">
                          <Badge variant="outline" className="text-[10px] sm:text-xs border-gray-200 dark:border-gray-700 text-ellipsis overflow-hidden max-w-full">
                            {conversation.model}
                          </Badge>
                          <span className="hidden sm:inline">•</span>
                          <span className="whitespace-nowrap truncate max-w-full">{formatDate(conversation.updatedAt)}</span>
                          <span className="hidden sm:inline">•</span>
                          <span className="whitespace-nowrap truncate max-w-full">{conversation.messageCount || 0} messages</span>
                        </CardDescription>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 sm:space-x-3 mt-3 sm:mt-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenConversation(conversation);
                        }}
                        className="text-xs sm:text-sm h-8 sm:h-9 border-gray-200 dark:border-gray-700"
                      >
                        Continue
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(conversation);
                        }}
                        className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="px-4 sm:px-6 pt-0 pb-4 sm:pb-6 overflow-hidden">
                  <div className="space-y-2">
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2 overflow-hidden">
                      {conversation.lastMessage || 'No messages yet'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default UserHistory;