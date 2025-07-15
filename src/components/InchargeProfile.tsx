import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building,
  Shield,
  Calendar,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type Incharge = Tables<'incharges'>;

interface InchargeProfileProps {
  inchargeData: Incharge;
  assignedStudyHalls: any[];
}

export function InchargeProfile({ inchargeData, assignedStudyHalls }: InchargeProfileProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case 'inactive':
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Inactive
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            {status}
          </Badge>
        );
    }
  };

  const formatPermissions = (permissions: any) => {
    if (!permissions || typeof permissions !== 'object') return [];
    
    return Object.entries(permissions)
      .filter(([_, value]) => value === true)
      .map(([key, _]) => key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()));
  };

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{inchargeData.full_name}</p>
                <p className="text-sm text-muted-foreground">Full Name</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{inchargeData.email}</p>
                <p className="text-sm text-muted-foreground">Email Address</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{inchargeData.mobile}</p>
                <p className="text-sm text-muted-foreground">Mobile Number</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(inchargeData.status)}
                </div>
                <p className="text-sm text-muted-foreground">Account Status</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {new Date(inchargeData.created_at).toLocaleDateString()}
                </p>
                <p className="text-sm text-muted-foreground">Member Since</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Account Details */}
          <div className="space-y-4">
            <h3 className="font-semibold">Account Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Authentication Method</p>
                <p className="font-medium capitalize">{inchargeData.auth_method || 'Not Set'}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Account Activated</p>
                <Badge variant={inchargeData.account_activated ? "default" : "secondary"}>
                  {inchargeData.account_activated ? 'Yes' : 'No'}
                </Badge>
              </div>

              {inchargeData.invitation_sent_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Invitation Sent</p>
                  <p className="font-medium">
                    {new Date(inchargeData.invitation_sent_at).toLocaleDateString()}
                  </p>
                </div>
              )}

              {inchargeData.password_last_changed && (
                <div>
                  <p className="text-sm text-muted-foreground">Password Last Changed</p>
                  <p className="font-medium">
                    {new Date(inchargeData.password_last_changed).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {formatPermissions(inchargeData.permissions).length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {formatPermissions(inchargeData.permissions).map((permission) => (
                  <Badge key={permission} variant="outline">
                    {permission}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No permissions assigned</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Assigned Study Halls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="h-5 w-5 mr-2" />
            Assigned Study Halls
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignedStudyHalls.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {assignedStudyHalls.map((hall) => (
                <div key={hall.id} className="border rounded-lg p-3">
                  <h3 className="font-medium">{hall.name}</h3>
                  <p className="text-sm text-muted-foreground flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    {hall.location}
                  </p>
                  <div className="flex justify-between items-center mt-2 text-xs">
                    <span>Daily: ₹{hall.daily_price}</span>
                    <Badge variant="outline">{hall.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No study halls assigned</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}