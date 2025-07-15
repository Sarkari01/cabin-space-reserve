export const getRoleBasedDashboard = (role: string | null): string => {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'merchant':
      return '/merchant/dashboard';
    case 'student':
      return '/student/dashboard';
    case 'incharge':
      return '/incharge/dashboard';
    case 'telemarketing_executive':
      return '/telemarketing/dashboard';
    case 'pending_payments_caller':
      return '/payments-caller/dashboard';
    case 'customer_care_executive':
      return '/customer-care/dashboard';
    case 'settlement_manager':
      return '/settlement-manager/dashboard';
    case 'general_administrator':
      return '/general-admin/dashboard';
    default:
      return '/';
  }
};