import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminData, UserProfile } from '@/hooks/useAdminData';
import { PageHeader } from '@/components/PageHeader';
import { ResponsiveTable } from '@/components/ResponsiveTable';
import { UserModal } from '@/components/admin/UserModal';
import { EnhancedUserDetailModal } from '@/components/admin/EnhancedUserDetailModal';
import { MerchantDetailModal } from '@/components/admin/MerchantDetailModal';
import { 
  User, Mail, Phone, Search, Eye, Calendar, Shield, 
  Plus, Edit, Trash2, Users, GraduationCap, Store, 
  Settings, Download, Filter, MoreHorizontal, UserCheck,
  Building, Headphones, AlertTriangle
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';

interface ExtendedUserProfile extends UserProfile {
  bookingsCount?: number;
  totalSpent?: number;
  studyHallsCount?: number;
  lastActivity?: string;
  verificationStatus?: 'verified' | 'pending' | 'rejected';
}

export const AdvancedUserManagement = () => {
  const { users, merchants, students, loading, createUser, updateUserRole, deleteUser } = useAdminData();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<ExtendedUserProfile | null>(null);
  const [userDetailOpen, setUserDetailOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Enhanced user data (remove demo data, use real data)
  const enhancedUsers: ExtendedUserProfile[] = useMemo(() => {
    return users.map(user => ({
      ...user,
      verificationStatus: 'verified' as any // Default to verified for now
    }));
  }, [users]);

  // Filter functions
  const getFilteredUsers = (userList: ExtendedUserProfile[]) => {
    return userList.filter(user => {
      const matchesSearch = 
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || user.verificationStatus === statusFilter;
      
      let matchesDate = true;
      if (dateFilter !== "all") {
        const userDate = new Date(user.created_at);
        const now = new Date();
        switch (dateFilter) {
          case "today":
            matchesDate = userDate.toDateString() === now.toDateString();
            break;
          case "week":
            matchesDate = userDate > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "month":
            matchesDate = userDate > new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        }
      }
      
      return matchesSearch && matchesStatus && matchesDate;
    });
  };

  const studentUsers = enhancedUsers.filter(u => u.role === 'student');
  const merchantUsers = enhancedUsers.filter(u => u.role === 'merchant');
  const operationalUsers = enhancedUsers.filter(u => 
    ['admin', 'telemarketing_executive', 'pending_payments_caller', 'customer_care_executive', 'settlement_manager', 'general_administrator'].includes(u.role)
  );

  const filteredStudents = getFilteredUsers(studentUsers);
  const filteredMerchants = getFilteredUsers(merchantUsers);
  const filteredOperational = getFilteredUsers(operationalUsers);
  const filteredAllUsers = getFilteredUsers(enhancedUsers);

  const handleViewUser = (user: ExtendedUserProfile) => {
    setSelectedUser(user);
    setUserDetailOpen(true);
  };

  const handleEditUser = (user: UserProfile) => {
    setEditingUser(user);
    setUserModalOpen(true);
  };

  const handleDeleteUser = (user: UserProfile) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (userToDelete) {
      await deleteUser(userToDelete.id);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleUserSubmit = async (userData: any) => {
    if (editingUser) {
      // Update logic would go here
      console.log('Update user:', userData);
    } else {
      await createUser(userData);
    }
    setUserModalOpen(false);
    setEditingUser(null);
  };

  const handleBulkDelete = async () => {
    setBulkActionLoading(true);
    try {
      await Promise.all(selectedUsers.map(userId => deleteUser(userId)));
      setSelectedUsers([]);
    } catch (error) {
      console.error('Bulk delete failed:', error);
    }
    setBulkActionLoading(false);
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleSelectAll = (userList: ExtendedUserProfile[], checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, ...userList.map(u => u.id)]);
    } else {
      setSelectedUsers(prev => prev.filter(id => !userList.some(u => u.id === id)));
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'student': return <GraduationCap className="h-4 w-4" />;
      case 'merchant': return <Store className="h-4 w-4" />;
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'telemarketing_executive': return <Headphones className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      student: 'default',
      merchant: 'secondary',
      admin: 'destructive',
      telemarketing_executive: 'outline'
    };
    return variants[role] || 'outline';
  };

  const getStatusBadgeVariant = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      verified: 'default',
      pending: 'outline',
      rejected: 'destructive'
    };
    return variants[status] || 'outline';
  };

  const createUserColumns = (userList: ExtendedUserProfile[]) => [
    {
      title: "Select",
      key: 'select',
      render: (_: any, user: ExtendedUserProfile) => (
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={selectedUsers.includes(user.id)}
            onCheckedChange={(checked) => handleSelectUser(user.id, !!checked)}
          />
          {userList.length > 0 && selectedUsers.length === 0 && (
            <Checkbox
              checked={userList.every(u => selectedUsers.includes(u.id))}
              onCheckedChange={(checked) => handleSelectAll(userList, !!checked)}
            />
          )}
        </div>
      )
    },
    {
      title: 'User',
      key: 'user',
      render: (_: any, user: ExtendedUserProfile) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            {getRoleIcon(user.role)}
          </div>
          <div>
            <div className="font-medium">{user.full_name || 'N/A'}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
          </div>
        </div>
      )
    },
    {
      title: 'Contact & Role',
      key: 'contact',
      render: (_: any, user: ExtendedUserProfile) => (
        <div className="space-y-2">
          <div className="flex items-center text-sm">
            <Phone className="h-3 w-3 mr-1" />
            {user.phone || 'No phone'}
          </div>
          <Badge variant={getRoleBadgeVariant(user.role)}>
            {user.role.replace('_', ' ')}
          </Badge>
        </div>
      )
    },
    {
      title: 'Status & Activity',
      key: 'status',
      render: (_: any, user: ExtendedUserProfile) => (
        <div className="space-y-2">
          <Badge variant={getStatusBadgeVariant(user.verificationStatus || 'pending')}>
            {user.verificationStatus || 'pending'}
          </Badge>
          <div className="text-xs text-muted-foreground">
            Joined: {new Date(user.created_at).toLocaleDateString()}
          </div>
        </div>
      )
    },
    {
      title: 'Stats',
      key: 'stats',
      render: (_: any, user: ExtendedUserProfile) => (
        <div className="text-sm space-y-1">
          {user.role === 'student' && (
            <div className="text-muted-foreground">Student Account</div>
          )}
          {user.role === 'merchant' && (
            <div className="text-muted-foreground">Merchant Account</div>
          )}
          {!['student', 'merchant'].includes(user.role) && (
            <div className="text-muted-foreground">Admin Access</div>
          )}
        </div>
      )
    },
    {
      title: 'Joined',
      key: 'created_at',
      render: (_: any, user: ExtendedUserProfile) => (
        <div className="flex items-center text-sm">
          <Calendar className="h-3 w-3 mr-1" />
          {new Date(user.created_at).toLocaleDateString()}
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, user: ExtendedUserProfile) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleViewUser(user)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEditUser(user)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit User
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleDeleteUser(user)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  const TabContent = ({ 
    users, 
    title, 
    icon, 
    description 
  }: { 
    users: ExtendedUserProfile[], 
    title: string, 
    icon: React.ReactNode,
    description: string 
  }) => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {icon}
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {selectedUsers.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={bulkActionLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected ({selectedUsers.length})
            </Button>
          )}
          <Button onClick={() => setUserModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      <ResponsiveTable
        data={users}
        columns={createUserColumns(users)}
        loading={loading}
        emptyMessage={`No ${title.toLowerCase()} found`}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Advanced User Management"
        description="Comprehensive user management with role-based organization and advanced features"
        breadcrumbs={[
          { label: "Dashboard", href: "#", onClick: () => {} },
          { label: "User Management", active: true }
        ]}
      />

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enhancedUsers.length}</div>
            <p className="text-xs text-muted-foreground">
              +{enhancedUsers.filter(u => {
                const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                return new Date(u.created_at) > weekAgo;
              }).length} this week
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{studentUsers.length}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((studentUsers.length / enhancedUsers.length) * 100)}% of total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Merchants</CardTitle>
            <Store className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{merchantUsers.length}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((merchantUsers.length / enhancedUsers.length) * 100)}% of total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operational Staff</CardTitle>
            <Shield className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{operationalUsers.length}</div>
            <p className="text-xs text-muted-foreground">
              Admin & Support teams
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verification Pending</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {enhancedUsers.filter(u => u.verificationStatus === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Advanced Filters</span>
            </CardTitle>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Users
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setDateFilter("all");
                setSelectedUsers([]);
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Role-based Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>All Users ({filteredAllUsers.length})</span>
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center space-x-2">
            <GraduationCap className="h-4 w-4" />
            <span>Students ({filteredStudents.length})</span>
          </TabsTrigger>
          <TabsTrigger value="merchants" className="flex items-center space-x-2">
            <Store className="h-4 w-4" />
            <span>Merchants ({filteredMerchants.length})</span>
          </TabsTrigger>
          <TabsTrigger value="operational" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Staff ({filteredOperational.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <TabContent
            users={filteredAllUsers}
            title="All Users"
            icon={<Users className="h-5 w-5" />}
            description="Complete overview of all platform users across all roles"
          />
        </TabsContent>

        <TabsContent value="students">
          <TabContent
            users={filteredStudents}
            title="Students"
            icon={<GraduationCap className="h-5 w-5 text-primary" />}
            description="Manage student accounts, bookings, and activity"
          />
        </TabsContent>

        <TabsContent value="merchants">
          <TabContent
            users={filteredMerchants}
            title="Merchants"
            icon={<Store className="h-5 w-5 text-secondary" />}
            description="Manage merchant accounts, study halls, and revenue tracking"
          />
        </TabsContent>

        <TabsContent value="operational">
          <TabContent
            users={filteredOperational}
            title="Operational Staff"
            icon={<Shield className="h-5 w-5 text-orange-500" />}
            description="Manage admin, telemarketing, and support staff accounts"
          />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <UserModal
        open={userModalOpen}
        onOpenChange={setUserModalOpen}
        onSubmit={handleUserSubmit}
        user={editingUser}
        isEdit={!!editingUser}
      />

      {selectedUser?.role === 'merchant' ? (
        <MerchantDetailModal
          open={userDetailOpen}
          onOpenChange={setUserDetailOpen}
          merchant={selectedUser}
        />
      ) : (
        <EnhancedUserDetailModal
          open={userDetailOpen}
          onOpenChange={setUserDetailOpen}
          user={selectedUser}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account
              {userToDelete && ` for ${userToDelete.full_name || userToDelete.email}`} and remove all
              associated data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};