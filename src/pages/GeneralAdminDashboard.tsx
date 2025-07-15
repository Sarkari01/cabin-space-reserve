import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useOperationalUsers } from "@/hooks/useOperationalUsers";
import { useAdminData } from "@/hooks/useAdminData";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/PageHeader";
import { ResponsiveTable } from "@/components/ResponsiveTable";
import { Users, Settings, Shield, TrendingUp, Search, Plus, Eye, Edit, UserCheck } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const GeneralAdminDashboard = () => {
  const { user } = useAuth();
  const { operationalUsers, loading, createOperationalUser, updateOperationalUser, refetch } = useOperationalUsers();
  const { stats } = useAdminData();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("overview");
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'telemarketing_executive' as const,
    department: '',
    employee_id: '',
    permissions: {}
  });

  const activeOperationalUsers = operationalUsers.filter(user => 
    user.admin_profile?.status === 'active'
  );

  const todaysUsers = operationalUsers.filter(user => 
    new Date(user.created_at).toDateString() === new Date().toDateString()
  );

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await createOperationalUser(formData);
      setUserModalOpen(false);
      setFormData({
        email: '',
        password: '',
        full_name: '',
        phone: '',
        role: 'telemarketing_executive',
        department: '',
        employee_id: '',
        permissions: {}
      });
      refetch();
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      password: '',
      full_name: user.full_name || '',
      phone: user.phone || '',
      role: user.role,
      department: user.admin_profile?.department || '',
      employee_id: user.admin_profile?.employee_id || '',
      permissions: user.admin_profile?.permissions || {}
    });
    setUserModalOpen(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      await updateOperationalUser(selectedUser.id, {
        full_name: formData.full_name,
        phone: formData.phone,
        department: formData.department,
        permissions: formData.permissions,
        status: 'active'
      });
      setUserModalOpen(false);
      setSelectedUser(null);
      refetch();
    } catch (error) {
      // Error handled by hook
    }
  };

  const dashboardStats = [
    {
      title: "Operational Users",
      value: activeOperationalUsers.length,
      icon: Users,
      trend: { value: 3, label: "active users" }
    },
    {
      title: "Today's New Users",
      value: todaysUsers.length,
      icon: UserCheck,
      trend: { value: 1, label: "created today" }
    },
    {
      title: "Total Platform Users",
      value: stats.totalUsers || 0,
      icon: TrendingUp,
      trend: { value: 12, label: "from last month" }
    },
    {
      title: "System Status",
      value: "Operational",
      icon: Settings,
      trend: { value: 99.9, label: "uptime" }
    }
  ];

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'telemarketing_executive':
        return 'default';
      case 'pending_payments_caller':
        return 'secondary';
      case 'customer_care_executive':
        return 'outline';
      case 'settlement_manager':
        return 'destructive';
      case 'general_administrator':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'suspended':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <>
      <Dialog open={userModalOpen} onOpenChange={setUserModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedUser ? 'Edit User' : 'Create New User'}</DialogTitle>
            <DialogDescription>
              {selectedUser ? 'Update user information' : 'Create a new operational user account'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={selectedUser ? handleUpdateUser : handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  disabled={!!selectedUser}
                  required
                />
              </div>
            </div>

            {!selectedUser && (
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as typeof prev.role }))}
                  disabled={!!selectedUser}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="telemarketing_executive">Telemarketing Executive</SelectItem>
                    <SelectItem value="pending_payments_caller">Payments Caller</SelectItem>
                    <SelectItem value="customer_care_executive">Customer Care</SelectItem>
                    <SelectItem value="settlement_manager">Settlement Manager</SelectItem>
                    <SelectItem value="general_administrator">General Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="employee_id">Employee ID</Label>
                <Input
                  id="employee_id"
                  value={formData.employee_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, employee_id: e.target.value }))}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setUserModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {selectedUser ? 'Update User' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DashboardSidebar
        userRole="general_administrator"
        userName={user?.email || "General Admin"}
        onTabChange={setActiveTab}
        activeTab={activeTab}
      >
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <PageHeader
              title="General Administrator Dashboard"
              description="Manage operational users and system administration"
              breadcrumbs={[
                { label: "Dashboard", active: true }
              ]}
              actions={
                <Button onClick={() => setUserModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              }
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {dashboardStats.map((stat, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">
                      +{stat.trend.value} {stat.trend.label}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recent Users */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Operational Users</CardTitle>
                <CardDescription>Recently created operational user accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {operationalUsers.slice(0, 5).map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{user.full_name || 'No name'}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.admin_profile?.department || 'No department'} • 
                          {user.admin_profile?.employee_id || 'No ID'}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={getRoleColor(user.role)}>
                          {user.role.replace('_', ' ')}
                        </Badge>
                        <div className="mt-1">
                          <Badge variant={getStatusColor(user.admin_profile?.status || 'inactive')}>
                            {user.admin_profile?.status || 'inactive'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Created: {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <PageHeader
              title="Operational Users"
              description="Manage all operational user accounts"
              breadcrumbs={[
                { label: "Dashboard", href: "#", onClick: () => setActiveTab("overview") },
                { label: "Users", active: true }
              ]}
              actions={
                <Button onClick={() => setUserModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              }
            />

            <ResponsiveTable
              data={operationalUsers}
              columns={[
                {
                  key: 'full_name',
                  title: 'Name',
                  render: (value, user) => (
                    <div>
                      <p className="font-medium">{value || 'No name'}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  )
                },
                {
                  key: 'role',
                  title: 'Role',
                  render: (value) => (
                    <Badge variant={getRoleColor(value)}>
                      {value.replace('_', ' ')}
                    </Badge>
                  )
                },
                {
                  key: 'admin_profile',
                  title: 'Department',
                  render: (value) => (
                    <div>
                      <p className="text-sm">{value?.department || 'No department'}</p>
                      <p className="text-xs text-muted-foreground">ID: {value?.employee_id || 'No ID'}</p>
                    </div>
                  )
                },
                {
                  key: 'admin_profile',
                  title: 'Status',
                  render: (value) => (
                    <Badge variant={getStatusColor(value?.status || 'inactive')}>
                      {value?.status || 'inactive'}
                    </Badge>
                  )
                },
                {
                  key: 'created_at',
                  title: 'Created',
                  mobileHidden: true,
                  render: (value) => new Date(value).toLocaleDateString()
                }
              ]}
              searchPlaceholder="Search users..."
              loading={loading}
              onRowClick={(user) => handleEditUser(user)}
              actions={(user) => (
                <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            />
          </div>
        )}
      </DashboardSidebar>
    </>
  );
};

export default GeneralAdminDashboard;