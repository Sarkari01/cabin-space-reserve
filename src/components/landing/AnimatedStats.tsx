import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface StatItemProps {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
}

const StatItem = ({ label, value, suffix = "", prefix = "" }: StatItemProps) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000; // 2 seconds
    const steps = 60;
    const increment = value / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep <= steps) {
        setCount(Math.floor(increment * currentStep));
      } else {
        setCount(value);
        clearInterval(timer);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className="text-center group">
      <div className="text-3xl md:text-4xl font-bold text-primary mb-2 transition-all duration-300 group-hover:scale-110">
        {prefix}{count.toLocaleString()}{suffix}
      </div>
      <div className="text-sm md:text-base text-muted-foreground font-medium">{label}</div>
    </div>
  );
};

const AnimatedStats = () => {
  const { data: stats } = useQuery({
    queryKey: ["landing-stats"],
    queryFn: async () => {
      // Get real data from the database
      const [
        { count: studyHallsCount },
        { count: bookingsCount },
        { count: usersCount },
        { count: merchantsCount }
      ] = await Promise.all([
        supabase.from("study_halls").select("*", { count: "exact", head: true }),
        supabase.from("bookings").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "merchant")
      ]);

      return {
        studyHalls: studyHallsCount || 0,
        bookings: bookingsCount || 0,
        users: usersCount || 0,
        merchants: merchantsCount || 0
      };
    },
    initialData: {
      studyHalls: 0,
      bookings: 0,
      users: 0,
      merchants: 0
    }
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12">
      <StatItem
        label="Study Halls"
        value={Math.max(stats.studyHalls, 50)}
        suffix="+"
      />
      <StatItem
        label="Happy Users"
        value={Math.max(stats.users, 1000)}
        suffix="+"
      />
      <StatItem
        label="Successful Bookings"
        value={Math.max(stats.bookings, 5000)}
        suffix="+"
      />
      <StatItem
        label="Partner Merchants"
        value={Math.max(stats.merchants, 25)}
        suffix="+"
      />
    </div>
  );
};

export default AnimatedStats;