import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { Send, MessageSquare, Users, Shield } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

interface ChatTabProps {
  userRole?: "student" | "merchant" | "admin";
}

export function ChatTab({ userRole }: ChatTabProps = {}) {
  const { conversations, currentMessages, loading, sendMessage, fetchMessages, getConversationBetween, createConversation } = useChat();
  const { user } = useAuth();
  const [bookedUsers, setBookedUsers] = useState<any[]>([]);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversation(conversationId);
    fetchMessages(conversationId);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    setSending(true);
    const success = await sendMessage({
      conversation_id: selectedConversation,
      sender_id: user.id,
      message: newMessage.trim(),
    });

    if (success) {
      setNewMessage("");
    }
    setSending(false);
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

  // Fetch admin user
  const fetchAdminUser = async () => {
    if (userRole !== "merchant") return;
    
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
              {/* For merchants, show contacts first */}
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

                  {/* Existing Conversations */}
                  {conversations.length > 0 && (
                    <div className="p-3 bg-muted/30 border-b">
                      <span className="text-sm font-medium text-muted-foreground">
                        Recent Conversations
                      </span>
                    </div>
                  )}
                </>
              )}

              {/* Regular conversation list */}
              {conversations.length === 0 && userRole !== "merchant" ? (
                <div className="p-4 text-center text-muted-foreground">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2" />
                  <p>No conversations yet</p>
                </div>
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
                              {lastMessage.message}
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

              {/* Empty state for merchants */}
              {userRole === "merchant" && bookedUsers.length === 0 && conversations.length === 0 && !adminUser && (
                <div className="p-4 text-center text-muted-foreground">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2" />
                  <p>No contacts available</p>
                  <p className="text-xs">Users who book your study halls will appear here</p>
                </div>
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
                            <p className="text-sm">{message.message}</p>
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
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sending}
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