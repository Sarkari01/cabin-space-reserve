import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, Building, DollarSign, TrendingUp, Search, Plus, Eye, Edit, Ban } from "lucide-react";
import { DashboardSidebar } from "@/components/DashboardSidebar";

const AdminDashboard = () => {
  const [user] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : { name: "Admin", email: "admin@demo.com" };
  });

  const [activeTab, setActiveTab] = useState("overview");

  const stats = [
    {
      title: "Total Users",
      value: "1,234",
      icon: Users,
      change: "+12% from last month"
    },
    {
      title: "Active Study Halls",
      value: "89",
      icon: Building,
      change: "+3 this week"
    },
    {
      title: "Monthly Revenue",
      value: "₹45,230",
      icon: DollarSign,
      change: "+18% from last month"
    },
    {
      title: "Growth Rate",
      value: "23.5%",
      icon: TrendingUp,
      change: "+2.4% from last month"
    }
  ];

  const recentUsers = [
    {
      id: 1,
      name: "John Smith",
      email: "john@example.com",
      role: "Student",
      status: "active",
      joinDate: "2024-01-15"
    },
    {
      id: 2,
      name: "Sarah Johnson",
      email: "sarah@example.com",
      role: "Merchant",
      status: "active",
      joinDate: "2024-01-14"
    },
    {
      id: 3,
      name: "Mike Davis",
      email: "mike@example.com",
      role: "Student",
      status: "pending",
      joinDate: "2024-01-13"
    }
  ];

  const allStudyHalls = [
    {
      id: 1,
      name: "Central Study Hub",
      owner: "Alice Cooper",
      location: "Downtown",
      totalSeats: 25,
      occupiedSeats: 18,
      dailyRate: 100,
      status: "active",
      bookings: 12,
      revenue: "₹18,000"
    },
    {
      id: 2,
      name: "Tech Campus Library",
      owner: "Bob Wilson",
      location: "Tech Park",
      totalSeats: 40,
      occupiedSeats: 32,
      dailyRate: 150,
      status: "active",
      bookings: 8,
      revenue: "₹32,000"
    },
    {
      id: 3,
      name: "Quiet Zone Study",
      owner: "Carol Brown",
      location: "University Area",
      totalSeats: 20,
      occupiedSeats: 0,
      dailyRate: 120,
      status: "pending",
      bookings: 0,
      revenue: "₹0"
    }
  ];

  const allMerchants = [
    {
      id: 1,
      name: "Alice Cooper",
      email: "alice@example.com",
      studyHalls: 2,
      totalRevenue: "₹45,000",
      status: "active",
      joinDate: "2024-01-10"
    },
    {
      id: 2,
      name: "Bob Wilson",
      email: "bob@example.com",
      studyHalls: 1,
      totalRevenue: "₹32,000",
      status: "active",
      joinDate: "2024-01-08"
    },
    {
      id: 3,
      name: "Carol Brown",
      email: "carol@example.com",
      studyHalls: 1,
      totalRevenue: "₹0",
      status: "pending",
      joinDate: "2024-01-12"
    }
  ];

  const allUsers = [
    ...recentUsers,
    {
      id: 4,
      name: "Emily Davis",
      email: "emily@example.com",
      role: "Student",
      status: "active",
      joinDate: "2024-01-12"
    },
    {
      id: 5,
      name: "David Wilson",
      email: "david@example.com",
      role: "Merchant",
      status: "suspended",
      joinDate: "2024-01-10"
    }
  ];

  return (
    <DashboardSidebar 
      userRole="admin" 
      userName={user.name}
      onTabChange={setActiveTab}
      activeTab={activeTab}
    >
      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Welcome Section */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h2>
              <p className="text-muted-foreground">Monitor and manage the entire platform</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                      </div>
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <stat.icon className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Users</CardTitle>
                  <CardDescription>Newly registered users</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={user.status === "active" ? "default" : "secondary"}>
                            {user.role}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">{user.joinDate}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Study Halls</CardTitle>
                  <CardDescription>Latest study hall submissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {allStudyHalls.slice(0, 3).map((studyHall) => (
                      <div key={studyHall.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{studyHall.name}</p>
                          <p className="text-sm text-muted-foreground">{studyHall.location}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={studyHall.status === "active" ? "default" : "secondary"}>
                            {studyHall.status}
                          </Badge>
                          <p className="text-sm font-medium">₹{studyHall.dailyRate}/day</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold">User Management</h3>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                className="pl-10"
              />
            </div>

            {/* Users Table */}
            <div className="space-y-4">
              {allUsers.map((user) => (
                <Card key={user.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold">{user.name}</h4>
                          <Badge variant={user.status === "active" ? "default" : user.status === "suspended" ? "destructive" : "secondary"}>
                            {user.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-sm text-muted-foreground">Role: {user.role} • Joined: {user.joinDate}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          <Ban className="h-4 w-4 mr-1" />
                          Suspend
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Merchants Tab */}
        {activeTab === "merchants" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold">Merchant Management</h3>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Merchant
              </Button>
            </div>

            <div className="space-y-4">
              {allMerchants.map((merchant) => (
                <Card key={merchant.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold">{merchant.name}</h4>
                          <Badge variant={merchant.status === "active" ? "default" : merchant.status === "suspended" ? "destructive" : "secondary"}>
                            {merchant.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{merchant.email}</p>
                        <p className="text-sm text-muted-foreground">
                          Study Halls: {merchant.studyHalls} • Revenue: {merchant.totalRevenue} • Joined: {merchant.joinDate}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          <Ban className="h-4 w-4 mr-1" />
                          Suspend
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Study Halls Tab */}
        {activeTab === "studyhalls" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold">Study Hall Management</h3>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {allStudyHalls.map((studyHall) => (
                <Card key={studyHall.id} className="hover:shadow-md transition-shadow">
                  <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <span className="text-muted-foreground">{studyHall.name}</span>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-lg font-semibold mb-1">{studyHall.name}</h4>
                        <p className="text-sm text-muted-foreground">{studyHall.location}</p>
                        <p className="text-sm text-muted-foreground">Owner: {studyHall.owner}</p>
                      </div>
                      <Badge variant={studyHall.status === "active" ? "default" : "secondary"}>
                        {studyHall.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Seats</p>
                        <p className="font-semibold">{studyHall.totalSeats}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Occupied</p>
                        <p className="font-semibold">{studyHall.occupiedSeats}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Daily Rate</p>
                        <p className="font-semibold">₹{studyHall.dailyRate}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Revenue</p>
                        <p className="font-semibold">{studyHall.revenue}</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="h-4 w-4 mr-1" />
                        View Layout
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant={studyHall.status === "active" ? "destructive" : "default"} size="sm">
                        {studyHall.status === "active" ? "Disable" : "Approve"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold">Analytics & Reports</h3>
            
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Analytics</CardTitle>
                  <CardDescription>Platform revenue over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Revenue Chart Placeholder</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>User Growth</CardTitle>
                  <CardDescription>New user registrations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">User Growth Chart Placeholder</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Booking Trends</CardTitle>
                  <CardDescription>Platform booking patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Booking Chart Placeholder</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Popular Locations</CardTitle>
                  <CardDescription>Most booked cabin locations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Location Chart Placeholder</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardSidebar>
  );
};

export default AdminDashboard;