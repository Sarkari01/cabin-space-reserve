-- Create enum for news visibility first
CREATE TYPE public.news_visibility AS ENUM ('user', 'merchant', 'both');

-- News Management Tables
CREATE TABLE public.news_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  video_url TEXT,
  visible_to news_visibility NOT NULL DEFAULT 'both',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Community Management Tables
CREATE TABLE public.community_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.community_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, emoji)
);

CREATE TABLE public.community_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Chat Management Tables
CREATE TABLE public.chat_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_1 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  participant_2 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(participant_1, participant_2)
);

CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  media_url TEXT,
  emoji TEXT,
  seen BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.news_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- News Posts Policies
CREATE POLICY "Admins can manage all news posts" 
ON public.news_posts FOR ALL 
USING (is_admin());

CREATE POLICY "Users can view relevant news posts" 
ON public.news_posts FOR SELECT 
USING (
  status = 'active' AND (
    visible_to = 'both' OR 
    (visible_to = 'user' AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'student'
    )) OR
    (visible_to = 'merchant' AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'merchant'
    ))
  )
);

-- Community Posts Policies
CREATE POLICY "Users can view all community posts" 
ON public.community_posts FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own posts" 
ON public.community_posts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" 
ON public.community_posts FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts or admins can delete any" 
ON public.community_posts FOR DELETE 
USING (auth.uid() = user_id OR is_admin());

-- Community Reactions Policies
CREATE POLICY "Users can view all reactions" 
ON public.community_reactions FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own reactions" 
ON public.community_reactions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions" 
ON public.community_reactions FOR DELETE 
USING (auth.uid() = user_id);

-- Community Comments Policies
CREATE POLICY "Users can view all comments" 
ON public.community_comments FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own comments" 
ON public.community_comments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" 
ON public.community_comments FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments or admins can delete any" 
ON public.community_comments FOR DELETE 
USING (auth.uid() = user_id OR is_admin());

-- Chat Conversations Policies
CREATE POLICY "Users can view their conversations" 
ON public.chat_conversations FOR SELECT 
USING (participant_1 = auth.uid() OR participant_2 = auth.uid());

CREATE POLICY "Users can create conversations" 
ON public.chat_conversations FOR INSERT 
WITH CHECK (participant_1 = auth.uid() OR participant_2 = auth.uid());

-- Chat Messages Policies
CREATE POLICY "Users can view messages in their conversations" 
ON public.chat_messages FOR SELECT 
USING (
  conversation_id IN (
    SELECT id FROM public.chat_conversations 
    WHERE participant_1 = auth.uid() OR participant_2 = auth.uid()
  )
);

CREATE POLICY "Users can send messages in their conversations" 
ON public.chat_messages FOR INSERT 
WITH CHECK (
  sender_id = auth.uid() AND
  conversation_id IN (
    SELECT id FROM public.chat_conversations 
    WHERE participant_1 = auth.uid() OR participant_2 = auth.uid()
  )
);

CREATE POLICY "Users can update their own messages" 
ON public.chat_messages FOR UPDATE 
USING (sender_id = auth.uid());

-- Create update triggers
CREATE TRIGGER update_news_posts_updated_at
BEFORE UPDATE ON public.news_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_community_posts_updated_at
BEFORE UPDATE ON public.community_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_community_comments_updated_at
BEFORE UPDATE ON public.community_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('news-media', 'news-media', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('community-media', 'community-media', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-attachments', 'chat-attachments', false);

-- Create storage policies
CREATE POLICY "Public access to news media" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'news-media');

CREATE POLICY "Admins can upload news media" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'news-media' AND is_admin());

CREATE POLICY "Public access to community media" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'community-media');

CREATE POLICY "Users can upload community media" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'community-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can access their chat attachments" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload chat attachments" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);