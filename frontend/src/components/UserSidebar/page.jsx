"use client"
import { Heart, Home, Search, Settings, LogOutIcon } from "lucide-react"
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
  useSidebar,
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
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  const handleLogout = async () => {
    setIsLoggingOut(true)
    
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/logout`, {}, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      })

      if (response.data.success) {
        removeToken()
        toast.success('Logged out successfully')
        router.push('/auth/sign-in')
      } else {
        toast.error(response.data.message || 'Logout failed')
      }
    } catch (error) {
      console.error('Logout error:', error)
      removeToken()
      router.push('/auth/sign-in')
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <Sidebar collapsible="icon">
      {/* Header with logo */}
      <SidebarHeader className="border-b border-border">
        <div className="flex items-center justify-between p-4">
          {/* Logo - fix the collapsed state letter */}
          <div className="flex items-center justify-center w-full group-data-[collapsible=icon]:w-auto">
            <div className="flex items-center">
              <span className="text-2xl font-bold group-data-[collapsible=icon]:hidden">EMSA</span>
              <span className="text-xl font-bold hidden group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full">E</span>
            </div>
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
                    <a href={item.url} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:w-full">
                      <item.icon className="h-5 w-5 min-w-5 flex-shrink-0" />
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
        {/* Sidebar Trigger - properly centered */}
        <div className="hidden group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:items-center border-b border-border">
          <div className="p-3">
            <SidebarTrigger className="h-5 w-5" />
          </div>
        </div>
        
        {/* Logout button - properly centered */}
        <div className="p-3 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
          <Button 
            variant="outline" 
            onClick={handleLogout} 
            disabled={isLoggingOut}
            className="w-full group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:p-2 flex items-center gap-2 cursor-pointer group-data-[collapsible=icon]:justify-center"
            title={isCollapsed ? "Sign out" : undefined}
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
                <LogOutIcon className="h-5 w-5 flex-shrink-0" />
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