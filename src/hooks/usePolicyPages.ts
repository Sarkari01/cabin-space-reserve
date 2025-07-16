import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";

type PolicyPage = Tables<"policy_pages">;
type PolicyPageInsert = TablesInsert<"policy_pages">;
type PolicyPageUpdate = TablesUpdate<"policy_pages">;

export function usePolicyPages(publishedOnly = false) {
  return useQuery({
    queryKey: ['policy-pages', { publishedOnly }],
    queryFn: async () => {
      let query = supabase
        .from('policy_pages')
        .select('*')
        .order('created_at', { ascending: false });

      if (publishedOnly) {
        query = query.eq('is_published', true);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as PolicyPage[];
    }
  });
}

export function usePolicyPage(slug: string) {
  return useQuery({
    queryKey: ['policy-page', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('policy_pages')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (error) throw error;
      return data as PolicyPage;
    },
    enabled: !!slug
  });
}

export function useCreatePolicyPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PolicyPageInsert) => {
      const { data: result, error } = await supabase
        .from('policy_pages')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policy-pages'] });
      toast.success('Policy page created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create policy page: ' + error.message);
    }
  });
}

export function useUpdatePolicyPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string, data: PolicyPageUpdate }) => {
      const { data: result, error } = await supabase
        .from('policy_pages')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policy-pages'] });
      toast.success('Policy page updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update policy page: ' + error.message);
    }
  });
}

export function useDeletePolicyPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('policy_pages')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policy-pages'] });
      toast.success('Policy page deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete policy page: ' + error.message);
    }
  });
}

export function useTogglePublishPolicyPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isPublished }: { id: string, isPublished: boolean }) => {
      const { error } = await supabase
        .from('policy_pages')
        .update({ is_published: isPublished })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, { isPublished }) => {
      queryClient.invalidateQueries({ queryKey: ['policy-pages'] });
      toast.success(`Policy page ${isPublished ? 'published' : 'unpublished'} successfully`);
    },
    onError: (error) => {
      toast.error('Failed to update policy page: ' + error.message);
    }
  });
}