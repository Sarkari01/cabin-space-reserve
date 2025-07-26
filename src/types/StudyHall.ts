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
  incharges?: {
    id: string;
    full_name: string;
    email: string;
    mobile: string;
    status: string;
    permissions: any;
  }[];
}

// Legacy StudyHall interface for backward compatibility
export interface StudyHall {
  id: string;
  name: string;
  description: string;
  location: string;
  formatted_address: string;
  latitude: number;
  longitude: number;
  monthly_price: number;
  image_url?: string;
  amenities: string[];
  merchant_id: string;
  created_at: string;
  updated_at: string;
  status: string;
  total_seats: number;
  rows: number;
  seats_per_row: number;
  hall_number: number;
  average_rating: number;
  total_reviews: number;
  qr_booking_enabled: boolean;
  custom_row_names: string[];
  layout_mode: 'fixed' | 'custom';
  row_seat_config?: any;
}

export interface Seat {
  id: string;
  study_hall_id: string;
  seat_id: string;
  row_name: string;
  seat_number: number;
  is_available: boolean;
}