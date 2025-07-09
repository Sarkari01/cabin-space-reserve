export const getRoleBasedDashboard = (role: string | null): string => {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'merchant':
      return '/merchant/dashboard';
    case 'student':
      return '/student/dashboard';
    default:
      return '/';
  }
};