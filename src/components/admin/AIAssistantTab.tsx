import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, MessageSquare, FileText, BarChart3, Sparkles, Copy, Download, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useGeminiAI } from "@/hooks/useGeminiAI";
import { LoadingSpinner } from "@/components/ui/loading";
import { useToast } from "@/hooks/use-toast";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";

export const AIAssistantTab = () => {
  const { 
    loading, 
    generatePolicyContent, 
    generateCustomerSupportResponse, 
    analyzeDocuments, 
    generateNewsContent, 
    generateMarketingContent 
  } = useGeminiAI();
  const { toast } = useToast();
  const { settings } = useBusinessSettings();
  
  const [activeTask, setActiveTask] = useState<string>("");
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [inputText, setInputText] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);

  // Check AI configuration status
  const isGeminiEnabled = settings?.gemini_enabled ?? false;
  const hasGeminiKey = settings?.gemini_api_key_preview !== null;
  const isFullyConfigured = isGeminiEnabled && hasGeminiKey;
  
  const getConfigurationStatus = () => {
    if (isFullyConfigured) {
      return { icon: CheckCircle, text: "AI Ready", color: "text-green-600", bg: "bg-green-50" };
    } else if (!hasGeminiKey) {
      return { icon: XCircle, text: "API Key Required", color: "text-red-600", bg: "bg-red-50" };
    } else if (!isGeminiEnabled) {
      return { icon: AlertCircle, text: "AI Disabled", color: "text-yellow-600", bg: "bg-yellow-50" };
    }
    return { icon: XCircle, text: "Not Configured", color: "text-gray-600", bg: "bg-gray-50" };
  };

  const handlePolicyGeneration = async () => {
    if (!inputText || !selectedType) return;
    
    const result = await generatePolicyContent(inputText, selectedType);
    if (result) {
      setGeneratedContent(result.content);
      setActiveTask("policy");
    }
  };

  const handleCustomerSupport = async () => {
    if (!inputText) return;
    
    const result = await generateCustomerSupportResponse(inputText);
    if (result) {
      const newHistory = [...chatHistory, 
        { role: 'user' as const, content: inputText },
        { role: 'assistant' as const, content: result.content }
      ];
      setChatHistory(newHistory);
      setInputText("");
    }
  };

  const handleDocumentAnalysis = async () => {
    if (!inputText || !selectedType) return;
    
    const result = await analyzeDocuments(inputText, selectedType);
    if (result) {
      setGeneratedContent(result.content);
      setActiveTask("analysis");
    }
  };

  const handleContentGeneration = async () => {
    if (!inputText || !selectedType) return;
    
    let result;
    if (selectedType === "news") {
      result = await generateNewsContent(inputText, "both");
    } else {
      result = await generateMarketingContent(selectedType, inputText);
    }
    
    if (result) {
      setGeneratedContent(result.content);
      setActiveTask("content");
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Content copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy content",
        variant: "destructive"
      });
    }
  };

  const configStatus = getConfigurationStatus();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Brain className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">AI Assistant</h2>
          <Badge variant="secondary">Powered by Gemini</Badge>
        </div>
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${configStatus.bg}`}>
          <configStatus.icon className={`h-4 w-4 ${configStatus.color}`} />
          <span className={`text-sm font-medium ${configStatus.color}`}>
            {configStatus.text}
          </span>
        </div>
      </div>

      {!isFullyConfigured && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="space-y-2">
                <h3 className="font-medium text-amber-800">AI Assistant Setup Required</h3>
                <div className="text-sm text-amber-700 space-y-1">
                  {!hasGeminiKey && (
                    <p>• Please add your Gemini API key in <strong>Business Settings → API Keys</strong></p>
                  )}
                  {!isGeminiEnabled && (
                    <p>• Please enable Gemini AI in <strong>Business Settings → Payment Gateways</strong></p>
                  )}
                </div>
                <div className="pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.location.hash = '#business-settings'}
                    className="text-amber-700 border-amber-300 hover:bg-amber-100"
                  >
                    Go to Business Settings
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="policy" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="policy">Policy Generator</TabsTrigger>
          <TabsTrigger value="support">Customer Support</TabsTrigger>
          <TabsTrigger value="analysis">Document Analysis</TabsTrigger>
          <TabsTrigger value="content">Content Creator</TabsTrigger>
        </TabsList>

        <TabsContent value="policy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Policy Document Generator</span>
              </CardTitle>
              <CardDescription>
                Generate comprehensive policy documents using AI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Policy Title</label>
                  <Input
                    placeholder="e.g., Terms of Service"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Policy Type</label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select policy type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="privacy">Privacy Policy</SelectItem>
                      <SelectItem value="terms">Terms of Service</SelectItem>
                      <SelectItem value="refund">Refund Policy</SelectItem>
                      <SelectItem value="cancellation">Cancellation Policy</SelectItem>
                      <SelectItem value="cookie">Cookie Policy</SelectItem>
                      <SelectItem value="data">Data Protection Policy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button 
                onClick={handlePolicyGeneration} 
                disabled={loading || !inputText || !selectedType}
                className="w-full"
              >
                {loading ? <LoadingSpinner className="mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Generate Policy Document
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="support" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Customer Support Assistant</span>
              </CardTitle>
              <CardDescription>
                Get AI-powered responses for customer inquiries
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-4 h-64 overflow-y-auto space-y-3">
                {chatHistory.length === 0 ? (
                  <div className="text-center text-muted-foreground">
                    Start a conversation by typing a customer inquiry below
                  </div>
                ) : (
                  chatHistory.map((message, index) => (
                    <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-3 rounded-lg ${
                        message.role === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}>
                        <div className="text-sm font-medium mb-1">
                          {message.role === 'user' ? 'Customer' : 'AI Assistant'}
                        </div>
                        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex space-x-2">
                <Textarea
                  placeholder="Enter customer inquiry..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1"
                  rows={2}
                />
                <Button 
                  onClick={handleCustomerSupport} 
                  disabled={loading || !inputText}
                  size="lg"
                >
                  {loading ? <LoadingSpinner /> : <MessageSquare className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Document Analysis</span>
              </CardTitle>
              <CardDescription>
                Analyze documents and generate insights
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Analysis Type</label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select analysis type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="summary">Summary & Key Points</SelectItem>
                    <SelectItem value="compliance">Compliance Review</SelectItem>
                    <SelectItem value="risk">Risk Assessment</SelectItem>
                    <SelectItem value="sentiment">Sentiment Analysis</SelectItem>
                    <SelectItem value="recommendations">Recommendations</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Document Content</label>
                <Textarea
                  placeholder="Paste document content here..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  rows={6}
                />
              </div>
              <Button 
                onClick={handleDocumentAnalysis} 
                disabled={loading || !inputText || !selectedType}
                className="w-full"
              >
                {loading ? <LoadingSpinner className="mr-2" /> : <BarChart3 className="h-4 w-4 mr-2" />}
                Analyze Document
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5" />
                <span>Content Creator</span>
              </CardTitle>
              <CardDescription>
                Generate marketing and news content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Content Topic/Purpose</label>
                  <Input
                    placeholder="e.g., New study hall features"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Content Type</label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select content type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="news">News Article</SelectItem>
                      <SelectItem value="email">Email Campaign</SelectItem>
                      <SelectItem value="social">Social Media Post</SelectItem>
                      <SelectItem value="blog">Blog Post</SelectItem>
                      <SelectItem value="announcement">Platform Announcement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button 
                onClick={handleContentGeneration} 
                disabled={loading || !inputText || !selectedType}
                className="w-full"
              >
                {loading ? <LoadingSpinner className="mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Generate Content
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {generatedContent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Generated Content</span>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => copyToClipboard(generatedContent)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm">{generatedContent}</pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};