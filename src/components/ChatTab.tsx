import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Send, MessageSquare, Users, Shield, Image, Building2 } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

interface ChatTabProps {
  userRole?: "student" | "merchant" | "admin";
}

export function ChatTab({ userRole }: ChatTabProps = {}) {
  const { conversations, currentMessages, loading, sendMessage, fetchMessages, getConversationBetween, createConversation } = useChat();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Contact lists for different roles
  const [bookedUsers, setBookedUsers] = useState<any[]>([]);
  const [bookedMerchants, setBookedMerchants] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allMerchants, setAllMerchants] = useState<any[]>([]);
  const [adminUser, setAdminUser] = useState<any>(null);
  
  // UI state
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversation(conversationId);
    fetchMessages(conversationId);
  };

  const handleSendMessage = async (mediaUrl?: string) => {
    if ((!newMessage.trim() && !mediaUrl) || !selectedConversation || !user) return;

    setSending(true);
    const success = await sendMessage({
      conversation_id: selectedConversation,
      sender_id: user.id,
      message: newMessage.trim() || "",
      media_url: mediaUrl,
    });

    if (success) {
      setNewMessage("");
    }
    setSending(false);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedConversation || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(fileName);

      await handleSendMessage(publicUrl);
      
      toast({
        title: "Image sent",
        description: "Your image has been sent successfully",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Fetch booked users for merchants
  const fetchBookedUsers = async () => {
    if (userRole !== "merchant" || !user) return;
    
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          user_id,
          user:profiles!bookings_user_id_fkey(id, full_name, email),
          study_hall:study_halls!bookings_study_hall_id_fkey(merchant_id)
        `)
        .eq("study_halls.merchant_id", user.id)
        .eq("status", "confirmed");

      if (error) throw error;
      
      const uniqueUsers = Array.from(
        new Map(data?.map(booking => [booking.user_id, booking.user])).values()
      );
      setBookedUsers(uniqueUsers);
    } catch (error) {
      console.error("Error fetching booked users:", error);
    }
  };

  // Fetch admin user (for merchants and users)
  const fetchAdminUser = async () => {
    if (userRole === "admin") return;
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("role", "admin")
        .limit(1)
        .single();

      if (error) throw error;
      setAdminUser(data);
    } catch (error) {
      console.error("Error fetching admin user:", error);
    }
  };

  // Fetch all users (for admin)
  const fetchAllUsers = async () => {
    if (userRole !== "admin" || !user) return;
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .eq("role", "student")
        .neq("id", user.id);

      if (error) throw error;
      setAllUsers(data || []);
    } catch (error) {
      console.error("Error fetching all users:", error);
    }
  };

  // Fetch all merchants (for admin)
  const fetchAllMerchants = async () => {
    if (userRole !== "admin" || !user) return;
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .eq("role", "merchant")
        .neq("id", user.id);

      if (error) throw error;
      setAllMerchants(data || []);
    } catch (error) {
      console.error("Error fetching all merchants:", error);
    }
  };

  // Fetch booked merchants (for users)
  const fetchBookedMerchants = async () => {
    if (userRole !== "student" || !user) return;
    
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          study_hall:study_halls!bookings_study_hall_id_fkey(
            merchant_id,
            merchant:profiles!study_halls_merchant_id_fkey(id, full_name, email)
          )
        `)
        .eq("user_id", user.id)
        .eq("status", "confirmed");

      if (error) throw error;
      
      const uniqueMerchants = Array.from(
        new Map(data?.map(booking => [
          booking.study_hall.merchant_id, 
          booking.study_hall.merchant
        ])).values()
      );
      setBookedMerchants(uniqueMerchants.filter(Boolean));
    } catch (error) {
      console.error("Error fetching booked merchants:", error);
    }
  };

  // Start conversation with a user
  const handleStartConversation = async (otherUserId: string) => {
    if (!user) return;
    
    // Check if conversation already exists
    let conversationId = await getConversationBetween(user.id, otherUserId);
    
    if (!conversationId) {
      // Create new conversation
      conversationId = await createConversation(user.id, otherUserId);
    }
    
    if (conversationId) {
      setSelectedConversation(conversationId);
      fetchMessages(conversationId);
    }
  };

  const getOtherParticipant = (conversation: any) => {
    if (!user) return null;
    if (conversation.participant_1 === user.id) {
      return conversation.participant_2_profile;
    }
    return conversation.participant_1_profile;
  };

  useEffect(() => {
    if (userRole === "merchant") {
      fetchBookedUsers();
      fetchAdminUser();
    } else if (userRole === "admin") {
      fetchAllUsers();
      fetchAllMerchants();
    } else if (userRole === "student") {
      fetchBookedMerchants();
      fetchAdminUser();
    }
  }, [userRole, user]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-3 bg-muted rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="md:col-span-2 animate-pulse">
          <CardContent className="p-4">
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-3 bg-muted rounded w-5/6"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Chat</h2>
        <p className="text-muted-foreground">Connect with others through direct messaging</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
        {/* Conversations List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {userRole === "merchant" ? "Contacts" : "Conversations"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {/* Admin Contacts - All Users and Merchants */}
              {userRole === "admin" && (
                <>
                  {/* All Users */}
                  {allUsers.length > 0 && (
                    <>
                      <div className="p-3 bg-muted/30 border-b">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-muted-foreground">
                            All Users ({allUsers.length})
                          </span>
                        </div>
                      </div>
                      {allUsers.map((user) => (
                        <div
                          key={user.id}
                          className="p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleStartConversation(user.id)}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>
                                {user.full_name?.charAt(0) || user.email?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {user.full_name || "User"}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {/* All Merchants */}
                  {allMerchants.length > 0 && (
                    <>
                      <div className="p-3 bg-muted/30 border-b">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-muted-foreground">
                            All Merchants ({allMerchants.length})
                          </span>
                        </div>
                      </div>
                      {allMerchants.map((merchant) => (
                        <div
                          key={merchant.id}
                          className="p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleStartConversation(merchant.id)}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback className="bg-secondary text-secondary-foreground">
                                <Building2 className="w-4 h-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {merchant.full_name || "Merchant"}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">
                                {merchant.email}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}

              {/* Merchant Contacts */}
              {userRole === "merchant" && (
                <>
                  {/* Admin Contact */}
                  {adminUser && (
                    <div
                      className="p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleStartConversation(adminUser.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            <Shield className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">Admin Support</p>
                          <p className="text-sm text-muted-foreground">
                            {adminUser.full_name || adminUser.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Booked Users */}
                  {bookedUsers.length > 0 && (
                    <>
                      <div className="p-3 bg-muted/30 border-b">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-muted-foreground">
                            Booked Users ({bookedUsers.length})
                          </span>
                        </div>
                      </div>
                      {bookedUsers.map((user) => (
                        <div
                          key={user.id}
                          className="p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleStartConversation(user.id)}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>
                                {user.full_name?.charAt(0) || user.email?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {user.full_name || "Student"}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}

              {/* User/Student Contacts */}
              {userRole === "student" && (
                <>
                  {/* Admin Contact */}
                  {adminUser && (
                    <div
                      className="p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleStartConversation(adminUser.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            <Shield className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">Admin Support</p>
                          <p className="text-sm text-muted-foreground">
                            {adminUser.full_name || adminUser.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Booked Merchants */}
                  {bookedMerchants.length > 0 && (
                    <>
                      <div className="p-3 bg-muted/30 border-b">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-muted-foreground">
                            Your Merchants ({bookedMerchants.length})
                          </span>
                        </div>
                      </div>
                      {bookedMerchants.map((merchant) => (
                        <div
                          key={merchant.id}
                          className="p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleStartConversation(merchant.id)}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback className="bg-secondary text-secondary-foreground">
                                <Building2 className="w-4 h-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {merchant.full_name || "Merchant"}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">
                                {merchant.email}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}

              {/* Recent Conversations */}
              {conversations.length > 0 && (
                <div className="p-3 bg-muted/30 border-b">
                  <span className="text-sm font-medium text-muted-foreground">
                    Recent Conversations
                  </span>
                </div>
              )}

              {/* Regular conversation list */}
              {conversations.length === 0 ? (
                userRole === "admin" && allUsers.length === 0 && allMerchants.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2" />
                    <p>No users or merchants found</p>
                  </div>
                ) : userRole === "merchant" && bookedUsers.length === 0 && !adminUser ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2" />
                    <p>No contacts available</p>
                    <p className="text-xs">Users who book your study halls will appear here</p>
                  </div>
                ) : userRole === "student" && bookedMerchants.length === 0 && !adminUser ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2" />
                    <p>No contacts available</p>
                    <p className="text-xs">Book a study hall to chat with merchants</p>
                  </div>
                ) : null
              ) : (
                conversations.map((conversation) => {
                  const otherParticipant = getOtherParticipant(conversation);
                  const lastMessage = conversation.chat_messages?.[conversation.chat_messages.length - 1];
                  
                  return (
                    <div
                      key={conversation.id}
                      className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedConversation === conversation.id ? "bg-muted" : ""
                      }`}
                      onClick={() => handleSelectConversation(conversation.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {otherParticipant?.full_name?.charAt(0) || otherParticipant?.email?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {otherParticipant?.full_name || otherParticipant?.email || "Unknown User"}
                          </p>
                          {lastMessage && (
                            <p className="text-sm text-muted-foreground truncate">
                              {lastMessage.media_url ? "📷 Image" : lastMessage.message}
                            </p>
                          )}
                        </div>
                        {conversation.last_message_at && (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(conversation.last_message_at), "MMM dd")}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Window */}
        <Card className="md:col-span-2">
          {selectedConversation ? (
            <>
              <CardHeader className="border-b">
                <CardTitle className="text-lg">
                  {(() => {
                    const conversation = conversations.find(c => c.id === selectedConversation);
                    const otherParticipant = conversation ? getOtherParticipant(conversation) : null;
                    return otherParticipant?.full_name || otherParticipant?.email || "Unknown User";
                  })()}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex flex-col h-[500px]">
                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {currentMessages.map((message) => {
                      const isOwn = message.sender_id === user?.id;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] p-3 rounded-lg ${
                              isOwn
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            {message.media_url ? (
                              <div className="mb-2">
                                <img 
                                  src={message.media_url} 
                                  alt="Shared image" 
                                  className="max-w-full h-auto rounded-md"
                                  style={{ maxHeight: '200px' }}
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              </div>
                            ) : null}
                            {message.message && (
                              <p className="text-sm">{message.message}</p>
                            )}
                            <p className={`text-xs mt-1 ${
                              isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                            }`}>
                              {format(new Date(message.created_at), "HH:mm")}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      ref={fileInputRef}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Image className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleSendMessage()}
                      disabled={(!newMessage.trim() || sending) && !uploading}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-4" />
                <p>Select a conversation to start chatting</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}