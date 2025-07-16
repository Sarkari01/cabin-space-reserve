import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface FAQCategory {
  id: string;
  name: string;
  description: string;
  display_order: number;
  is_active: boolean;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  display_order: number;
  is_active: boolean;
  target_audience: string;
  category_id: string;
  faq_categories?: FAQCategory;
}

export const useFAQItems = (targetAudience: string = 'all') => {
  return useQuery({
    queryKey: ['faq-items', targetAudience],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faq_items')
        .select(`
          *,
          faq_categories (*)
        `)
        .eq('is_active', true)
        .in('target_audience', ['all', targetAudience])
        .order('display_order');

      if (error) throw error;
      return data as FAQItem[];
    },
  });
};

export const useFAQCategories = () => {
  return useQuery({
    queryKey: ['faq-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faq_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      return data as FAQCategory[];
    },
  });
};

export const useFAQ = (targetAudience: string = 'all') => {
  const categoriesQuery = useFAQCategories();
  const itemsQuery = useFAQItems(targetAudience);

  return {
    categories: categoriesQuery.data || [],
    items: itemsQuery.data || [],
    loading: categoriesQuery.isLoading || itemsQuery.isLoading,
    error: categoriesQuery.error || itemsQuery.error
  };
};