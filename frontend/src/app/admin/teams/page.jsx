"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Users,
  Search, 
  Plus, 
  MoreHorizontal,
  Edit,
  Trash2,
  Mail,
  Shield,
  UserCheck,
  Calendar,
  Clock,
  Bot,
  Send,
  UserPlus,
  Save,
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "axios";
import { toast } from "sonner";
import { getToken, isAuthenticated, getUserRole } from '@/lib/auth';

const Teams = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [teamMembers, setTeamMembers] = useState([]);
  const [availableGPTs, setAvailableGPTs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    admins: 0,
    totalGPTs: 0
  });
  
  const [isAssignGPTOpen, setIsAssignGPTOpen] = useState(false);
  const [isInviteMemberOpen, setIsInviteMemberOpen] = useState(false);
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedGPTs, setSelectedGPTs] = useState([]);
  
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'user',
    message: ''
  });
  
  const [editRoleForm, setEditRoleForm] = useState({
    role: '',
    status: ''
  });

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!isAuthenticated() || getUserRole() !== 'admin') {
          toast.error('Access denied. Admin privileges required.');
          return;
        }

        setLoading(true);
        
        const membersResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/teams`);
        
        let gptsResponse;
        try {
          gptsResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/gpt/all`, {
            headers: {
              'Authorization': `Bearer ${getToken()}`,
              'Content-Type': 'application/json'
            },
            timeout: 5000
          });
        } catch (error) {
          console.log('GPTs endpoint not available:', error);
          gptsResponse = { data: { success: false, customGpts: [] } };
        }
        
        if (membersResponse.data.success) {
          const members = membersResponse.data.teams;
          
          const membersWithGptCounts = await Promise.all(members.map(async (member) => {
            try {
              const gptResponse = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/api/gpt/assigned/${member._id}`,
                {
                  headers: {
                    'Authorization': `Bearer ${getToken()}`,
                    'Content-Type': 'application/json'
                  },
                  timeout: 5000
                }
              );
              
              const assignedGpts = gptResponse.data.assignedGpts || [];
              
              return {
                id: member._id,
                name: member.name || 'Unknown User',
                fullName: member.name || 'Unknown User',
                email: member.email || 'No email',
                role: member.role || 'user',
                status: member.isVerified ? 'active' : 'pending',
                department: 'General',
                profileImage: member.profilePic || null,
                joinedAt: member.createdAt || new Date().toISOString(),
                lastActive: member.lastActive || member.createdAt || new Date().toISOString(),
                gptCount: assignedGpts.length,
                assignedGpts: assignedGpts
              };
            } catch (error) {
              console.error(`Error fetching GPTs for user ${member._id}:`, error);
              return {
                id: member._id,
                name: member.name || 'Unknown User',
                fullName: member.name || 'Unknown User',
                email: member.email || 'No email',
                role: member.role || 'user',
                status: member.isVerified ? 'active' : 'pending',
                department: 'General',
                profileImage: member.profilePic || null,
                joinedAt: member.createdAt || new Date().toISOString(),
                lastActive: member.lastActive || member.createdAt || new Date().toISOString(),
                gptCount: 0,
                assignedGpts: []
              };
            }
          }));
          
          setTeamMembers(membersWithGptCounts);
          
          const activeMembers = membersWithGptCounts.filter(m => m.status === 'active').length;
          const adminMembers = membersWithGptCounts.filter(m => m.role === 'admin').length;
          
          setStats({
            total: membersWithGptCounts.length,
            active: activeMembers,
            admins: adminMembers,
            totalGPTs: 0
          });
        }
        
        if (gptsResponse.data.success && gptsResponse.data.customGpts) {
          setAvailableGPTs(gptsResponse.data.customGpts);
          setStats(prev => ({ ...prev, totalGPTs: gptsResponse.data.customGpts.length }));
        }
        
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load team data');
        setTeamMembers([]);
        setAvailableGPTs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterRole === "all" || member.role === filterRole;
    return matchesSearch && matchesFilter;
  });

  const handleAssignGPTs = async () => {
    if (!selectedMember || selectedGPTs.length === 0) {
      toast.error('Please select GPTs to assign');
      return;
    }

    try {
      const promises = selectedGPTs.map(gptId => {
        return axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/gpt/assign/${gptId}`, {
          user: { _id: selectedMember.id },
          gpt: { _id: gptId }
        }, {
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        });
      });
      
      await Promise.all(promises);
      
      const gptResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/gpt/assigned/${selectedMember.id}`
      , {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });
      
      const assignedGpts = gptResponse.data.assignedGpts || [];
      
      toast.success(`Successfully assigned ${selectedGPTs.length} GPTs to ${selectedMember.name}`);
      setIsAssignGPTOpen(false);
      setSelectedGPTs([]);
      
      setTeamMembers(prevMembers => 
        prevMembers.map(member => 
          member.id === selectedMember.id 
            ? { ...member, gptCount: assignedGpts.length, assignedGpts: assignedGpts }
            : member
        )
      );
    } catch (error) {
      console.error('Error assigning GPTs:', error);
      toast.error('Failed to assign GPTs');
    }
  };

  const handleInviteMember = async () => {
    if (!inviteForm.email || !inviteForm.role) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/invite-user`, {
        email: inviteForm.email,
        role: inviteForm.role
      }, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });
      
      if (response.data.success) {
        toast.success('Invitation sent successfully');
        setIsInviteMemberOpen(false);
        setInviteForm({ email: '', role: 'user', message: '' });
        
        // Optionally refresh the team list to show the pending invitation
        const membersResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/teams`, {
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        });
        if (membersResponse.data.success) {
          const mappedMembers = membersResponse.data.teams.map(member => ({
            id: member._id,
            name: member.name || 'Unknown User',
            fullName: member.name || 'Unknown User',
            email: member.email || 'No email',
            role: member.role || 'user',
            status: member.isVerified ? 'active' : 'pending',
            department: 'General',
            profileImage: member.profilePic || null,
            joinedAt: member.createdAt || new Date().toISOString(),
            lastActive: member.lastActive || member.createdAt || new Date().toISOString(),
            gptCount: 0
          }));
          
          setTeamMembers(mappedMembers);
        }
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error(error.response?.data?.message || 'Failed to send invitation');
    }
  };

  const handleEditRole = async () => {
    if (!selectedMember || !editRoleForm.role || !editRoleForm.status) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      // This endpoint needs to be created
      toast.info('Role editing feature coming soon');
      setIsEditRoleOpen(false);
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  const handleRemoveMember = async (member) => {
    if (confirm(`Are you sure you want to remove ${member.name}?`)) {
      try {
        const response = await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/delete-user/${member.id}`, {
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        });
        
        if (response.data.success) {
          toast.success(`${member.name} has been removed successfully`);
          setTeamMembers(prevMembers => prevMembers.filter(m => m.id !== member.id));
          setStats(prev => ({
            ...prev,
            total: prev.total - 1,
            active: member.status === 'active' ? prev.active - 1 : prev.active,
            admins: member.role === 'admin' ? prev.admins - 1 : prev.admins
          }));
        }
      } catch (error) {
        console.error('Error removing member:', error);
        toast.error(error.response?.data?.message || 'Failed to remove member');
      }
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "user":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 bg-gray-100 dark:bg-[#1A1A1A] min-h-full rounded-lg">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-300 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 bg-gray-100 dark:bg-[#1A1A1A] min-h-full rounded-lg">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Team Management</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Manage team members and their access permissions ({stats.total} members)
          </p>
        </div>
        <Dialog open={isInviteMemberOpen} onOpenChange={setIsInviteMemberOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9">
              <Plus className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-[425px] bg-white dark:bg-[#2A2A2A] border-gray-200 dark:border-gray-700">
            <DialogHeader className="px-4 py-3 sm:px-6 sm:py-4">
              <DialogTitle className="text-base sm:text-lg text-gray-900 dark:text-white">Invite Team Member</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Send an invitation to join your team with specific role and permissions.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 sm:gap-4 px-4 pb-4 sm:px-6 sm:pb-6">
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-xs sm:text-sm text-gray-900 dark:text-white">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}
                  className="h-8 sm:h-9 text-xs sm:text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role" className="text-xs sm:text-sm text-gray-900 dark:text-white">Role</Label>
                <Select value={inviteForm.role} onValueChange={(value) => setInviteForm({...inviteForm, role: value})}>
                  <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm border-gray-200 dark:border-gray-700">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="text-xs sm:text-sm bg-white dark:bg-[#2A2A2A] border-gray-200 dark:border-gray-700">
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="message" className="text-xs sm:text-sm text-gray-900 dark:text-white">Custom Message (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Add a personal message to the invitation..."
                  value={inviteForm.message}
                  onChange={(e) => setInviteForm({...inviteForm, message: e.target.value})}
                  className="min-h-[60px] text-xs sm:text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 px-4 pb-4 sm:px-6 sm:pb-6">
              <Button 
                variant="outline" 
                onClick={() => setIsInviteMemberOpen(false)}
                className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9 border-gray-200 dark:border-gray-700"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleInviteMember} 
                className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-xs sm:text-sm h-8 sm:h-9"
              >
                <Send className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Send Invitation
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-white dark:bg-[#2A2A2A] border-gray-200 dark:border-gray-700">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Members</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-[#2A2A2A] border-gray-200 dark:border-gray-700">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <UserCheck className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-[#2A2A2A] border-gray-200 dark:border-gray-700">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Admins</p>
                <p className="text-xl sm:text-2xl font-bold text-red-600">{stats.admins}</p>
              </div>
              <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-[#2A2A2A] border-gray-200 dark:border-gray-700">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total GPTs</p>
                <p className="text-xl sm:text-2xl font-bold text-purple-600">{stats.totalGPTs}</p>
              </div>
              <Bot className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <Input
            placeholder="Search team members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 sm:pl-10 h-9 bg-white dark:bg-[#2A2A2A] border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm"
          />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-full sm:w-[180px] h-9 text-xs sm:text-sm bg-white dark:bg-[#2A2A2A] border-gray-200 dark:border-gray-700">
            <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-[#2A2A2A] border-gray-200 dark:border-gray-700 text-xs sm:text-sm">
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {filteredMembers.map((member) => (
          <Card key={member.id} className="bg-white dark:bg-[#2A2A2A] border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-4 pt-3 sm:pt-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                    <AvatarImage src={member.profileImage} alt={member.name} />
                    <AvatarFallback className="bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-sm sm:text-base">
                      {member.name?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate max-w-[150px] sm:max-w-[200px]">
                      {member.fullName || member.name || 'Unknown User'}
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate max-w-[150px] sm:max-w-[200px]">
                      {member.department || 'No department'}
                    </CardDescription>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                      <MoreHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white dark:bg-[#2A2A2A] border-gray-200 dark:border-gray-700 text-xs sm:text-sm">
                    <DropdownMenuItem 
                      className="text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => {
                        setSelectedMember(member);
                        setEditRoleForm({ role: member.role, status: member.status });
                        setIsEditRoleOpen(true);
                      }}
                    >
                      <Edit className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      Edit Role
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      onClick={() => {
                        setSelectedMember(member);
                        setSelectedGPTs([]);
                        setIsAssignGPTOpen(true);
                      }}
                    >
                      <Bot className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      Assign GPT
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                      <Mail className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      Send Message
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => handleRemoveMember(member)}
                    >
                      <Trash2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="pb-3 sm:pb-4 px-3 sm:px-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">{member.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Joined {new Date(member.joinedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    {member.lastActive ? `Last active: ${new Date(member.lastActive).toLocaleDateString()}` : 'Not active yet'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    {member.gptCount} GPTs assigned
                  </span>
                </div>
                {member.gptCount > 0 && (
                  <div className="mt-1 pl-5">
                    <div className="text-xs text-gray-500 dark:text-gray-500 max-h-12 overflow-y-auto">
                      {member.assignedGpts.map((gpt, index) => (
                        <div key={gpt._id} className="truncate">
                          • {gpt.name}
                        </div>
                      )).slice(0, 3)}
                      {member.assignedGpts.length > 3 && (
                        <div className="text-purple-500 text-xs">
                          +{member.assignedGpts.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="pt-0 px-3 sm:px-4 pb-3 sm:pb-4 flex justify-between items-center">
              <div className="flex gap-2">
                <Badge className={`${getRoleColor(member.role)} text-[10px] sm:text-xs`}>
                  {member.role}
                </Badge>
                <Badge className={`${getStatusColor(member.status)} text-[10px] sm:text-xs`}>
                  {member.status}
                </Badge>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog open={isAssignGPTOpen} onOpenChange={setIsAssignGPTOpen}>
        <DialogContent className="w-[95vw] max-w-[500px] bg-white dark:bg-[#2A2A2A] border-gray-200 dark:border-gray-700">
          <DialogHeader className="px-4 py-3 sm:px-6 sm:py-4">
            <DialogTitle className="text-base sm:text-lg text-gray-900 dark:text-white">
              Assign GPTs to {selectedMember?.name}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Select the GPTs you want to assign to this team member.
              {selectedMember?.gptCount > 0 && (
                <span> They currently have {selectedMember.gptCount} GPTs assigned.</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[50vh] overflow-y-auto px-4 sm:px-6">
            {availableGPTs.length ? (
              <div className="space-y-2 py-2">
                {availableGPTs.map(gpt => {
                  const isAlreadyAssigned = selectedMember?.assignedGpts?.some(
                    assignedGpt => assignedGpt._id === gpt._id
                  );
                  
                  return (
                    <div 
                      key={gpt._id} 
                      className={`flex items-center space-x-2 p-2 rounded border ${
                        isAlreadyAssigned 
                          ? 'border-purple-300 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20' 
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <Checkbox 
                        id={`gpt-${gpt._id}`} 
                        checked={selectedGPTs.includes(gpt._id) || isAlreadyAssigned}
                        disabled={isAlreadyAssigned}
                        onCheckedChange={(checked) => {
                          if (isAlreadyAssigned) return;
                          if (checked) {
                            setSelectedGPTs(prev => [...prev, gpt._id]);
                          } else {
                            setSelectedGPTs(prev => prev.filter(id => id !== gpt._id));
                          }
                        }}
                      />
                      <Label 
                        htmlFor={`gpt-${gpt._id}`}
                        className={`text-xs sm:text-sm flex-1 cursor-pointer ${
                          isAlreadyAssigned 
                            ? 'text-purple-700 dark:text-purple-400 font-medium' 
                            : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {gpt.name}
                        {isAlreadyAssigned && (
                          <span className="ml-2 text-xs text-purple-600 dark:text-purple-400">
                            (Already assigned)
                          </span>
                        )}
                      </Label>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="py-8 text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                No GPTs available to assign.
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 px-4 pb-4 sm:px-6 sm:pb-6">
            <Button 
              variant="outline" 
              onClick={() => setIsAssignGPTOpen(false)}
              className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9 border-gray-200 dark:border-gray-700"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAssignGPTs}
              disabled={!selectedGPTs.length}
              className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-xs sm:text-sm h-8 sm:h-9"
            >
              <Bot className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Assign Selected
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditRoleOpen} onOpenChange={setIsEditRoleOpen}>
        <DialogContent className="w-[95vw] max-w-[425px] bg-white dark:bg-[#2A2A2A] border-gray-200 dark:border-gray-700">
          <DialogHeader className="px-4 py-3 sm:px-6 sm:py-4">
            <DialogTitle className="text-base sm:text-lg text-gray-900 dark:text-white">Edit User Role</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Change role and status for {selectedMember?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 px-4 sm:px-6">
            <div className="grid gap-2">
              <Label htmlFor="edit-role" className="text-xs sm:text-sm text-gray-900 dark:text-white">Role</Label>
              <Select 
                value={editRoleForm.role} 
                onValueChange={(value) => setEditRoleForm({...editRoleForm, role: value})}
              >
                <SelectTrigger id="edit-role" className="h-8 sm:h-9 text-xs sm:text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="text-xs sm:text-sm bg-white dark:bg-[#2A2A2A] border-gray-200 dark:border-gray-700">
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-status" className="text-xs sm:text-sm text-gray-900 dark:text-white">Status</Label>
              <Select 
                value={editRoleForm.status} 
                onValueChange={(value) => setEditRoleForm({...editRoleForm, status: value})}
              >
                <SelectTrigger id="edit-status" className="h-8 sm:h-9 text-xs sm:text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="text-xs sm:text-sm bg-white dark:bg-[#2A2A2A] border-gray-200 dark:border-gray-700">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 px-4 pb-4 sm:px-6 sm:pb-6 mt-2">
            <Button 
              variant="outline" 
              onClick={() => setIsEditRoleOpen(false)}
              className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9 border-gray-200 dark:border-gray-700"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditRole}
              className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-xs sm:text-sm h-8 sm:h-9"
            >
              <Save className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Empty state handling */}
      {filteredMembers.length === 0 && !loading && (
        <div className="text-center py-8 sm:py-12">
          <Users className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400 dark:text-gray-600" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No team members found</h3>
          <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            {searchTerm || filterRole !== "all" ? 
              "Try adjusting your filters to see more results." : 
              "Get started by inviting team members to your organization."}
          </p>
          {(!searchTerm && filterRole === "all") && (
            <div className="mt-4 sm:mt-6">
              <Button 
                onClick={() => setIsInviteMemberOpen(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm h-8 sm:h-9"
              >
                <UserPlus className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Invite Team Member
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Teams;
