"use client";

import { usePathname } from 'next/navigation';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import UserSidebar from '@/components/UserSidebar/page';
import { Toaster } from '@/components/ui/sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  
  // Routes that should not have sidebar
  const noSidebarRoutes = ['/create-gpt', '/chat'];
  const shouldHideSidebar = noSidebarRoutes.some(route => pathname.includes(route));

  // If create-gpt or chat page, render without sidebar
  if (shouldHideSidebar) {
    return (
      <div className="min-h-screen bg-background">
        {children}
        <Toaster />
      </div>
    );
  }

  // Default layout with sidebar for other dashboard pages
  return (
    <SidebarProvider>
      <UserSidebar />
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          {isMobile && (
            <div className="flex items-center p-4 border-b">
              <SidebarTrigger className="mr-2" />
              <h1 className="text-xl font-semibold">DruidX</h1>
            </div>
          )}
          <div className="flex-1 p-4">
            {children}
          </div>
          <Toaster />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 