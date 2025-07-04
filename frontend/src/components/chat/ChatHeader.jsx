"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Plus, Settings, User, Sun, Moon, LogOut, Bot } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { removeToken, getToken } from '@/lib/auth';
import axios from 'axios';

// Model icons mapping
const modelIcons = {
  'gpt-4': '🤖',
  'gpt-4o-mini': '🤖',
  'claude': '🤖',
  'gemini': '🤖',
  'llama': '🤖'
};

const getDisplayModelName = (modelType) => {
  if (modelType === 'openrouter/auto') return 'router-engine';
  return modelType;
};

const ChatHeader = ({ gptData, user, onNewChat }) => {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [imageError, setImageError] = useState(false);
  const [realUserData, setRealUserData] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Fetch real user data from backend
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.data?.success && response.data.user) {
          setRealUserData(response.data.user);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Fall back to JWT user data if available
        if (user) {
          setRealUserData(user);
        }
      } finally {
        setIsLoadingUser(false);
      }
    };

    if (user) {
      fetchUserData();
    }
  }, [user]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleSignOut = () => {
    removeToken();
    router.push('/auth/sign-in');
  };

  const handleImageError = () => {
    setImageError(true);
  };

  // Use real user data if available, otherwise fall back to JWT user data
  const displayUser = realUserData || user;

  return (
    <div className="flex-shrink-0 bg-white dark:bg-black px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center space-x-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/admin/collections')}
          className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onNewChat}
          className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Plus className="h-4 w-4" />
        </Button>

        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            {gptData?.imageUrl && !imageError ? (
              <AvatarImage 
                src={gptData.imageUrl} 
                alt={gptData.name}
                onError={handleImageError}
                className="object-cover"
              />
            ) : (
              <AvatarFallback className="bg-purple-100 dark:bg-purple-900/20">
                <Bot className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </AvatarFallback>
            )}
          </Avatar>

          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="text-sm md:text-base font-medium text-gray-900 dark:text-white">
                {gptData?.name || 'Loading...'}
              </span>
              {gptData?.model && (
                <div className="flex items-center text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full">
                  <span className="mr-1">{modelIcons[gptData.model] || '🤖'}</span>
                  <span>{getDisplayModelName(gptData.model)}</span>
                </div>
              )}
            </div>
            {gptData?.description && (
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                {gptData.description}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {theme === 'dark' ? 
            <Sun className="h-4 w-4 text-yellow-400" /> : 
            <Moon className="h-4 w-4 text-gray-700" />
          }
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage 
                  src={displayUser?.profilePic} 
                  alt={displayUser?.name || displayUser?.fullName} 
                />
                <AvatarFallback className="bg-purple-500 text-white">
                  {isLoadingUser ? "..." : 
                    (displayUser?.name?.charAt(0)?.toUpperCase() || 
                     displayUser?.firstName?.charAt(0)?.toUpperCase() || 
                     "A")
                  }
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64" align="end" forceMount>
            <div className="p-4 border-b">
              <p className="font-medium">
                {isLoadingUser ? "Loading..." : 
                  (displayUser?.name || 
                   `${displayUser?.firstName || ''} ${displayUser?.lastName || ''}`.trim() || 
                   "Admin User")
                }
              </p>
              <p className="text-sm text-gray-500">
                {displayUser?.email || "Loading..."}
              </p>
              {displayUser?.role && (
                <p className="text-xs text-gray-400 capitalize">
                  {displayUser.role}
                </p>
              )}
            </div>
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={() => router.push('/admin/settings')}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default ChatHeader;