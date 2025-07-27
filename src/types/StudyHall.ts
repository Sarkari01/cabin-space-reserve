// Shared interface for Study Hall data to ensure consistency across components
export interface StudyHallData {
  id: string;
  merchant_id?: string;
  name: string;
  description?: string;
  location: string;
  formatted_address?: string;
  total_seats: number;
  rows: number;
  seats_per_row: number;
  custom_row_names: string[];
  amenities: string[];
  monthly_price: number;
  image_url?: string;
  latitude?: number;
  longitude?: number;
  status: string;
  hall_number?: number;
  created_at: string;
  updated_at: string;
  // Enhanced features
  layout_mode?: 'fixed' | 'custom';
  row_seat_config?: Record<string, { seats: number }>;
  operating_hours?: OperatingHour[];
  holidays?: Holiday[];
  pricing_plans?: PricingPlan[];
  analytics_data?: AnalyticsData;
  incharges?: {
    id: string;
    full_name: string;
    email: string;
    mobile: string;
    status: string;
    permissions: any;
  }[];
}

export interface OperatingHour {
  day: string;
  enabled: boolean;
  openTime: string;
  closeTime: string;
  is24Hours: boolean;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  recurring: boolean;
}

export interface PricingPlan {
  id: string;
  name: string;
  duration: string;
  price: number;
  discount?: number;
}

export interface AnalyticsData {
  occupancyRate: number;
  revenue: number;
  bookings: number;
  rating: number;
  peakHours: Array<{ hour: string; bookings: number }>;
  monthlyTrends: Array<{ month: string; bookings: number; revenue: number }>;
  seatUtilization: Array<{ type: string; utilized: number; total: number }>;
}

export interface Seat {
  id: string;
  study_hall_id: string;
  seat_id: string;
  row_name: string;
  seat_number: number;
  is_available: boolean;
}

// Type for creating new study halls - makes database-generated fields optional
export interface CreateStudyHallData {
  name: string;
  description?: string;
  location: string;
  formatted_address?: string;
  total_seats: number;
  rows: number;
  seats_per_row: number;
  custom_row_names?: string[]; // Optional - let database use defaults
  amenities?: string[]; // Optional - let database use defaults
  monthly_price: number;
  image_url?: string;
  latitude?: number;
  longitude?: number;
  status?: string;
  layout_mode?: 'fixed' | 'custom';
  row_seat_config?: Record<string, { seats: number }>;
}