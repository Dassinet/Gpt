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
import { getUser, isAuthenticated, authenticatedAxios } from "@/lib/auth";
import { toast } from "sonner";

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
      
      const response = await authenticatedAxios.get(`/api/chat/all?userId=${currentUser.userId}`);

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
      await authenticatedAxios.delete(`/api/chat/${conversation._id}`);
      
      // If there are additional messages to delete
      if (conversation.allMessages && conversation.allMessages.length > 1) {
        // Delete all related messages except the main one we already deleted
        const deletePromises = conversation.allMessages
          .filter(msg => msg._id !== conversation._id)
          .map(msg => 
            authenticatedAxios.delete(`/api/chat/${msg._id}`)
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
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-64" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Chat History</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View and manage your conversation history
          </p>
        </div>
        
        <div className="flex items-center w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Conversations</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{groupedConversations.length}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Messages</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{conversations.length}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversations List */}
      <div className="space-y-4">
        {filteredConversations.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchQuery ? 'No conversations found' : 'No chat history yet'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
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
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleOpenConversation(conversation)}
            >
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-purple-100 dark:bg-purple-900/20">
                        <Bot className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{conversation.gptName}</CardTitle>
                      <CardDescription className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {conversation.model}
                        </Badge>
                        <span>•</span>
                        <span className="whitespace-nowrap">{formatDate(conversation.updatedAt)}</span>
                        <span>•</span>
                        <span className="whitespace-nowrap">{conversation.messageCount || 0} messages</span>
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-3 sm:mt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenConversation(conversation);
                      }}
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
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {conversation.lastMessage || 'No messages yet'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default UserHistory;