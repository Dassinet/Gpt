"use client"
import {   Home, Inbox, LogOutIcon, Search, Settings, Settings2Icon, Users } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "../ui/button"
import { useState } from "react";
import { removeTokens, getAccessToken } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";

// Admin menu items
const adminItems = [
  {
    title: "Dashboard",
    url: "/admin/dashboard",
    icon: Home,
  },
  {
    title: "Collections",
    url: "/admin/collections",
    icon: Inbox,
  },
  {
    title: "Teams",
    url: "/admin/teams",
    icon: Users,
  },
  {
    title: "History",
    url: "/admin/history",
    icon: Search,
  },
  {
    title: "Settings",
    url: "/admin/settings",
    icon: Settings,
  },
]

export default function AdminSidebar() {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      // Call backend logout endpoint
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/logout`, {}, {
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`
        },
        withCredentials: true // Important for sending cookies
      });

      if (response.data.success) {
        // Clear local tokens after successful server logout
        removeTokens();
        toast.success('Logged out successfully');
        router.push('/auth/sign-in');
      } else {
        toast.error(response.data.message || 'Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
      
      // Even if server logout fails, clear local tokens and redirect
      // This prevents the user from being stuck if the server is unreachable
      removeTokens();
      
      if (error.response?.status === 401) {
        // Token already invalid, just redirect
        router.push('/auth/sign-in');
      } else {
        toast.error('Logout failed, but you will be signed out locally');
        router.push('/auth/sign-in');
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Sidebar collapsible="icon">
      {/* Header with logo */}
      <SidebarHeader className="border-b border-border">
        <div className="flex items-center justify-between p-4">
          {/* Logo */}
          <div className="flex items-center">
            <span className="text-2xl font-bold group-data-[collapsible=icon]:hidden">DruidX</span>
            <span className="text-xl font-bold hidden group-data-[collapsible=icon]:block">D</span>
          </div>
          
          {/* Sidebar Trigger - only visible when expanded */}
          <div className="group-data-[collapsible=icon]:hidden">
            <SidebarTrigger className="h-6 w-6" />
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup className="px-2 mt-6">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <a href={item.url} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent">
                      <item.icon className="h-5 w-5 min-w-5" />
                      <span className="text-sm font-medium group-data-[collapsible=icon]:hidden">
                        {item.title}
                      </span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      {/* Footer with user profile */}
      <SidebarFooter className="border-t border-border mt-auto">
        {/* Sidebar Trigger - only visible when collapsed, above user profile */}
        <div className="hidden group-data-[collapsible=icon]:block border-b border-border">
          <div className="flex justify-center p-2">
            <SidebarTrigger className="h-6 w-6" />
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-4 ">
          {!isCollapsed ? (
            <Button 
              variant="outline" 
              onClick={handleLogout} 
              disabled={isLoggingOut}
              className="w-full flex items-center gap-2 cursor-pointer"
            >
              {isLoggingOut ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  <span className="text-sm font-medium group-data-[collapsible=icon]:hidden">
                    Signing out...
                  </span>
                </>
              ) : (
                <>
                  <LogOutIcon className="h-5 w-5" />
                  <span className="text-sm font-medium group-data-[collapsible=icon]:hidden">
                    Sign out
                  </span>
                </>
              )}
            </Button>
          ) : (
            <Button 
              variant="outline" 
              onClick={handleLogout} 
              disabled={isLoggingOut}
              className="w-full flex items-center justify-center cursor-pointer"
              title="Sign out"
            >
              {isLoggingOut ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              ) : (
                <LogOutIcon className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}