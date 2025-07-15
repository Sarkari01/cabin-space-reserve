import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResponsiveTable } from "@/components/ResponsiveTable";
import { Download, Eye, CheckCircle, XCircle, Clock, IndianRupee, Building2, CreditCard } from "lucide-react";
import { useWithdrawals } from "@/hooks/useWithdrawals";
import { safeFormatDate, safeFormatTime, safeFormatDateTime } from "@/lib/dateUtils";

export function WithdrawalManagementTab() {
  const { withdrawals, loading, updateWithdrawalStatus } = useWithdrawals();
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
  const [newStatus, setNewStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: "secondary" as const, icon: Clock, color: "text-yellow-600" },
      approved: { variant: "default" as const, icon: CheckCircle, color: "text-blue-600" },
      processing: { variant: "default" as const, icon: Clock, color: "text-blue-600" },
      completed: { variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
      rejected: { variant: "destructive" as const, icon: XCircle, color: "text-red-600" }
    };
    
    const config = variants[status as keyof typeof variants] || variants.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleStatusUpdate = async () => {
    if (!selectedWithdrawal || !newStatus) return;

    setIsUpdating(true);
    await updateWithdrawalStatus(
      selectedWithdrawal.id,
      newStatus,
      adminNotes,
      paymentReference,
      paymentMethod
    );
    setIsUpdating(false);
    setSelectedWithdrawal(null);
    setNewStatus("");
    setAdminNotes("");
    setPaymentReference("");
    setPaymentMethod("");
  };

  const filteredWithdrawals = withdrawals.filter(withdrawal => 
    statusFilter === "all" || withdrawal.status === statusFilter
  );

  const totalPending = withdrawals
    .filter(w => w.status === "pending")
    .reduce((sum, w) => sum + Number(w.requested_amount), 0);

  const totalProcessing = withdrawals
    .filter(w => w.status === "processing")
    .reduce((sum, w) => sum + Number(w.requested_amount), 0);

  const columns = [
    {
      key: "merchant",
      title: "Merchant",
      render: (item: any) => (
        <div className="space-y-1">
          <div className="font-medium">{item.merchant?.full_name || "Unknown"}</div>
          <div className="text-sm text-muted-foreground">{item.merchant?.email}</div>
          <div className="text-xs text-muted-foreground">
            ID: {item.merchant?.merchant_number || "N/A"}
          </div>
        </div>
      )
    },
    {
      key: "amount",
      title: "Amount",
      render: (item: any) => (
        <div className="font-semibold text-lg">
          ₹{Number(item.requested_amount).toLocaleString()}
        </div>
      )
    },
    {
      key: "method",
      title: "Method",
      render: (item: any) => (
        <div className="flex items-center gap-2">
          {item.withdrawal_method === "bank_transfer" ? (
            <Building2 className="h-4 w-4" />
          ) : (
            <CreditCard className="h-4 w-4" />
          )}
          <span className="capitalize">{item.withdrawal_method.replace("_", " ")}</span>
        </div>
      )
    },
    {
      key: "status",
      title: "Status",
      render: (item: any) => getStatusBadge(item.status)
    },
    {
      key: "date",
      title: "Request Date",
      render: (item: any) => (
        <div className="space-y-1">
          <div>{safeFormatDate(item.created_at, "MMM dd, yyyy")}</div>
          <div className="text-sm text-muted-foreground">
            {safeFormatTime(item.created_at, "hh:mm a")}
          </div>
        </div>
      )
    },
    {
      key: "actions",
      title: "Actions",
      render: (item: any) => (
        <Dialog>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setSelectedWithdrawal(item);
                setNewStatus(item.status);
                setAdminNotes(item.admin_notes || "");
                setPaymentReference(item.payment_reference || "");
                setPaymentMethod(item.payment_method || "");
              }}
            >
              <Eye className="h-4 w-4 mr-1" />
              Manage
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Manage Withdrawal Request</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Merchant Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <div className="font-medium">{item.merchant?.full_name}</div>
                      <div className="text-sm text-muted-foreground">{item.merchant?.email}</div>
                      <div className="text-xs text-muted-foreground">
                        Merchant #{item.merchant?.merchant_number}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Request Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-2xl font-bold">
                      ₹{Number(item.requested_amount).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Method: {item.withdrawal_method.replace("_", " ")}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Requested: {safeFormatDateTime(item.created_at, "MMM dd, yyyy hh:mm a")}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="status">Update Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(newStatus === "completed" || newStatus === "processing") && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="paymentReference">Payment Reference</Label>
                      <Input
                        id="paymentReference"
                        placeholder="UTR/Transaction ID"
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="paymentMethod">Payment Method</Label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="upi">UPI Transfer</SelectItem>
                          <SelectItem value="neft">NEFT</SelectItem>
                          <SelectItem value="rtgs">RTGS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="adminNotes">Admin Notes</Label>
                  <Textarea
                    id="adminNotes"
                    placeholder="Add notes about this withdrawal request..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleStatusUpdate}
                    disabled={isUpdating}
                    className="flex-1"
                  >
                    {isUpdating ? "Updating..." : "Update Status"}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{totalPending.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">
              {withdrawals.filter(w => w.status === "pending").length} requests
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{totalProcessing.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">
              {withdrawals.filter(w => w.status === "processing").length} requests
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{withdrawals.length}</div>
            <div className="text-sm text-muted-foreground">All time</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Withdrawal Requests
              </CardTitle>
              <CardDescription>
                Manage merchant withdrawal requests and payments
              </CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveTable
            data={filteredWithdrawals}
            columns={columns}
            loading={loading}
            emptyMessage="No withdrawal requests found"
          />
        </CardContent>
      </Card>
    </div>
  );
}