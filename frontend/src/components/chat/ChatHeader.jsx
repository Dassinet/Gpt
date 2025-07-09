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
    <div className="flex-shrink-0 bg-white dark:bg-black px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center space-x-2 sm:space-x-2.5 md:space-x-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/admin/collections')}
          className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white p-1.5 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 h-7 w-7 sm:h-8 sm:w-8"
        >
          <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onNewChat}
          className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white p-1.5 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 h-7 w-7 sm:h-8 sm:w-8"
        >
          <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>

        <div className="flex items-center space-x-2 sm:space-x-3">
          <Avatar className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10">
            {gptData?.imageUrl && !imageError ? (
              <AvatarImage 
                src={gptData.imageUrl} 
                alt={gptData.name}
                onError={handleImageError}
                className="object-cover"
              />
            ) : (
              <AvatarFallback className="bg-purple-100 dark:bg-purple-900/20">
                <Bot className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5 text-purple-600 dark:text-purple-400" />
              </AvatarFallback>
            )}
          </Avatar>

          <div className="flex flex-col">
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className="text-xs sm:text-sm md:text-base font-medium text-gray-900 dark:text-white truncate max-w-[120px] sm:max-w-[150px] md:max-w-[200px]">
                {gptData?.name || 'Loading...'}
              </span>
              {gptData?.model && (
                <div className="flex items-center text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full">
                  <span className="mr-1">{modelIcons[gptData.model] || '🤖'}</span>
                  <span className="truncate max-w-[60px] sm:max-w-[80px]">{getDisplayModelName(gptData.model)}</span>
                </div>
              )}
            </div>
            {gptData?.description && (
              <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px] sm:max-w-[180px] md:max-w-[250px]">
                {gptData.description}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="p-1.5 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 h-7 w-7 sm:h-8 sm:w-8"
        >
          {theme === 'dark' ? 
            <Sun className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-400" /> : 
            <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-700" />
          }
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 rounded-full p-0">
              <Avatar className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10">
                <AvatarImage 
                  src={displayUser?.profilePic} 
                  alt={displayUser?.name || displayUser?.fullName} 
                />
                <AvatarFallback className="bg-purple-500 text-white text-xs sm:text-sm">
                  {isLoadingUser ? "..." : 
                    (displayUser?.name?.charAt(0)?.toUpperCase() || 
                     displayUser?.firstName?.charAt(0)?.toUpperCase() || 
                     "A")
                  }
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 sm:w-60 md:w-64" align="end" forceMount>
            <div className="p-3 sm:p-4 border-b">
              <p className="font-medium text-xs sm:text-sm">
                {isLoadingUser ? "Loading..." : 
                  (displayUser?.name || 
                   `${displayUser?.firstName || ''} ${displayUser?.lastName || ''}`.trim() || 
                   "Admin User")
                }
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500">
                {displayUser?.email || "Loading..."}
              </p>
              {displayUser?.role && (
                <p className="text-[9px] sm:text-[10px] text-gray-400 capitalize">
                  {displayUser.role}
                </p>
              )}
            </div>
            <DropdownMenuItem className="cursor-pointer text-xs sm:text-sm">
              <User className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="cursor-pointer text-xs sm:text-sm"
              onClick={() => router.push('/admin/settings')}
            >
              <Settings className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-xs sm:text-sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default ChatHeader;