import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Common validation schemas
export const bookingSchema = z.object({
  study_hall_id: z.string().min(1, "Study hall is required"),
  seat_id: z.string().min(1, "Seat selection is required"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  booking_period: z.enum(["daily", "weekly", "monthly"]),
}).refine((data) => {
  const start = new Date(data.start_date);
  const end = new Date(data.end_date);
  return end >= start;
}, {
  message: "End date must be after or equal to start date",
  path: ["end_date"]
}).refine((data) => {
  const start = new Date(data.start_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return start >= today;
}, {
  message: "Start date cannot be in the past",
  path: ["start_date"]
});

export const studyHallSchema = z.object({
  name: z.string().min(1, "Study hall name is required").max(100, "Name too long"),
  location: z.string().min(1, "Location is required").max(200, "Location too long"),
  description: z.string().max(500, "Description too long").optional(),
  daily_price: z.number().min(1, "Daily price must be greater than 0"),
  weekly_price: z.number().min(1, "Weekly price must be greater than 0"),
  monthly_price: z.number().min(1, "Monthly price must be greater than 0"),
  rows: z.number().min(1, "Must have at least 1 row").max(10, "Maximum 10 rows"),
  seats_per_row: z.number().min(1, "Must have at least 1 seat per row").max(20, "Maximum 20 seats per row"),
}).refine((data) => {
  return data.weekly_price < data.daily_price * 7;
}, {
  message: "Weekly price should be less than 7 times daily price",
  path: ["weekly_price"]
}).refine((data) => {
  return data.monthly_price < data.daily_price * 30;
}, {
  message: "Monthly price should be less than 30 times daily price",
  path: ["monthly_price"]
});

export const profileSchema = z.object({
  full_name: z.string().min(1, "Full name is required").max(100, "Name too long"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().refine((phone) => {
    if (!phone) return true;
    return /^\+?[\d\s\-\(\)]{10,15}$/.test(phone);
  }, "Invalid phone number format"),
});

export const newsPostSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  content: z.string().min(1, "Content is required").max(5000, "Content too long"),
  status: z.enum(["active", "inactive"]),
  visible_to: z.enum(["user", "merchant", "both"]),
  image_url: z.string().url("Invalid image URL").optional().or(z.literal("")),
  video_url: z.string().url("Invalid video URL").optional().or(z.literal("")),
});

export const bannerSchema = z.object({
  title: z.string().max(100, "Title too long").optional(),
  description: z.string().max(500, "Description too long").optional(),
  image_url: z.string().url("Invalid image URL"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().optional(),
  status: z.enum(["active", "inactive"]),
  target_audience: z.enum(["user", "merchant", "both"]),
  priority: z.number().min(0, "Priority must be 0 or greater").max(100, "Priority cannot exceed 100"),
}).refine((data) => {
  if (!data.end_date) return true;
  const start = new Date(data.start_date);
  const end = new Date(data.end_date);
  return end >= start;
}, {
  message: "End date must be after or equal to start date",
  path: ["end_date"]
});

// Form field validation helpers
export const validateRequired = (value: string) => {
  return value.trim().length > 0 || "This field is required";
};

export const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) || "Invalid email address";
};

export const validatePhone = (phone: string) => {
  if (!phone) return true;
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,15}$/;
  return phoneRegex.test(phone) || "Invalid phone number format";
};

export const validatePrice = (price: number) => {
  return price > 0 || "Price must be greater than 0";
};

export const validateDateRange = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return end >= start || "End date must be after or equal to start date";
};

export const validateFutureDate = (date: string) => {
  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selectedDate >= today || "Date cannot be in the past";
};

// Custom hook for form validation
export function useValidatedForm<T extends Record<string, any>>(
  schema: z.ZodSchema<T>, 
  defaultValues?: Partial<T>
) {
  return useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as any,
    mode: "onChange", // Real-time validation
  });
}