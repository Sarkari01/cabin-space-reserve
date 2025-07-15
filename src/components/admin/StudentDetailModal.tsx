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
import { 
  User, Mail, Phone, Calendar, MapPin, CreditCard, 
  Building, GraduationCap, Activity, TrendingUp, 
  Clock, CheckCircle, Eye, Download, Star,
  DollarSign, FileText, Award, Target
} from "lucide-react";

interface StudentData {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  role: string;
  created_at: string;
  updated_at: string;
}

interface StudentBooking {
  id: string;
  booking_number?: number;
  start_date: string;
  end_date: string;
  total_amount: number;
  status: string;
  payment_status?: string;
  created_at: string;
  study_hall?: {
    name: string;
    location: string;
    hall_number?: number;
  };
  seat?: {
    seat_id: string;
    row_name: string;
    seat_number: number;
  };
}

interface StudentTransaction {
  id: string;
  transaction_number?: number;
  amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  booking?: {
    booking_number?: number;
    study_hall?: {
      name: string;
    };
  };
}

interface StudentRewards {
  total_points: number;
  available_points: number;
  lifetime_earned: number;
  lifetime_redeemed: number;
}

interface StudentDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: StudentData | null;
}

export function StudentDetailModal({ 
  open, 
  onOpenChange, 
  student
}: StudentDetailModalProps) {
  const [bookings, setBookings] = useState<StudentBooking[]>([]);
  const [transactions, setTransactions] = useState<StudentTransaction[]>([]);
  const [rewards, setRewards] = useState<StudentRewards | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (student && open) {
      fetchStudentDetails();
    }
  }, [student, open]);

  const fetchStudentDetails = async () => {
    if (!student) return;
    
    setLoading(true);
    try {
      // Fetch student bookings
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select(`
          *,
          study_hall:study_halls(name, location, hall_number),
          seat:seats(seat_id, row_name, seat_number)
        `)
        .eq('user_id', student.id)
        .order('created_at', { ascending: false });

      setBookings(bookingsData || []);

      // Fetch student transactions
      const { data: transactionsData } = await supabase
        .from('transactions')
        .select(`
          *,
          booking:bookings(
            booking_number,
            study_hall:study_halls(name)
          )
        `)
        .eq('user_id', student.id)
        .order('created_at', { ascending: false });

      setTransactions(transactionsData || []);

      // Fetch rewards information
      const { data: rewardsData } = await supabase
        .from('rewards')
        .select('*')
        .eq('user_id', student.id)
        .single();

      setRewards(rewardsData);

    } catch (error) {
      console.error('Error fetching student details:', error);
    }
    setLoading(false);
  };

  if (!student) return null;

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
    if (!name) return "S";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'confirmed':
      case 'completed': return 'default';
      case 'pending': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'unpaid': return 'destructive';
      case 'pending': return 'outline';
      default: return 'outline';
    }
  };

  const totalSpent = transactions.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.amount, 0);
  const activeBookings = bookings.filter(b => b.status === 'active').length;
  const completedBookings = bookings.filter(b => b.status === 'completed').length;

  const bookingColumns = [
    {
      title: 'Booking',
      key: 'booking',
      render: (_: any, booking: StudentBooking) => (
        <div>
          <div className="font-medium">#{booking.booking_number || 'N/A'}</div>
          <div className="text-sm text-muted-foreground">
            {booking.study_hall?.name || 'N/A'}
          </div>
        </div>
      )
    },
    {
      title: 'Seat & Location',
      key: 'seat',
      render: (_: any, booking: StudentBooking) => (
        <div>
          <div className="font-medium">{booking.seat?.seat_id || 'N/A'}</div>
          <div className="text-sm text-muted-foreground">
            {booking.study_hall?.location || 'N/A'}
          </div>
        </div>
      )
    },
    {
      title: 'Duration',
      key: 'duration',
      render: (_: any, booking: StudentBooking) => (
        <div className="text-sm">
          <div>{formatDate(booking.start_date)}</div>
          <div className="text-muted-foreground">to {formatDate(booking.end_date)}</div>
        </div>
      )
    },
    {
      title: 'Amount',
      key: 'amount',
      render: (_: any, booking: StudentBooking) => (
        <div className="font-medium text-green-600">
          {formatCurrency(booking.total_amount)}
        </div>
      )
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, booking: StudentBooking) => (
        <div className="space-y-1">
          <Badge variant={getStatusColor(booking.status)}>
            {booking.status}
          </Badge>
          {booking.payment_status && (
            <Badge variant={getPaymentStatusColor(booking.payment_status)} className="text-xs">
              {booking.payment_status}
            </Badge>
          )}
        </div>
      )
    },
    {
      title: 'Date',
      key: 'created_at',
      render: (_: any, booking: StudentBooking) => formatDate(booking.created_at)
    }
  ];

  const transactionColumns = [
    {
      title: 'Transaction',
      key: 'transaction',
      render: (_: any, txn: StudentTransaction) => (
        <div>
          <div className="font-medium">#{txn.transaction_number || 'N/A'}</div>
          <div className="text-sm text-muted-foreground">
            {txn.booking?.study_hall?.name || 'N/A'}
          </div>
        </div>
      )
    },
    {
      title: 'Amount',
      key: 'amount',
      render: (_: any, txn: StudentTransaction) => (
        <div className="font-medium text-green-600">
          {formatCurrency(txn.amount)}
        </div>
      )
    },
    {
      title: 'Payment Method',
      key: 'payment_method',
      render: (_: any, txn: StudentTransaction) => (
        <Badge variant="outline">
          {txn.payment_method.toUpperCase()}
        </Badge>
      )
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, txn: StudentTransaction) => (
        <Badge variant={getStatusColor(txn.status)}>
          {txn.status}
        </Badge>
      )
    },
    {
      title: 'Date',
      key: 'created_at',
      render: (_: any, txn: StudentTransaction) => formatDate(txn.created_at)
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(student.full_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-xl font-bold">{student.full_name || 'Student Profile'}</div>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Mail className="h-3 w-3" />
                {student.email}
                <Badge variant="outline">
                  <GraduationCap className="h-3 w-3 mr-1" />
                  Student
                </Badge>
              </div>
            </div>
          </DialogTitle>
          <DialogDescription>
            Complete student profile with booking history, transactions, and rewards overview
          </DialogDescription>
        </DialogHeader>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{bookings.length}</div>
              <div className="text-sm text-muted-foreground">Total Bookings</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalSpent)}</div>
              <div className="text-sm text-muted-foreground">Total Spent</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{activeBookings}</div>
              <div className="text-sm text-muted-foreground">Active Bookings</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{rewards?.available_points || 0}</div>
              <div className="text-sm text-muted-foreground">Reward Points</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="bookings">Bookings ({bookings.length})</TabsTrigger>
            <TabsTrigger value="transactions">Transactions ({transactions.length})</TabsTrigger>
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Student Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Full Name:</span>
                    <span>{student.full_name || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Email:</span>
                    <span className="font-mono text-sm">{student.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Phone:</span>
                    <span>{student.phone || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Student ID:</span>
                    <span className="font-mono text-xs">{student.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Role:</span>
                    <Badge variant="outline">
                      <GraduationCap className="h-3 w-3 mr-1" />
                      {student.role}
                    </Badge>
                  </div>
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
                    <span>{formatDate(student.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Last Updated:</span>
                    <span>{formatDate(student.updated_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">First Booking:</span>
                    <span>
                      {bookings.length > 0 
                        ? formatDate(bookings[bookings.length - 1].created_at)
                        : 'No bookings yet'
                      }
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Student Activity Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{completedBookings}</div>
                    <div className="text-sm text-muted-foreground">Completed Bookings</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {transactions.filter(t => t.status === 'completed').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Successful Payments</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.round((completedBookings / Math.max(bookings.length, 1)) * 100)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Completion Rate</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {bookings.length > 0 ? formatCurrency(totalSpent / bookings.length) : '₹0'}
                    </div>
                    <div className="text-sm text-muted-foreground">Avg. Booking Value</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Complete Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                    <div className="p-2 bg-muted/50 rounded-md">
                      {student.full_name || 'Not provided'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                    <div className="p-2 bg-muted/50 rounded-md font-mono text-sm">
                      {student.email}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                    <div className="p-2 bg-muted/50 rounded-md">
                      {student.phone || 'Not provided'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Account Type</label>
                    <div className="p-2 bg-muted/50 rounded-md">
                      <Badge variant="outline">
                        <GraduationCap className="h-3 w-3 mr-1" />
                        Student Account
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Booking History</h3>
                <p className="text-sm text-muted-foreground">
                  Complete history of all student bookings
                </p>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Bookings
              </Button>
            </div>
            
            <ResponsiveTable
              data={bookings}
              columns={bookingColumns}
              loading={loading}
              emptyMessage="No bookings found for this student"
            />
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Transaction History</h3>
                <p className="text-sm text-muted-foreground">
                  Complete payment and transaction history
                </p>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Transactions
              </Button>
            </div>
            
            <ResponsiveTable
              data={transactions}
              columns={transactionColumns}
              loading={loading}
              emptyMessage="No transactions found for this student"
            />
          </TabsContent>

          <TabsContent value="rewards" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Reward Points Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Available Points:</span>
                    <span className="text-2xl font-bold text-green-600">
                      {rewards?.available_points || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Total Earned:</span>
                    <span className="font-bold text-blue-600">
                      {rewards?.lifetime_earned || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Total Redeemed:</span>
                    <span className="font-bold text-orange-600">
                      {rewards?.lifetime_redeemed || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Total Points:</span>
                    <span className="font-bold">
                      {rewards?.total_points || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Rewards Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {rewards ? (
                    <div className="space-y-3">
                      <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="text-lg font-bold text-green-600">
                          {Math.round((rewards.lifetime_earned / Math.max(completedBookings, 1)) * 100) / 100}
                        </div>
                        <div className="text-sm text-muted-foreground">Points per Booking</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">
                          {rewards.lifetime_redeemed > 0 ? 
                            Math.round((rewards.lifetime_redeemed / rewards.lifetime_earned) * 100) : 0}%
                        </div>
                        <div className="text-sm text-muted-foreground">Redemption Rate</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No rewards data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}