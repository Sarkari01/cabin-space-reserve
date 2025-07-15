import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminData } from '@/hooks/useAdminData';
import { PageHeader } from '@/components/PageHeader';
import { ResponsiveTable } from '@/components/ResponsiveTable';
import { User, Mail, Phone, Search, Eye, Calendar, Shield } from 'lucide-react';
import { UserDetailModal } from '@/components/UserDetailModal';

export const TelemarketingUsersTab = () => {
  const { users, merchants, students, loading } = useAdminData();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userDetailOpen, setUserDetailOpen] = useState(false);

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const handleViewUser = (user: any) => {
    setSelectedUser(user);
    setUserDetailOpen(true);
  };

  const getStatusBadge = (role: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      student: 'default',
      merchant: 'secondary',
      admin: 'destructive',
      telemarketing_executive: 'outline'
    };
    return variants[role] || 'outline';
  };

  const userColumns = [
    {
      title: 'User',
      key: 'user',
      render: (_: any, user: any) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="font-medium">{user?.full_name || 'N/A'}</div>
            <div className="text-sm text-muted-foreground">{user?.email || 'No email'}</div>
          </div>
        </div>
      )
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_: any, user: any) => (
        <div className="space-y-1">
          <div className="flex items-center text-sm">
            <Phone className="h-3 w-3 mr-1" />
            {user?.phone || 'No phone'}
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Mail className="h-3 w-3 mr-1" />
            {user?.email || 'No email'}
          </div>
        </div>
      )
    },
    {
      title: 'Role',
      key: 'role',
      render: (_: any, user: any) => (
        <Badge variant={getStatusBadge(user?.role || '')}>
          {user?.role || 'Unknown'}
        </Badge>
      )
    },
    {
      title: 'Joined',
      key: 'created_at',
      render: (_: any, user: any) => (
        <div className="flex items-center text-sm">
          <Calendar className="h-3 w-3 mr-1" />
          {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, user: any) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleViewUser(user)}
          disabled={!user}
        >
          <Eye className="h-4 w-4 mr-1" />
          View Details
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users Management"
        description="View and manage platform users"
        breadcrumbs={[
          { label: "Dashboard", href: "#", onClick: () => {} },
          { label: "Users Management", active: true }
        ]}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <User className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {students.length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Merchants</CardTitle>
            <Shield className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">
              {merchants.length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => {
                const monthAgo = new Date();
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                return new Date(u.created_at) > monthAgo;
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Users</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-[250px]"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="student">Students</SelectItem>
                  <SelectItem value="merchant">Merchants</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveTable
            data={filteredUsers}
            columns={userColumns}
            loading={loading}
            emptyMessage="No users found"
          />
        </CardContent>
      </Card>

      {/* User Detail Modal */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          open={userDetailOpen}
          onOpenChange={setUserDetailOpen}
        />
      )}
    </div>
  );
};