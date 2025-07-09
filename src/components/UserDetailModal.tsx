import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Phone, Calendar, MapPin, CreditCard } from "lucide-react";

interface UserData {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  role: "admin" | "merchant" | "student";
  created_at: string;
  updated_at: string;
}

interface UserDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserData | null;
  bookingsCount?: number;
  totalSpent?: number;
  studyHallsCount?: number;
}

export function UserDetailModal({ 
  open, 
  onOpenChange, 
  user, 
  bookingsCount = 0, 
  totalSpent = 0,
  studyHallsCount = 0 
}: UserDetailModalProps) {
  if (!user) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "merchant":
        return "bg-blue-100 text-blue-800";
      case "student":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Details
          </DialogTitle>
          <DialogDescription>
            Complete profile information and activity summary
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Name:</span>
                </div>
                <span>{user.full_name || 'Not provided'}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Email:</span>
                </div>
                <span>{user.email}</span>
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
                  <Badge className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Role:</span>
                </div>
                <Badge className={getRoleColor(user.role)}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Joined:</span>
                </div>
                <span>{formatDate(user.created_at)}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Last Updated:</span>
                </div>
                <span>{formatDate(user.updated_at)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Activity Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Activity Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {user.role === "student" && (
                  <>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-primary">{bookingsCount}</div>
                      <div className="text-sm text-muted-foreground">Total Bookings</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-green-600">₹{totalSpent.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Total Spent</div>
                    </div>
                  </>
                )}

                {user.role === "merchant" && (
                  <>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-primary">{studyHallsCount}</div>
                      <div className="text-sm text-muted-foreground">Study Halls</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{bookingsCount}</div>
                      <div className="text-sm text-muted-foreground">Total Bookings</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-green-600">₹{totalSpent.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Revenue</div>
                    </div>
                  </>
                )}

                {user.role === "admin" && (
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-red-600">Admin</div>
                    <div className="text-sm text-muted-foreground">Full Access</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Account Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">User ID:</span>
                <span className="font-mono text-xs">{user.id}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Account Status:</span>
                <Badge variant="outline" className="text-green-600">Active</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}