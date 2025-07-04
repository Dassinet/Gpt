"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getUser, getToken } from "@/lib/auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Settings,
  User,
  Shield,
  Palette,
  Save,
  Camera,
  Mail,
  Calendar,
  Crown,
  Key,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";

const SettingsPage = () => {
  const { theme } = useTheme();
  const [userData, setUserData] = useState(null);
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    name: '',
    department: ''
  });
  
  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  
  // Dialog states
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  
  const [settings, setSettings] = useState({
    requireEmailVerification: true,
    twoFactorAuth: false,
    sessionTimeout: 30,
    showPreviewMode: true,
    autoSaveEnabled: true,
    defaultGptModel: "openrouter/auto",
  });

  const [apiKeys, setApiKeys] = useState({});
  const [showApiKeys, setShowApiKeys] = useState({});
  
  const [bulkApiKeys, setBulkApiKeys] = useState({
    openai: { key: "", name: "OpenAI API Key" },
    gemini: { key: "", name: "Google Gemini API Key" },
    claude: { key: "", name: "Anthropic Claude API Key" },
    llama: { key: "", name: "Meta Llama API Key" },
    openrouter: { key: "", name: "OpenRouter API Key" },
    tavily: { key: "", name: "Tavily Search API Key" },
  });

  const apiProviders = [
    { value: "openai", label: "OpenAI", icon: "🤖", placeholder: "sk-..." },
    { value: "gemini", label: "Google Gemini", icon: "✨", placeholder: "AI..." },
    { value: "claude", label: "Anthropic Claude", icon: "🧠", placeholder: "sk-ant-..." },
    { value: "llama", label: "Meta Llama", icon: "🦙", placeholder: "..." },
    { value: "openrouter", label: "OpenRouter", icon: "🔄", placeholder: "sk-or-..." },
    { value: "tavily", label: "Tavily Search", icon: "🔍", placeholder: "tvly-..." },
  ];

  const fetchApiKeys = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        setUserData(response.data.user);
        
        // Set profile data
        setProfileData({
          name: response.data.user.name || '',
          department: response.data.user.department || ''
        });
        
        const fetchedKeys = response.data.user.apiKeys || {};
        setApiKeys(fetchedKeys);
        
        // Pre-populate bulk keys with existing data
        const updatedBulkKeys = { ...bulkApiKeys };
        Object.keys(fetchedKeys).forEach(provider => {
          if (updatedBulkKeys[provider] && fetchedKeys[provider]) {
            updatedBulkKeys[provider] = {
              key: fetchedKeys[provider].key || "",
              name: fetchedKeys[provider].name || updatedBulkKeys[provider].name
            };
          }
        });
        setBulkApiKeys(updatedBulkKeys);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to fetch user data');
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  // Profile update handler
  const handleProfileUpdate = async () => {
    if (!profileData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    setIsProfileLoading(true);
    try {
      const response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/profile`, {
        name: profileData.name.trim(),
        department: profileData.department.trim()
      }, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setUserData(response.data.user);
        toast.success('Profile updated successfully!');
      } else {
        toast.error(response.data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsProfileLoading(false);
    }
  };

  // Password update handler
  const handlePasswordUpdate = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toast.error('All password fields are required');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    setIsPasswordLoading(true);
    try {
      const response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setIsPasswordDialogOpen(false);
        toast.success('Password updated successfully!');
      } else {
        toast.error(response.data.message || 'Failed to update password');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/settings`, settings, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.data.success) {
        toast.success("Settings saved successfully!");
      } else {
        toast.error("Failed to save settings");
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error("Failed to save settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkApiKeyChange = (provider, field, value) => {
    setBulkApiKeys(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value
      }
    }));
  };

  const handleSaveAllApiKeys = async () => {
    setIsLoading(true);
    try {
      const keysToSave = {};
      Object.entries(bulkApiKeys).forEach(([provider, data]) => {
        if (data.key && data.key.trim()) {
          keysToSave[provider] = {
            key: data.key.trim(),
            name: data.name || `${provider.charAt(0).toUpperCase() + provider.slice(1)} API Key`,
            createdAt: new Date(),
            updatedAt: new Date()
          };
        }
      });

      if (Object.keys(keysToSave).length === 0) {
        toast.error('Please enter at least one API key');
        return;
      }

      const response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/api-keys`, {
        apiKeys: keysToSave
      }, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setApiKeys(response.data.apiKeys || keysToSave);
        setIsApiKeyDialogOpen(false);
        toast.success(response.data.message || "API keys saved successfully!");
      } else {
        toast.error(response.data.error || "Failed to save API keys");
      }
    } catch (error) {
      console.error('Error saving API keys:', error);
      toast.error(error.response?.data?.error || "Failed to save API keys");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteApiKey = async (provider) => {
    if (!confirm("Are you sure you want to delete this API key?")) return;

    setIsLoading(true);
    try {
      const updatedKeys = { ...apiKeys };
      delete updatedKeys[provider];
      
      const response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/api-keys`, {
        apiKeys: updatedKeys
      }, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        setApiKeys(updatedKeys);
        setBulkApiKeys(prev => ({
          ...prev,
          [provider]: { key: "", name: prev[provider].name }
        }));
        toast.success("API key deleted successfully!");
      } else {
        toast.error(response.data.error || "Failed to delete API key");
      }
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast.error(error.response?.data?.error || "Failed to delete API key");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleShowApiKey = (provider) => {
    setShowApiKeys(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }));
  };

  const maskApiKey = (key) => {
    if (!key) return "";
    if (key.length <= 8) return "*".repeat(key.length);
    return key.substring(0, 4) + "*".repeat(key.length - 8) + key.substring(key.length - 4);
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!userData) {
    return (
      <Skeleton className="h-screen w-screen bg-white/5 dark:bg-black/5" />
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 bg-gray-100 dark:bg-[#1A1A1A] min-h-full rounded-lg">
      {/* Header */}
      <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Admin Settings</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Manage your admin profile and system preferences
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isLoading}
          className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-1.5 sm:mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Profile Information */}
          <Card className="bg-white dark:bg-[#2A2A2A] border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-2 sm:pb-4 px-3 sm:px-4 pt-3 sm:pt-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-gray-900 dark:text-white">
                <User className="h-4 w-4 sm:h-5 sm:w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-6 px-3 sm:px-4 pb-3 sm:pb-4">
              {/* Profile Picture and Basic Info */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4">
                <div className="relative shrink-0">
                  <Avatar className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24">
                    <AvatarImage src={userData?.profilePic} alt={userData?.name} />
                    <AvatarFallback className="text-sm sm:text-lg lg:text-xl bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                      {userData?.name ? userData.name.charAt(0).toUpperCase() : 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="sm"
                    className="absolute -bottom-1 -right-1 h-6 w-6 sm:h-8 sm:w-8 rounded-full p-0 bg-purple-600 hover:bg-purple-700"
                  >
                    <Camera className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
                
                <div className="flex-1 w-full space-y-2 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                      {userData?.name || 'Loading...'}
                    </h3>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 w-fit mx-auto sm:mx-0 text-xs">
                      <Crown className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                      Administrator
                    </Badge>
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-gray-600 dark:text-gray-400">
                    <Mail className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                    <span className="text-xs sm:text-sm truncate">{userData?.email || 'Loading...'}</span>
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-gray-600 dark:text-gray-400">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                    <span className="text-xs sm:text-sm">
                      Joined {formatDate(userData?.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              <Separator className="bg-gray-200 dark:bg-gray-700" />

              {/* Editable Profile Fields */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs sm:text-sm text-gray-900 dark:text-white">Name</Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-white dark:bg-gray-800 text-xs sm:text-sm h-8 sm:h-9 border-gray-200 dark:border-gray-700"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-xs sm:text-sm text-gray-900 dark:text-white">Department</Label>
                    <Input
                      id="department"
                      value={profileData.department}
                      onChange={(e) => setProfileData(prev => ({ ...prev, department: e.target.value }))}
                      placeholder="e.g., Engineering, Marketing"
                      className="bg-white dark:bg-gray-800 text-xs sm:text-sm h-8 sm:h-9 border-gray-200 dark:border-gray-700"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs sm:text-sm text-gray-900 dark:text-white">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userData?.email || ''}
                    disabled
                    className="bg-gray-100 dark:bg-gray-800 text-xs sm:text-sm h-8 sm:h-9 border-gray-200 dark:border-gray-700"
                  />
                  <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">
                    Email address cannot be changed here.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    onClick={handleProfileUpdate}
                    disabled={isProfileLoading}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm h-8 sm:h-9"
                  >
                    {isProfileLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-1.5 sm:mr-2"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        Update Profile
                      </>
                    )}
                  </Button>
                  
                  <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="text-xs sm:text-sm h-8 sm:h-9">
                        <Lock className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        Change Password
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                        <DialogDescription>
                          Update your password. Make sure it's at least 6 characters long.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword">Current Password</Label>
                          <Input
                            id="currentPassword"
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                            className="bg-white dark:bg-gray-800"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="newPassword">New Password</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                            className="bg-white dark:bg-gray-800"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirm New Password</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            className="bg-white dark:bg-gray-800"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handlePasswordUpdate}
                          disabled={isPasswordLoading}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          {isPasswordLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Updating...
                            </>
                          ) : (
                            "Update Password"
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Keys Management */}
          <Card className="bg-white dark:bg-[#2A2A2A] border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-2 sm:pb-4 px-3 sm:px-4 pt-3 sm:pt-4">
              <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-gray-900 dark:text-white">
                  <Key className="h-4 w-4 sm:h-5 sm:w-5" />
                  AI Provider API Keys
                </CardTitle>
                <Dialog open={isApiKeyDialogOpen} onOpenChange={setIsApiKeyDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9">
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                      Manage API Keys
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] max-w-[500px] h-[85vh] max-h-[600px] flex flex-col bg-white dark:bg-[#2A2A2A] border-gray-200 dark:border-gray-700">
                    <DialogHeader className="flex-shrink-0 pb-2 px-4 pt-4 sm:px-6 sm:pt-6">
                      <DialogTitle className="text-base sm:text-lg text-gray-900 dark:text-white">AI Provider API Keys</DialogTitle>
                      <DialogDescription className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        Configure your AI provider API keys. Leave empty to remove.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="flex-1 overflow-y-auto px-4 sm:px-6">
                      <div className="space-y-3 sm:space-y-4">
                        {apiProviders.map((provider) => (
                          <div key={provider.value} className="space-y-2 p-2 sm:p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm sm:text-base shrink-0">{provider.icon}</span>
                              <Label className="text-xs sm:text-sm font-medium flex-1 truncate text-gray-900 dark:text-white">{provider.label}</Label>
                            </div>
                            
                            <div className="space-y-2">
                              <Input
                                value={bulkApiKeys[provider.value]?.name || ""}
                                onChange={(e) => handleBulkApiKeyChange(provider.value, 'name', e.target.value)}
                                placeholder="Display name (optional)"
                                className="h-7 sm:h-8 text-xs bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                              />
                              
                              <Input
                                type="password"
                                value={bulkApiKeys[provider.value]?.key || ""}
                                onChange={(e) => handleBulkApiKeyChange(provider.value, 'key', e.target.value)}
                                placeholder={provider.placeholder}
                                className="h-7 sm:h-8 text-xs font-mono bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <DialogFooter className="flex-shrink-0 px-4 pb-4 sm:px-6 sm:pb-6 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex flex-col sm:flex-row gap-2 w-full">
                        <Button 
                          variant="outline" 
                          onClick={() => setIsApiKeyDialogOpen(false)} 
                          className="w-full sm:flex-1 text-xs sm:text-sm h-8 sm:h-9 border-gray-200 dark:border-gray-700"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleSaveAllApiKeys} 
                          disabled={isLoading} 
                          className="w-full sm:flex-1 bg-purple-600 hover:bg-purple-700 text-xs sm:text-sm h-8 sm:h-9"
                        >
                          {isLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                              Saving...
                            </>
                          ) : (
                            "Save All"
                          )}
                        </Button>
                      </div>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
              {Object.keys(apiKeys).length === 0 ? (
                <div className="text-center py-6 sm:py-8 text-gray-600 dark:text-gray-400">
                  <Key className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm sm:text-base font-medium mb-1">No API Keys Added</p>
                  <p className="text-xs sm:text-sm">Click "Manage API Keys" to add your AI provider keys.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(apiKeys).map(([provider, keyData]) => {
                    const providerInfo = apiProviders.find(p => p.value === provider);
                    return (
                      <div key={provider} className="flex flex-col sm:flex-row items-start gap-3 p-2 sm:p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <div className="flex items-start gap-3 flex-1 w-full min-w-0">
                          <span className="text-base sm:text-lg shrink-0">{providerInfo?.icon}</span>
                          
                          <div className="flex-1 min-w-0 w-full">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                              <p className="font-medium text-sm truncate text-gray-900 dark:text-white">{keyData.name || providerInfo?.label}</p>
                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleShowApiKey(provider)}
                                  className="h-6 w-6 p-0"
                                >
                                  {showApiKeys[provider] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteApiKey(provider)}
                                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="w-full">
                              <code className="text-[10px] sm:text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono block w-full truncate">
                                {showApiKeys[provider] ? keyData.key : maskApiKey(keyData.key)}
                              </code>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="bg-white dark:bg-[#2A2A2A] border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-2 sm:pb-4 px-3 sm:px-4 pt-3 sm:pt-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-gray-900 dark:text-white">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                Security & Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-4 pb-3 sm:pb-4">
              <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <Label className="text-xs sm:text-sm text-gray-900 dark:text-white">Email Verification</Label>
                  <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">Require email verification for new users</p>
                </div>
                <Switch
                  checked={settings.requireEmailVerification}
                  onCheckedChange={(checked) => handleSettingChange('requireEmailVerification', checked)}
                  className="shrink-0"
                />
              </div>
              
              <Separator className="bg-gray-200 dark:bg-gray-700" />
              
              <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <Label className="text-xs sm:text-sm text-gray-900 dark:text-white">Two-Factor Authentication</Label>
                  <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">Add an extra layer of security</p>
                </div>
                <Switch
                  checked={settings.twoFactorAuth}
                  onCheckedChange={(checked) => handleSettingChange('twoFactorAuth', checked)}
                  className="shrink-0"
                />
              </div>
              
              <Separator className="bg-gray-200 dark:bg-gray-700" />
              
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout" className="text-xs sm:text-sm text-gray-900 dark:text-white">Session Timeout (minutes)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                  className="bg-white dark:bg-gray-800 w-full sm:max-w-32 text-xs sm:text-sm h-8 sm:h-9 border-gray-200 dark:border-gray-700"
                />
                <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">
                  Automatically log out after period of inactivity
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          {/* Appearance Settings */}
          <Card className="bg-white dark:bg-[#2A2A2A] border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-2 sm:pb-4 px-3 sm:px-4 pt-3 sm:pt-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-gray-900 dark:text-white">
                <Palette className="h-4 w-4 sm:h-5 sm:w-5" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                <div className="space-y-1">
                  <Label className="text-xs sm:text-sm text-gray-900 dark:text-white">Theme</Label>
                  <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">Choose your preferred theme</p>
                </div>
                <ThemeToggle />
              </div>
            </CardContent>
          </Card>

          {/* Admin Preferences */}
          <Card className="bg-white dark:bg-[#2A2A2A] border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-2 sm:pb-4 px-3 sm:px-4 pt-3 sm:pt-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-gray-900 dark:text-white">
                <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-4 pb-3 sm:pb-4">
              <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <Label className="text-xs sm:text-sm text-gray-900 dark:text-white">Preview Mode</Label>
                  <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">Show live preview while editing</p>
                </div>
                <Switch
                  checked={settings.showPreviewMode}
                  onCheckedChange={(checked) => handleSettingChange('showPreviewMode', checked)}
                  className="shrink-0"
                />
              </div>
              
              <Separator className="bg-gray-200 dark:bg-gray-700" />
              
              <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <Label className="text-xs sm:text-sm text-gray-900 dark:text-white">Auto Save</Label>
                  <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">Automatically save changes</p>
                </div>
                <Switch
                  checked={settings.autoSaveEnabled}
                  onCheckedChange={(checked) => handleSettingChange('autoSaveEnabled', checked)}
                  className="shrink-0"
                />
              </div>
            </CardContent>
          </Card>

          {/* Account Stats */}
          <Card className="bg-white dark:bg-[#2A2A2A] border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-2 sm:pb-4 px-3 sm:px-4 pt-3 sm:pt-4">
              <CardTitle className="text-base sm:text-lg text-gray-900 dark:text-white">Account Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-3 sm:px-4 pb-3 sm:pb-4">
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-gray-600 dark:text-gray-400">Account Status</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-[10px] sm:text-xs">
                  Active
                </Badge>
              </div>
              <div className="flex justify-between items-start text-xs sm:text-sm">
                <span className="text-gray-600 dark:text-gray-400 shrink-0">Last Activity</span>
                <span className="text-right text-[10px] sm:text-xs text-gray-900 dark:text-white">
                  {formatDate(userData?.lastActive)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-gray-600 dark:text-gray-400">API Keys</span>
                <span className="text-[10px] sm:text-xs text-gray-900 dark:text-white">{Object.keys(apiKeys).length} configured</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

