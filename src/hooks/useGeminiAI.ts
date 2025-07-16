import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface GeminiRequest {
  prompt: string;
  type?: 'text' | 'multimodal' | 'chat' | 'analysis';
  context?: string;
  model?: 'gemini-1.5-flash' | 'gemini-1.5-pro';
}

export interface GeminiResponse {
  content: string;
  model: string;
  type: string;
  tokensUsed: number;
}

export const useGeminiAI = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateContent = async (request: GeminiRequest): Promise<GeminiResponse | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('gemini-ai', {
        body: request
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return data as GeminiResponse;
    } catch (error: any) {
      console.error('Gemini AI error:', error);
      toast({
        title: "AI Generation Failed",
        description: error.message || "Failed to generate content with AI",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const generatePolicyContent = async (title: string, type: string) => {
    return generateContent({
      prompt: `Generate a comprehensive ${type} policy document for a study hall booking platform called "StudySpace". The policy should be professional, legally sound, and cover all necessary aspects. Title: "${title}". Include proper sections, clear language, and ensure it's suitable for a digital platform that handles bookings, payments, and user data.

IMPORTANT: Provide your response in plain text only. Do not use any markdown formatting, asterisks, underscores, or special characters. Use simple line breaks and clear paragraph structure.`,
      type: 'text',
      model: 'gemini-1.5-pro'
    });
  };

  const generateCustomerSupportResponse = async (userMessage: string, context: string = '') => {
    return generateContent({
      prompt: `As a helpful customer support agent for StudySpace (a study hall booking platform), provide a professional and helpful response to this user inquiry: "${userMessage}". Be friendly, informative, and provide actionable solutions. If the inquiry is about bookings, payments, study halls, or platform features, provide specific guidance.

IMPORTANT: Provide your response in plain text only. Do not use any markdown formatting, asterisks, underscores, or special characters. Use simple line breaks and clear paragraph structure.`,
      type: 'chat',
      context: context,
      model: 'gemini-1.5-flash'
    });
  };

  const analyzeDocuments = async (documentContent: string, analysisType: string) => {
    return generateContent({
      prompt: `Analyze this document for ${analysisType}. Provide insights, key points, and recommendations: ${documentContent}

IMPORTANT: Provide your response in plain text only. Do not use any markdown formatting, asterisks, underscores, or special characters. Use simple line breaks and clear paragraph structure.`,
      type: 'analysis',
      model: 'gemini-1.5-pro'
    });
  };

  const generateNewsContent = async (topic: string, audience: 'users' | 'merchants' | 'both') => {
    return generateContent({
      prompt: `Create engaging news content for StudySpace platform about: "${topic}". Target audience: ${audience}. Make it informative, engaging, and relevant to study hall booking platform users. Include a catchy title and well-structured content.

IMPORTANT: Provide your response in plain text only. Do not use any markdown formatting, asterisks, underscores, or special characters. Use simple line breaks and clear paragraph structure.`,
      type: 'text',
      model: 'gemini-1.5-flash'
    });
  };

  const generateMarketingContent = async (contentType: string, purpose: string) => {
    return generateContent({
      prompt: `Generate ${contentType} content for StudySpace, a study hall booking platform. Purpose: ${purpose}. Make it compelling, professional, and focused on the benefits of using study halls for productive learning.

IMPORTANT: Provide your response in plain text only. Do not use any markdown formatting, asterisks, underscores, or special characters. Use simple line breaks and clear paragraph structure.`,
      type: 'text',
      model: 'gemini-1.5-flash'
    });
  };

  return {
    loading,
    generateContent,
    generatePolicyContent,
    generateCustomerSupportResponse,
    analyzeDocuments,
    generateNewsContent,
    generateMarketingContent
  };
};