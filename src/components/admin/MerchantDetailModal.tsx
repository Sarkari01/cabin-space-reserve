import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveTable } from "@/components/ResponsiveTable";
import { supabase } from '@/integrations/supabase/client';
import { useSettlements } from '@/hooks/useSettlements';
import { 
  User, Mail, Phone, Calendar, MapPin, CreditCard, 
  Building, Store, Shield, Activity, TrendingUp, 
  Clock, CheckCircle, Users, Eye, Edit, Trash2,
  DollarSign, FileText, Settings, AlertTriangle
} from "lucide-react";

interface MerchantData {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  role: string;
  created_at: string;
  updated_at: string;
  merchant_number?: number;
}

interface MerchantProfile {
  business_email?: string;
  business_address?: string;
  phone?: string;
  gstin_pan?: string;
  trade_license_number?: string;
  account_holder_name?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  verification_status: string;
  onboarding_step: number;
  is_onboarding_complete: boolean;
}

interface StudyHall {
  id: string;
  name: string;
  location: string;
  total_seats: number;
  daily_price: number;
  weekly_price: number;
  monthly_price: number;
  status: string;
  created_at: string;
}

interface Transaction {
  id: string;
  amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  transaction_number?: number;
  booking?: {
    booking_number?: number;
    start_date: string;
    end_date: string;
  };
}

interface Incharge {
  id: string;
  full_name: string;
  email: string;
  mobile: string;
  status: string;
  account_activated: boolean;
  created_at: string;
  assigned_study_halls: any; // Json type from database
}

interface Settlement {
  id: string;
  settlement_number: number;
  status: string;
  total_booking_amount: number;
  platform_fee_amount: number;
  net_settlement_amount: number;
  created_at: string;
  payment_date?: string;
  payment_method?: string;
  payment_reference?: string;
}

interface MerchantDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  merchant: MerchantData | null;
}

