"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { MessageSquare, Calendar, Search, Trash2, Bot } from "lucide-react";
import { getToken, isAuthenticated } from "@/lib/auth";
import { toast } from "sonner";
import axios from 'axios';

export default function AdminHistory() {
  const router = useRouter();
  const [conversations, setConversations] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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

        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data?.success) {
          setCurrentUser(response.data.user);
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
        toast.error('Failed to get user information');
        router.push('/auth/sign-in');
      }
    };

    fetchCurrentUser();
  }, [router]);

  // Fetch chat history from backend
  useEffect(() => {
    const fetchHistory = async () => {
      if (!currentUser?._id) return;

      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/chat/all?userId=${currentUser._id}`, {
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data?.success) {
          setConversations(response.data.data || []);
          setFilteredConversations(response.data.data || []);
        }
      } catch (error) {
        console.error('Error fetching chat history:', error);
        toast.error('Failed to load chat history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [currentUser]);

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredConversations(conversations);
    } else {
      const filtered = conversations.filter(conv => 
        conv.gptName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredConversations(filtered);
    }
  }, [searchQuery, conversations]);

  // Delete conversation
  const handleDelete = async (conversationId) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/chat/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      setConversations(prev => prev.filter(conv => conv._id !== conversationId));
      toast.success('Conversation deleted');
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Failed to delete conversation');
    }
  };

  // Navigate to conversation
  const handleOpenConversation = (conversation) => {
    router.push(`/admin/chat/${conversation.gptId}?conversationId=${conversation._id}`);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  if (isLoading || !currentUser) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6 max-w-7xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-full sm:w-64" />
        </div>
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="p-4">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 max-w-7xl bg-gray-100 dark:bg-[#1A1A1A] min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white truncate">
            Chat History
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            View and manage your conversation history
          </p>
        </div>
        
        <div className="w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full sm:w-64 text-sm h-9 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-white dark:bg-[#2A2A2A] border-gray-200 dark:border-gray-700 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center">
              <MessageSquare className="h-6 w-6 text-blue-600 flex-shrink-0" />
              <div className="ml-4 min-w-0">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
                  Total Conversations
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {conversations.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-[#2A2A2A] border-gray-200 dark:border-gray-700 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Bot className="h-6 w-6 text-green-600 flex-shrink-0" />
              <div className="ml-4 min-w-0">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
                  Active GPTs
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {new Set(conversations.map(conv => conv.gptId)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-[#2A2A2A] border-gray-200 dark:border-gray-700 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Calendar className="h-6 w-6 text-purple-600 flex-shrink-0" />
              <div className="ml-4 min-w-0">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
                  This Week
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {conversations.filter(conv => {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return new Date(conv.updatedAt) > weekAgo;
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversations List */}
      <div className="space-y-4">
        {filteredConversations.length === 0 ? (
          <Card className="bg-white dark:bg-[#2A2A2A] border-gray-200 dark:border-gray-700 overflow-hidden">
            <CardContent className="p-6 text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchQuery ? 'No conversations found' : 'No chat history yet'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
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
              className="bg-white dark:bg-[#2A2A2A] border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
            >
              <CardHeader className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3 min-w-0">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback className="bg-purple-100 dark:bg-purple-900/20">
                        <Bot className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base font-semibold text-gray-900 dark:text-white truncate">
                        {conversation.gptName}
                      </CardTitle>
                      <CardDescription className="flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mt-1">
                        <Badge variant="outline" className="text-[10px]">
                          {conversation.model}
                        </Badge>
                        <span className="hidden sm:inline">•</span>
                        <span>{formatDate(conversation.updatedAt)}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>{conversation.messages?.length || 0} messages</span>
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenConversation(conversation);
                      }}
                      className="text-sm h-8 px-3"
                    >
                      Continue
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(conversation._id);
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent 
                className="p-4 pt-0" 
                onClick={() => handleOpenConversation(conversation)}
              >
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {conversation.lastMessage || 'No messages yet'}
                  </p>
                  
                  {conversation.summary && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 italic">
                      Summary: {conversation.summary}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}