import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Search, Clock, CheckCircle, XCircle, Activity, User, Settings } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface TrialActivationLog {
  id: string;
  merchant_id: string;
  activation_type: string;
  success: boolean;
  details: any;
  activated_by: string;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
    merchant_number: number;
  };
}

export const TrialActivationLogsTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: activationLogs, isLoading, refetch } = useQuery({
    queryKey: ["trial-activation-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trial_activation_logs")
        .select(`
          *,
          profiles:merchant_id (
            full_name,
            email,
            merchant_number
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as TrialActivationLog[];
    },
  });

  const filteredLogs = activationLogs?.filter(log => {
    const matchesSearch = 
      log.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === "all" || log.activation_type === typeFilter;
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "success" && log.success) ||
      (statusFilter === "failed" && !log.success);
    
    return matchesSearch && matchesType && matchesStatus;
  }) || [];

  const getStatusBadge = (success: boolean) => {
    return success ? (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        <CheckCircle className="h-3 w-3 mr-1" />
        Success
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
        <XCircle className="h-3 w-3 mr-1" />
        Failed
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'auto_on_approval':
        return (
          <Badge variant="outline" className="gap-1">
            <Settings className="h-3 w-3" />
            Auto Approval
          </Badge>
        );
      case 'manual':
        return (
          <Badge variant="outline" className="gap-1">
            <User className="h-3 w-3" />
            Manual
          </Badge>
        );
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getErrorMessage = (details: any) => {
    if (details?.error) {
      return details.error;
    }
    return "Unknown error";
  };

  // Statistics
  const totalActivations = filteredLogs.length;
  const successfulActivations = filteredLogs.filter(log => log.success).length;
  const failedActivations = filteredLogs.filter(log => !log.success).length;
  const autoActivations = filteredLogs.filter(log => log.activation_type === 'auto_on_approval').length;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Trial Activation Logs</h2>
          <p className="text-muted-foreground">Monitor automatic and manual trial activations</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <Activity className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Activations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActivations}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Successful</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{successfulActivations}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{failedActivations}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Auto-Activated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{autoActivations}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by merchant name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="auto_on_approval">Auto Approval</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activation History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Merchant</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Activated By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {log.profiles?.full_name || "Unknown"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {log.profiles?.email}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        #{log.profiles?.merchant_number}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getTypeBadge(log.activation_type)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(log.success)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {log.activated_by === 'system' ? (
                        <>
                          <Settings className="h-3 w-3" />
                          System
                        </>
                      ) : (
                        <>
                          <User className="h-3 w-3" />
                          {log.activated_by}
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(log.created_at), "MMM dd, yyyy HH:mm")}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    {log.success ? (
                      <span className="text-green-600 text-sm">
                        Trial activated successfully
                      </span>
                    ) : (
                      <span className="text-red-600 text-sm">
                        {getErrorMessage(log.details)}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredLogs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No trial activation logs found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};