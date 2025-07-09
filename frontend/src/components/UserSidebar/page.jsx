"use client"
import { Heart, Home, Inbox, LogOutIcon, Search, Settings } from "lucide-react"
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
import { useState } from "react"
import { removeToken, getToken } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import axios from "axios"

// User menu items
const userItems = [
  {
    title: "Dashboard",
    url: "/user/dashboard",
    icon: Home,
  },
  {
    title: "Favourites",
    url: "/user/favourites",
    icon: Heart,
  },
  {
    title: "History",
    url: "/user/history",
    icon: Search,
  },
  {
    title: "Settings",
    url: "/user/settings",
    icon: Settings,
  },
]

export default function UserSidebar() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      // Call backend logout endpoint
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/logout`, {}, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });

      if (response.data.success) {
        removeToken();
        toast.success('Logged out successfully');
        router.push('/auth/sign-in');
      } else {
        toast.error(response.data.message || 'Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
      removeToken();
      router.push('/auth/sign-in');
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
              {userItems.map((item) => (
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
      
      {/* Footer with logout button */}
      <SidebarFooter className="border-t border-border mt-auto">
        {/* Sidebar Trigger - only visible when collapsed, above user profile */}
        <div className="hidden group-data-[collapsible=icon]:block border-b border-border">
          <div className="flex justify-center p-2">
            <SidebarTrigger className="h-6 w-6" />
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-4 ">
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
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}