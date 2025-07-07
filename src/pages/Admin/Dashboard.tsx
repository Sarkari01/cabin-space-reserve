import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Home, DollarSign, TrendingUp, User, Building, LogOut, Settings, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
  const [user] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : { name: "Admin", email: "admin@demo.com" };
  });

  const systemStats = [
    {
      title: "Total Users",
      value: "1,234",
      icon: Users,
      change: "+12% from last month"
    },
    {
      title: "Total Cabins",
      value: "89",
      icon: Home,
      change: "+5 this month"
    },
    {
      title: "Total Revenue",
      value: "$45,230",
      icon: DollarSign,
      change: "+23% from last month"
    },
    {
      title: "Active Bookings",
      value: "156",
      icon: TrendingUp,
      change: "+8% this week"
    }
  ];

  const recentUsers = [
    {
      id: 1,
      name: "John Smith",
      email: "john@example.com",
      role: "student",
      joinDate: "2024-01-10",
      status: "active"
    },
    {
      id: 2,
      name: "Sarah Johnson",
      email: "sarah@example.com",
      role: "merchant",
      joinDate: "2024-01-09",
      status: "active"
    },
    {
      id: 3,
      name: "Mike Davis",
      email: "mike@example.com",
      role: "student",
      joinDate: "2024-01-08",
      status: "pending"
    }
  ];

  const pendingCabins = [
    {
      id: 1,
      name: "Riverside Cabin",
      owner: "Alice Cooper",
      location: "River Valley",
      price: 55,
      submissionDate: "2024-01-12",
      status: "pending"
    },
    {
      id: 2,
      name: "Desert Oasis",
      owner: "Bob Wilson",
      location: "Desert Springs",
      price: 40,
      submissionDate: "2024-01-11",
      status: "under_review"
    }
  ];

  const recentPayments = [
    {
      id: 1,
      booking: "Forest Retreat",
      user: "John Smith",
      amount: "$270",
      date: "2024-01-15",
      status: "completed"
    },
    {
      id: 2,
      booking: "Mountain View",
      user: "Sarah Johnson",
      amount: "$195",
      date: "2024-01-14",
      status: "completed"
    },
    {
      id: 3,
      booking: "Lakeside Cabin",
      user: "Mike Davis",
      amount: "$175",
      date: "2024-01-13",
      status: "pending"
    }
  ];

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg"></div>
              <h1 className="text-xl font-bold text-foreground">CabinSpace Admin</h1>
            </Link>
            
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <span className="text-sm text-muted-foreground">Welcome, {user.name}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h2>
            <p className="text-muted-foreground">Monitor and manage the CabinSpace platform</p>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Administrator Access</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {systemStats.map((stat, index) => (
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

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="cabins">Cabins</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">User Management</h3>
              <Button variant="outline">
                <User className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
            
            <div className="space-y-4">
              {recentUsers.map((user) => (
                <Card key={user.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold">{user.name}</h4>
                          <Badge variant={user.role === "merchant" ? "default" : "secondary"}>
                            {user.role}
                          </Badge>
                          <Badge variant={user.status === "active" ? "default" : "secondary"}>
                            {user.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.email} • Joined {user.joinDate}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          View Profile
                        </Button>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                        {user.status === "pending" && (
                          <Button size="sm">
                            Approve
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Cabins Tab */}
          <TabsContent value="cabins" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Cabin Management</h3>
              <Button variant="outline">
                <Building className="h-4 w-4 mr-2" />
                View All Cabins
              </Button>
            </div>
            
            <div>
              <h4 className="text-lg font-medium mb-4">Pending Approvals</h4>
              <div className="space-y-4">
                {pendingCabins.map((cabin) => (
                  <Card key={cabin.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold">{cabin.name}</h4>
                            <Badge variant={cabin.status === "pending" ? "secondary" : "outline"}>
                              {cabin.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            By {cabin.owner} • {cabin.location} • ${cabin.price}/day • Submitted {cabin.submissionDate}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                          <Button size="sm">
                            Approve
                          </Button>
                          <Button variant="outline" size="sm">
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">Payment Management</h3>
              <div className="space-y-4">
                {recentPayments.map((payment) => (
                  <Card key={payment.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold">{payment.booking}</h4>
                            <Badge variant={payment.status === "completed" ? "default" : "secondary"}>
                              {payment.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {payment.user} • {payment.date}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold">{payment.amount}</p>
                          <div className="flex space-x-2 mt-2">
                            <Button variant="outline" size="sm">
                              View Transaction
                            </Button>
                            {payment.status === "pending" && (
                              <Button size="sm">
                                Process
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Revenue</CardTitle>
                  <CardDescription>Total revenue across all transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Revenue Analytics Chart</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>User Growth</CardTitle>
                  <CardDescription>New user registrations over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">User Growth Chart</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Booking Statistics</CardTitle>
                  <CardDescription>Booking trends and patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Booking Statistics Chart</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Cabin Performance</CardTitle>
                  <CardDescription>Most popular cabins and occupancy rates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Cabin Performance Chart</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;