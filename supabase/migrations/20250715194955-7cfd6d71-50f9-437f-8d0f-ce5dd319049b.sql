-- Add telemarketing executive permissions for settlements
CREATE POLICY "Telemarketing executives can view settlements" 
ON settlements 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'telemarketing_executive'
  )
);

-- Add telemarketing executive permissions for merchant profiles and documents
CREATE POLICY "Telemarketing executives can view merchant profiles" 
ON merchant_profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'telemarketing_executive'
  )
);

CREATE POLICY "Telemarketing executives can update merchant profiles for verification" 
ON merchant_profiles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'telemarketing_executive'
  )
);

CREATE POLICY "Telemarketing executives can view merchant documents" 
ON merchant_documents 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'telemarketing_executive'
  )
);

CREATE POLICY "Telemarketing executives can update merchant documents for verification" 
ON merchant_documents 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'telemarketing_executive'
  )
);

-- Add telemarketing executive permissions for community management
CREATE POLICY "Telemarketing executives can moderate community posts" 
ON community_posts 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'telemarketing_executive'
  )
);

CREATE POLICY "Telemarketing executives can delete community posts" 
ON community_posts 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'telemarketing_executive'
  )
);

CREATE POLICY "Telemarketing executives can moderate community comments" 
ON community_comments 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'telemarketing_executive'
  )
);

CREATE POLICY "Telemarketing executives can delete community comments" 
ON community_comments 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'telemarketing_executive'
  )
);

-- Add telemarketing executive permissions for chat monitoring
CREATE POLICY "Telemarketing executives can view chat conversations" 
ON chat_conversations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'telemarketing_executive'
  )
);

CREATE POLICY "Telemarketing executives can view chat messages" 
ON chat_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'telemarketing_executive'
  )
);

-- Add telemarketing executive permissions for news management
CREATE POLICY "Telemarketing executives can create news posts" 
ON news_posts 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'telemarketing_executive'
  )
);

CREATE POLICY "Telemarketing executives can update news posts" 
ON news_posts 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'telemarketing_executive'
  )
);