export function MerchantDetailModal({ 
  open, 
  onOpenChange, 
  merchant
}: MerchantDetailModalProps) {
  const [merchantProfile, setMerchantProfile] = useState<MerchantProfile | null>(null);
  const [studyHalls, setStudyHalls] = useState<StudyHall[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [incharges, setIncharges] = useState<Incharge[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { settlements: allSettlements } = useSettlements();

  useEffect(() => {
    if (merchant && open) {
      fetchMerchantDetails();
    }
  }, [merchant, open]);

  useEffect(() => {
    if (merchant && allSettlements.length > 0) {
      // Filter settlements for this merchant when allSettlements updates
      const merchantSettlements = allSettlements.filter(s => s.merchant_id === merchant.id);
      setSettlements(merchantSettlements);
    }
  }, [merchant, allSettlements]);

  const fetchMerchantDetails = async () => {
    if (!merchant) return;
    
    setLoading(true);
    try {
      // Fetch merchant profile
      const { data: profileData } = await supabase
        .from('merchant_profiles')
        .select('*')
        .eq('merchant_id', merchant.id)
        .single();

      setMerchantProfile(profileData);

      // Fetch study halls
      const { data: hallsData } = await supabase
        .from('study_halls')
        .select('*')
        .eq('merchant_id', merchant.id)
        .order('created_at', { ascending: false });

      setStudyHalls(hallsData || []);

      // Fetch transactions for this merchant's study halls
      const { data: transactionsData } = await supabase
        .from('transactions')
        .select(`
          *,
          bookings!inner (
            booking_number,
            start_date,
            end_date,
            study_halls!inner (
              merchant_id
            )
          )
        `)
        .eq('bookings.study_halls.merchant_id', merchant.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(20);

      setTransactions(transactionsData?.map(t => ({
        ...t,
        booking: t.bookings
      })) || []);

      // Fetch incharges
      const { data: inchargesData } = await supabase
        .from('incharges')
        .select('*')
        .eq('merchant_id', merchant.id)
        .order('created_at', { ascending: false });

      setIncharges((inchargesData || []).map(incharge => ({
        ...incharge,
        assigned_study_halls: Array.isArray(incharge.assigned_study_halls) 
          ? incharge.assigned_study_halls 
          : []
      })));

    } catch (error) {
      console.error('Error fetching merchant details:', error);
    }
    setLoading(false);
  };

  if (!merchant) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getInitials = (name?: string) => {
    if (!name) return "M";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getVerificationStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'default';
      case 'pending': return 'outline';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
  const totalSettlements = settlements.reduce((sum, s) => sum + s.net_settlement_amount, 0);
  const activeHalls = studyHalls.filter(h => h.status === 'active').length;
  const activeIncharges = incharges.filter(i => i.status === 'active').length;

  const studyHallColumns = [
    {
      title: 'Study Hall',
      key: 'name',
      render: (_: any, hall: StudyHall) => (
        <div>
          <div className="font-medium">{hall.name}</div>
          <div className="text-sm text-muted-foreground">{hall.location}</div>
        </div>
      )
    },
    {
      title: 'Capacity',
      key: 'capacity',
      render: (_: any, hall: StudyHall) => (
        <div className="text-center">
          <div className="font-medium">{hall.total_seats}</div>
          <div className="text-xs text-muted-foreground">seats</div>
        </div>
      )
    },
    {
      title: 'Pricing',
      key: 'pricing',
      render: (_: any, hall: StudyHall) => (
        <div className="text-sm">
          <div>Daily: {formatCurrency(hall.daily_price)}</div>
          <div className="text-muted-foreground">Monthly: {formatCurrency(hall.monthly_price)}</div>
        </div>
      )
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, hall: StudyHall) => (
        <Badge variant={hall.status === 'active' ? 'default' : 'outline'}>
          {hall.status}
        </Badge>
      )
    },
    {
      title: 'Created',
      key: 'created_at',
      render: (_: any, hall: StudyHall) => formatDate(hall.created_at)
    }
  ];

  const transactionColumns = [
    {
      title: 'Transaction',
      key: 'transaction',
      render: (_: any, txn: Transaction) => (
        <div>
          <div className="font-medium">#{txn.transaction_number || 'N/A'}</div>
          <div className="text-sm text-muted-foreground">
            Booking #{txn.booking?.booking_number || 'N/A'}
          </div>
        </div>
      )
    },
    {
      title: 'Amount',
      key: 'amount',
      render: (_: any, txn: Transaction) => (
        <div className="font-medium text-green-600">
          {formatCurrency(txn.amount)}
        </div>
      )
    },
    {
      title: 'Payment Method',
      key: 'payment_method',
      render: (_: any, txn: Transaction) => (
        <Badge variant="outline">
          {txn.payment_method.toUpperCase()}
        </Badge>
      )
    },
    {
      title: 'Date',
      key: 'created_at',
      render: (_: any, txn: Transaction) => formatDate(txn.created_at)
    }
  ];

  const inchargeColumns = [
    {
      title: 'Incharge',
      key: 'incharge',
      render: (_: any, incharge: Incharge) => (
        <div>
          <div className="font-medium">{incharge.full_name}</div>
          <div className="text-sm text-muted-foreground">{incharge.email}</div>
        </div>
      )
    },
    {
      title: 'Contact',
      key: 'mobile',
      render: (_: any, incharge: Incharge) => (
        <div className="flex items-center text-sm">
          <Phone className="h-3 w-3 mr-1" />
          {incharge.mobile}
        </div>
      )
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, incharge: Incharge) => (
        <div className="space-y-1">
          <Badge variant={incharge.status === 'active' ? 'default' : 'outline'}>
            {incharge.status}
          </Badge>
          {incharge.account_activated && (
            <div className="text-xs text-green-600">✓ Activated</div>
          )}
        </div>
      )
    },
    {
      title: 'Assigned Halls',
      key: 'assigned_halls',
      render: (_: any, incharge: Incharge) => (
        <div className="text-center">
          <div className="font-medium">
            {Array.isArray(incharge.assigned_study_halls) ? incharge.assigned_study_halls.length : 0}
          </div>
          <div className="text-xs text-muted-foreground">halls</div>
        </div>
      )
    },
    {
      title: 'Created',
      key: 'created_at',
      render: (_: any, incharge: Incharge) => formatDate(incharge.created_at)
    }
  ];

  const settlementColumns = [
    {
      title: 'Settlement',
      key: 'settlement',
      render: (_: any, settlement: Settlement) => (
        <div>
          <div className="font-medium">#{settlement.settlement_number}</div>
          <div className="text-sm text-muted-foreground">
            {formatDate(settlement.created_at)}
          </div>
        </div>
      )
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, settlement: Settlement) => (
        <Badge variant={settlement.status === 'completed' ? 'default' : settlement.status === 'pending' ? 'outline' : 'destructive'}>
          {settlement.status}
        </Badge>
      )
    },
    {
      title: 'Amounts',
      key: 'amounts',
      render: (_: any, settlement: Settlement) => (
        <div className="text-sm">
          <div className="font-medium">{formatCurrency(settlement.net_settlement_amount)}</div>
          <div className="text-muted-foreground">
            Gross: {formatCurrency(settlement.total_booking_amount)}
          </div>
          <div className="text-muted-foreground">
            Fee: {formatCurrency(settlement.platform_fee_amount)}
          </div>
        </div>
      )
    },
    {
      title: 'Payment Details',
      key: 'payment',
      render: (_: any, settlement: Settlement) => (
        <div className="text-sm">
          {settlement.payment_method && (
            <Badge variant="outline" className="mb-1">
              {settlement.payment_method}
            </Badge>
          )}
          {settlement.payment_date && (
            <div className="text-muted-foreground">
              Paid: {formatDate(settlement.payment_date)}
            </div>
          )}
          {settlement.payment_reference && (
            <div className="text-xs text-muted-foreground font-mono">
              Ref: {settlement.payment_reference}
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(merchant.full_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-xl font-bold">{merchant.full_name || 'Merchant Profile'}</div>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Mail className="h-3 w-3" />
                {merchant.email}
                {merchant.merchant_number && (
                  <Badge variant="outline">#{merchant.merchant_number}</Badge>
                )}
              </div>
            </div>
          </DialogTitle>
          <DialogDescription>
            Complete merchant profile with business details, study halls, and financial overview
          </DialogDescription>
        </DialogHeader>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{studyHalls.length}</div>
              <div className="text-sm text-muted-foreground">Study Halls</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</div>
              <div className="text-sm text-muted-foreground">Total Revenue</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{transactions.length}</div>
              <div className="text-sm text-muted-foreground">Transactions</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{incharges.length}</div>
              <div className="text-sm text-muted-foreground">Incharges</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{settlements.length}</div>
              <div className="text-sm text-muted-foreground">Settlements</div>
              <div className="text-xs text-muted-foreground">{formatCurrency(totalSettlements)}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="business">Business Info</TabsTrigger>
            <TabsTrigger value="halls">Study Halls</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="settlements">Settlements</TabsTrigger>
            <TabsTrigger value="incharges">Incharges</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Merchant Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Full Name:</span>
                    <span>{merchant.full_name || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Email:</span>
                    <span className="font-mono text-sm">{merchant.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Phone:</span>
                    <span>{merchant.phone || merchantProfile?.phone || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Merchant ID:</span>
                    <span className="font-mono text-xs">{merchant.id}</span>
                  </div>
                  {merchantProfile && (
                    <div className="flex justify-between">
                      <span className="font-medium">Verification:</span>
                      <Badge variant={getVerificationStatusColor(merchantProfile.verification_status)}>
                        {merchantProfile.verification_status}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Account Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Account Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Joined:</span>
                    <span>{formatDate(merchant.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Last Updated:</span>
                    <span>{formatDate(merchant.updated_at)}</span>
                  </div>
                  {merchantProfile && (
                    <>
                      <div className="flex justify-between">
                        <span className="font-medium">Onboarding:</span>
                        <span>
                          {merchantProfile.is_onboarding_complete ? 'Complete' : `Step ${merchantProfile.onboarding_step}`}
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Performance Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{activeHalls}</div>
                    <div className="text-sm text-muted-foreground">Active Halls</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{activeIncharges}</div>
                    <div className="text-sm text-muted-foreground">Active Incharges</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {studyHalls.reduce((sum, h) => sum + h.total_seats, 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Capacity</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {transactions.length ? Math.round(totalRevenue / transactions.length) : 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Avg. Transaction</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="business" className="space-y-4">
            {merchantProfile ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Business Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium">Business Email:</span>
                      <span>{merchantProfile.business_email || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Business Address:</span>
                      <span className="text-right">{merchantProfile.business_address || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">GSTIN/PAN:</span>
                      <span>{merchantProfile.gstin_pan || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Trade License:</span>
                      <span>{merchantProfile.trade_license_number || 'Not provided'}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Banking Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium">Account Holder:</span>
                      <span>{merchantProfile.account_holder_name || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Bank Name:</span>
                      <span>{merchantProfile.bank_name || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Account Number:</span>
                      <span className="font-mono">
                        {merchantProfile.account_number || 'Not provided'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">IFSC Code:</span>
                      <span>{merchantProfile.ifsc_code || 'Not provided'}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Business Profile Incomplete</h3>
                  <p className="text-muted-foreground">
                    This merchant hasn't completed their business profile setup yet.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="halls">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Study Halls ({studyHalls.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveTable
                  data={studyHalls}
                  columns={studyHallColumns}
                  loading={loading}
                  emptyMessage="No study halls found"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Recent Transactions ({transactions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveTable
                  data={transactions}
                  columns={transactionColumns}
                  loading={loading}
                  emptyMessage="No transactions found"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="incharges">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Incharges ({incharges.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveTable
                  data={incharges}
                  columns={inchargeColumns}
                  loading={loading}
                  emptyMessage="No incharges found"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settlements">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Settlements ({settlements.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveTable
                  data={settlements}
                  columns={settlementColumns}
                  loading={loading}
                  emptyMessage="No settlements found"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button>
            Edit Merchant
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}