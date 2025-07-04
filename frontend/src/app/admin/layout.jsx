"use client";

import { usePathname, useRouter } from 'next/navigation';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AdminSidebar from '@/components/AdminSidebar/page';
import { Toaster } from '@/components/ui/sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { Menu } from 'lucide-react';
import { useEffect } from 'react';
import { isAuthenticated, getUserRole } from '@/lib/auth';
import { toast } from 'sonner';

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const router = useRouter();
  
  // Routes that should not have sidebar
  const noSidebarRoutes = ['/create-gpt', '/chat'];
  const shouldHideSidebar = noSidebarRoutes.some(route => pathname.includes(route));

  useEffect(() => {
    const checkAuth = () => {
      if (!isAuthenticated()) {
        toast.error('Please login to access this page');
        router.push('/auth/sign-in');
        return;
      }

      const userRole = getUserRole();
      const isAdminRoute = window.location.pathname.startsWith('/admin');
      const isUserRoute = window.location.pathname.startsWith('/user');

      if (isAdminRoute && userRole !== 'admin') {
        toast.error('Access denied. Admin privileges required.');
        router.push('/user/dashboard');
        return;
      }

      if (isUserRoute && userRole !== 'user') {
        router.push('/admin/dashboard');
        return;
      }
    };

    checkAuth();
  }, [router]);

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
      <AdminSidebar />
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          {isMobile && (
            <div className="flex items-center p-4 border-b">
              <SidebarTrigger className="mr-2" />
              <h1 className="text-xl font-semibold">EMSA</h1>
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