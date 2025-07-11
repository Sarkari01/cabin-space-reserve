import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Mail, Phone, Building } from "lucide-react";

interface MerchantDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  merchant: any;
  studyHalls: any[];
}

export function MerchantDetailModal({ open, onOpenChange, merchant, studyHalls }: MerchantDetailModalProps) {
  if (!merchant) return null;

  const merchantStudyHalls = studyHalls.filter(sh => sh.merchant_id === merchant.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Merchant Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{merchant.full_name || 'Anonymous'}</h3>
                  <Badge variant="default">{merchant.role}</Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{merchant.email}</span>
                  </div>
                  
                  {merchant.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{merchant.phone}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Joined {new Date(merchant.created_at).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{merchantStudyHalls.length} Study Halls</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Study Halls */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-medium mb-4">Study Halls ({merchantStudyHalls.length})</h4>
              {merchantStudyHalls.length > 0 ? (
                <div className="space-y-3">
                  {merchantStudyHalls.map((hall) => (
                    <div key={hall.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{hall.name}</p>
                        <p className="text-sm text-muted-foreground">{hall.location}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={hall.status === 'active' ? 'default' : 'secondary'}>
                          {hall.status}
                        </Badge>
                        <p className="text-sm font-medium">₹{hall.daily_price}/day</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No study halls created yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}