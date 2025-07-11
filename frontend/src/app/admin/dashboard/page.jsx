"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser, getUserRole, getToken, isAuthenticated } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Plus, Bot, Clock, UserPlus, BarChart3, Settings, TrendingUp, Activity, Users } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";

const AdminDashboard = () => {
    const router = useRouter();
    const [user, setUser] = useState(null);

    const [dashboardData, setDashboardData] = useState({
        recentGPTs: [],
        totalGPTs: 0,
        activeGPTs: 0,
        totalUsers: 0,
        lastUpdated: null
    });

    const [isRefreshing, setIsRefreshing] = useState(false);

    // Format date function
    const formatLastUpdated = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Check authentication and set user
    useEffect(() => {
        const checkAuth = () => {
            if (!isAuthenticated()) {
                toast.error('Please login to access this page');
                router.push('/auth/sign-in');
                return;
            }

            const currentUser = getUser();
            const userRole = getUserRole();

            if (!currentUser || userRole !== 'admin') {
                toast.error('Access denied. Admin privileges required.');
                router.push('/auth/sign-in');
                return;
            }

            setUser(currentUser);
        };

        checkAuth();
    }, [router]);

    // Configure axios
    useEffect(() => {
        axios.defaults.withCredentials = true;
        
        const requestInterceptor = axios.interceptors.request.use(
            (config) => {
                const token = getToken();
                if (token) {
                    config.headers['Authorization'] = `Bearer ${token}`;
                    config.headers['Content-Type'] = 'application/json';
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        return () => {
            axios.interceptors.request.eject(requestInterceptor);
        };
    }, []);

    const fetchDashboardData = async () => {
        try {
            setIsRefreshing(true);
            
            // Fetch GPTs and Users data in parallel
            const [gptsResponse, usersResponse] = await Promise.all([
                axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/gpt/all`, {
                    headers: {
                        'Authorization': `Bearer ${getToken()}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 5000
                }),
                axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/teams`, {
                    headers: {
                        'Authorization': `Bearer ${getToken()}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 5000
                })
            ]);
            
            // Process GPTs data
            if (gptsResponse.data.success) {
                const gptsData = gptsResponse.data.customGpts;
                
                const recentGPTs = gptsData
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 5)
                    .map(gpt => ({
                        id: gpt._id,
                        name: gpt.name,
                        description: gpt.description,
                        status: "Active", 
                        model: gpt.model || "Default",
                        createdBy: gpt.createdBy ? `${gpt.createdBy.firstName} ${gpt.createdBy.lastName}` : "Unknown",
                        createdAt: formatLastUpdated(gpt.createdAt),
                        imageUrl: gpt.imageUrl,
                        capabilities: gpt.capabilities,
                        knowledgeFiles: gpt.knowledgeFiles
                    }));
                
                // Process Users data
                let totalUsers = 0;
                if (usersResponse.data.success && usersResponse.data.teams) {
                    // Add 1 to include the current admin user
                    totalUsers = usersResponse.data.teams.length + 1;
                }
                
                setDashboardData(prev => ({
                    ...prev,
                    recentGPTs,
                    totalGPTs: gptsData.length,
                    activeGPTs: gptsData.length, 
                    totalUsers: totalUsers,
                    lastUpdated: new Date()
                }));
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            toast.error('Failed to fetch dashboard data');
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        if (user && getUserRole() === 'admin') {
            fetchDashboardData();
        }
    }, [user]);

    const handleRefresh = () => {
        fetchDashboardData(); 
    }

    const statsCards = [
        {
            title: "Total GPTs",
            value: dashboardData.totalGPTs,
            change: `${dashboardData.totalGPTs} total created`,
            changeType: "info",
            icon: Bot,
            color: "text-purple-600",
            bgColor: "bg-purple-100 dark:bg-purple-900"
        },
        {
            title: "Active GPTs", 
            value: dashboardData.activeGPTs,
            change: `${dashboardData.activeGPTs} currently active`,
            changeType: "positive",
            icon: Activity,
            color: "text-green-600",
            bgColor: "bg-green-100 dark:bg-green-900"
        },
        {
            title: "Total Users",
            value: dashboardData.totalUsers,
            change: `${dashboardData.totalUsers} registered users`,
            changeType: "info", 
            icon: Users,
            color: "text-blue-600",
            bgColor: "bg-blue-100 dark:bg-blue-900"
        }
    ];

    const recentGPTs = dashboardData.recentGPTs;

    return (
      <div className="p-2 sm:p-3 lg:p-4 xl:p-6 space-y-3 sm:space-y-4 lg:space-y-6 bg-gray-100 dark:bg-[#1A1A1A] min-h-full rounded-lg max-w-full overflow-hidden">
        {/* Header with refresh button */}
        <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Dashboard</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
              <p className="truncate">Welcome back, {user?.firstName}!</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="border-gray-200 dark:border-gray-700 text-xs sm:text-sm h-8 sm:h-9"
            >
              <RefreshCw className={`mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              asChild
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm h-8 sm:h-9"
            >
              <Link href="/admin/create-gpt">
                <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Create GPT
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {statsCards.map((stat, index) => (
            <Card key={index} className="bg-white dark:bg-[#2A2A2A] border-gray-200 dark:border-gray-700 overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 sm:px-4 lg:px-6 pt-3 sm:pt-4 lg:pt-6">
                <CardTitle className="text-xs sm:text-sm lg:text-base font-medium text-gray-900 dark:text-white truncate">
                  {stat.title}
                </CardTitle>
                <div className={`p-1.5 sm:p-2 rounded-full ${stat.bgColor} flex-shrink-0`}>
                  <stat.icon className={`h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent className="px-3 sm:px-4 lg:px-6 pb-3 sm:pb-4 lg:pb-6">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value.toLocaleString()}
                </div>
                <div className="flex items-center text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {stat.changeType === "positive" && <TrendingUp className="mr-1 h-3 w-3 text-green-500" />}
                  {stat.changeType === "neutral" && <Activity className="mr-1 h-3 w-3 text-gray-500" />}
                  {stat.changeType === "info" && <Users className="mr-1 h-3 w-3 text-blue-500" />}
                  <span className="truncate">{stat.change}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent GPTs and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Recent GPTs */}
          <Card className="bg-white dark:bg-[#2A2A2A] border-gray-200 dark:border-gray-700 overflow-hidden">
            <CardHeader className="px-3 sm:px-4 lg:px-6 pt-3 sm:pt-4 lg:pt-6 pb-2 sm:pb-3">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base lg:text-lg text-gray-900 dark:text-white">
                <Bot className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                Recent GPTs
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 lg:px-6 pb-3 sm:pb-4 lg:pb-6">
              <div className="space-y-2 sm:space-y-3">
                {recentGPTs.length > 0 ? recentGPTs.map((gpt) => (
                  <div
                    key={gpt.id}
                    className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 border border-gray-200 dark:border-gray-700 rounded-md sm:rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    {gpt.imageUrl ? (
                      <img 
                        src={gpt.imageUrl} 
                        alt={gpt.name}
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 sm:gap-2 mb-1">
                        <h3 className="font-medium text-sm sm:text-base text-gray-900 dark:text-white break-words leading-tight line-clamp-2">
                          {gpt.name}
                        </h3>
                        <Badge
                          variant={gpt.status === "Active" ? "default" : "secondary"}
                          className="text-[9px] sm:text-[10px] lg:text-xs flex-shrink-0 whitespace-nowrap"
                        >
                          {gpt.status}
                        </Badge>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 break-words line-clamp-2 leading-relaxed">
                        {gpt.description}
                      </p>
                      <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 flex-wrap">
                        <span className="break-all max-w-[100px] sm:max-w-[120px]">{gpt.model}</span>
                        <span>•</span>
                        <span className="whitespace-nowrap">{gpt.createdAt}</span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-6 sm:py-8">
                    <Bot className="mx-auto h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-gray-400 dark:text-gray-600" />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">No GPTs created yet</p>
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                className="w-full mt-3 sm:mt-4 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 text-xs sm:text-sm h-8 sm:h-9"
                asChild
              >
                <Link href="/admin/collections">View All GPTs</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-white dark:bg-[#2A2A2A] border-gray-200 dark:border-gray-700 overflow-hidden">
            <CardHeader className="px-3 sm:px-4 lg:px-6 pt-3 sm:pt-4 lg:pt-6 pb-2 sm:pb-3">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base lg:text-lg text-gray-900 dark:text-white">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 lg:px-6 pb-3 sm:pb-4 lg:pb-6">
              <div className="space-y-2 sm:space-y-3">
                <Button
                  className="w-full justify-start bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm h-8 sm:h-9"
                  asChild
                >
                  <Link href="/admin/create-gpt">
                    <Plus className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    Create New GPT
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 text-xs sm:text-sm h-8 sm:h-9"
                  asChild
                >
                  <Link href="/admin/teams">
                    <UserPlus className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    Manage Team
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 text-xs sm:text-sm h-8 sm:h-9"
                  asChild
                >
                  <Link href="/admin/history">
                    <BarChart3 className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    View Analytics
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 text-xs sm:text-sm h-8 sm:h-9"
                  asChild
                >
                  <Link href="/admin/settings">
                    <Settings className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    Settings
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts section */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Placeholder for charts */}
        </div>

        {/* Tables section */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            {/* Placeholder for table content */}
          </table>
        </div>
      </div>
    );
  
};

export default AdminDashboard;