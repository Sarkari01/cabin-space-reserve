import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  Settings, 
  Users, 
  Activity, 
  Clock, 
  CheckCircle,
  BarChart3,
  Database,
  Bell
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import ProfileSection from "@/components/ProfileSection";
import { useState } from "react";

const AdminProfileSection = () => {
  const { userProfile } = useAuth();
  const [showDetailedProfile, setShowDetailedProfile] = useState(false);

  if (showDetailedProfile) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Admin Profile Settings</h2>
            <p className="text-muted-foreground">
              Manage your admin profile information and settings
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowDetailedProfile(false)}
          >
            Back to Admin Dashboard
          </Button>
        </div>
        <ProfileSection />
      </div>
    );
  }

  const adminPermissions = [
    { name: "User Management", description: "Create, edit, and manage user accounts", icon: Users },
    { name: "Content Management", description: "Manage news, banners, and announcements", icon: BarChart3 },
    { name: "System Settings", description: "Configure application settings and preferences", icon: Settings },
    { name: "Analytics Access", description: "View detailed system analytics and reports", icon: Activity },
    { name: "Database Access", description: "Access and manage database operations", icon: Database },
    { name: "Notification Management", description: "Send system-wide notifications", icon: Bell },
  ];

  const recentActivity = [
    { action: "Updated system settings", time: "2 hours ago", type: "settings" },
    { action: "Approved merchant verification", time: "4 hours ago", type: "approval" },
    { action: "Created system announcement", time: "1 day ago", type: "content" },
    { action: "Generated analytics report", time: "2 days ago", type: "analytics" },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'settings': return <Settings className="h-4 w-4" />;
      case 'approval': return <CheckCircle className="h-4 w-4" />;
      case 'content': return <BarChart3 className="h-4 w-4" />;
      case 'analytics': return <Activity className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Administrator Dashboard</h2>
          <p className="text-muted-foreground">
            System administration and management overview
          </p>
        </div>
        <Button onClick={() => setShowDetailedProfile(true)}>
          <Settings className="h-4 w-4 mr-2" />
          Profile Settings
        </Button>
      </div>

      {/* Admin Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Administrator Status
          </CardTitle>
          <CardDescription>
            Your administrative role and access information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <Badge variant="default" className="mb-2">
                System Administrator
              </Badge>
              <p className="text-sm text-muted-foreground">Role Level</p>
            </div>
            <div className="text-center">
              <Badge variant="default" className="mb-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </Badge>
              <p className="text-sm text-muted-foreground">Account Status</p>
            </div>
            <div className="text-center">
              <Badge variant="default" className="mb-2">
                Full Access
              </Badge>
              <p className="text-sm text-muted-foreground">Permission Level</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Admin Since:</span>
                <div className="font-medium">
                  {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : 'N/A'}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Last Login:</span>
                <div className="font-medium">
                  {new Date().toLocaleDateString()} (Current Session)
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Administrative Permissions
          </CardTitle>
          <CardDescription>
            Your current system access and capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {adminPermissions.map((permission, index) => {
              const IconComponent = permission.icon;
              return (
                <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <IconComponent className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{permission.name}</h4>
                    <p className="text-sm text-muted-foreground">{permission.description}</p>
                  </div>
                  <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Enabled
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Administrative Activity
          </CardTitle>
          <CardDescription>
            Your recent actions and system interactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                <div className="p-1 bg-muted rounded">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{activity.action}</p>
                  <p className="text-sm text-muted-foreground">{activity.time}</p>
                </div>
                <Badge variant="outline">
                  {activity.type}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            System Information
          </CardTitle>
          <CardDescription>
            Current system status and configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
            <div className="space-y-1">
              <p className="text-2xl font-bold text-primary">98.5%</p>
              <p className="text-sm text-muted-foreground">System Uptime</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-green-600">1,247</p>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-blue-600">89</p>
              <p className="text-sm text-muted-foreground">Active Merchants</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-purple-600">5,432</p>
              <p className="text-sm text-muted-foreground">Total Bookings</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProfileSection;