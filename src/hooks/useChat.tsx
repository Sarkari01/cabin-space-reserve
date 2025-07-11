import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

type ChatConversation = Tables<"chat_conversations"> & {
  participant_1_profile: Pick<Tables<"profiles">, "full_name" | "email" | "role">;
  participant_2_profile: Pick<Tables<"profiles">, "full_name" | "email" | "role">;
  chat_messages: (Tables<"chat_messages"> & {
    sender_profile: Pick<Tables<"profiles">, "full_name" | "email">;
  })[];
};

type ChatMessage = Tables<"chat_messages"> & {
  sender_profile: Pick<Tables<"profiles">, "full_name" | "email">;
};

type ChatMessageInsert = TablesInsert<"chat_messages">;

export function useChat() {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("chat_conversations")
        .select(`
          *,
          participant_1_profile:profiles!chat_conversations_participant_1_fkey(full_name, email, role),
          participant_2_profile:profiles!chat_conversations_participant_2_fkey(full_name, email, role),
          chat_messages(
            *,
            sender_profile:profiles!chat_messages_sender_id_fkey(full_name, email)
          )
        `)
        .order("last_message_at", { ascending: false });

      if (error) throw error;
      setConversations(data as any[] || []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select(`
          *,
          sender_profile:profiles!chat_messages_sender_id_fkey(full_name, email)
        `)
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setCurrentMessages(data as any[] || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    }
  };

  const createConversation = async (participant1Id: string, participant2Id: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from("chat_conversations")
        .insert({
          participant_1: participant1Id,
          participant_2: participant2Id,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchConversations();
      return data.id;
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast({
        title: "Error",
        description: "Failed to create conversation",
        variant: "destructive",
      });
      return null;
    }
  };

  const sendMessage = async (messageData: ChatMessageInsert): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("chat_messages")
        .insert(messageData);

      if (error) throw error;

      // Update last_message_at in conversation
      await supabase
        .from("chat_conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", messageData.conversation_id);

      // Refetch messages for current conversation
      if (messageData.conversation_id) {
        await fetchMessages(messageData.conversation_id);
      }
      
      await fetchConversations();
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
      return false;
    }
  };

  const markMessageAsSeen = async (messageId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("chat_messages")
        .update({ seen: true })
        .eq("id", messageId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error marking message as seen:", error);
      return false;
    }
  };

  const getConversationBetween = async (userId1: string, userId2: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from("chat_conversations")
        .select("id")
        .or(`and(participant_1.eq.${userId1},participant_2.eq.${userId2}),and(participant_1.eq.${userId2},participant_2.eq.${userId1})`)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data?.id || null;
    } catch (error) {
      console.error("Error finding conversation:", error);
      return null;
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  return {
    conversations,
    currentMessages,
    loading,
    createConversation,
    sendMessage,
    markMessageAsSeen,
    getConversationBetween,
    fetchMessages,
    refetch: fetchConversations,
  };
}