import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  User, Mail, Phone, Calendar, MapPin, CreditCard, 
  Building, GraduationCap, Store, Shield, 
  Activity, TrendingUp, Clock, CheckCircle
} from "lucide-react";

interface ExtendedUserData {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  role: string;
  created_at: string;
  updated_at: string;
  bookingsCount?: number;
  totalSpent?: number;
  studyHallsCount?: number;
  lastActivity?: string;
  verificationStatus?: 'verified' | 'pending' | 'rejected';
}

interface EnhancedUserDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: ExtendedUserData | null;
}

export function EnhancedUserDetailModal({ 
  open, 
  onOpenChange, 
  user
}: EnhancedUserDetailModalProps) {
  if (!user) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "merchant":
        return "secondary";
      case "student":
        return "default";
      case "telemarketing_executive":
        return "outline";
      default:
        return "outline";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="h-4 w-4" />;
      case "merchant":
        return <Store className="h-4 w-4" />;
      case "student":
        return <GraduationCap className="h-4 w-4" />;
      case "telemarketing_executive":
        return <Building className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "default";
      case "pending":
        return "outline";
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(user.full_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-lg font-semibold">{user.full_name || 'User Profile'}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
          </DialogTitle>
          <DialogDescription>
            Complete profile information and activity analytics
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Full Name:</span>
                </div>
                <span>{user.full_name || 'Not provided'}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Email:</span>
                </div>
                <span className="font-mono text-sm">{user.email}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Phone:</span>
                </div>
                <span>{user.phone || 'Not provided'}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getRoleIcon(user.role)}
                  <span className="font-medium">Role:</span>
                </div>
                <Badge variant={getRoleColor(user.role)}>
                  {user.role.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Status:</span>
                </div>
                <Badge variant={getStatusColor(user.verificationStatus || 'pending')}>
                  {user.verificationStatus || 'pending'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Account Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Account Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Joined:</span>
                </div>
                <span className="text-sm">{formatDate(user.created_at)}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Last Updated:</span>
                </div>
                <span className="text-sm">{formatDate(user.updated_at)}</span>
              </div>

              {user.lastActivity && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Last Activity:</span>
                  </div>
                  <span className="text-sm">{formatDate(user.lastActivity)}</span>
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Account Details</div>
                <div className="text-xs font-mono bg-muted p-2 rounded">
                  ID: {user.id}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Activity & Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {user.role === "student" && (
                <>
                  <div className="text-center p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{user.bookingsCount || 0}</div>
                    <div className="text-sm text-muted-foreground">Total Bookings</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">₹{user.totalSpent?.toLocaleString() || 0}</div>
                    <div className="text-sm text-muted-foreground">Total Spent</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {user.bookingsCount ? Math.round((user.totalSpent || 0) / user.bookingsCount) : 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Avg. Booking Value</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {user.verificationStatus === 'verified' ? '✓' : '⏳'}
                    </div>
                    <div className="text-sm text-muted-foreground">Account Status</div>
                  </div>
                </>
              )}

              {user.role === "merchant" && (
                <>
                  <div className="text-center p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{user.studyHallsCount || 0}</div>
                    <div className="text-sm text-muted-foreground">Study Halls</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{user.bookingsCount || 0}</div>
                    <div className="text-sm text-muted-foreground">Total Bookings</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">₹{user.totalSpent?.toLocaleString() || 0}</div>
                    <div className="text-sm text-muted-foreground">Revenue Generated</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {user.studyHallsCount ? Math.round((user.bookingsCount || 0) / user.studyHallsCount) : 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Avg. Bookings/Hall</div>
                  </div>
                </>
              )}

              {!["student", "merchant"].includes(user.role) && (
                <>
                  <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">Admin</div>
                    <div className="text-sm text-muted-foreground">Access Level</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="text-2xl font-bold text-gray-600">Full</div>
                    <div className="text-sm text-muted-foreground">Permissions</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {user.verificationStatus === 'verified' ? 'Active' : 'Pending'}
                    </div>
                    <div className="text-sm text-muted-foreground">Account Status</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">Platform</div>
                    <div className="text-sm text-muted-foreground">Role Type</div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button>
            Edit User
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}