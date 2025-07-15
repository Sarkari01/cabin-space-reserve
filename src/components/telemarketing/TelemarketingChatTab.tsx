import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useChat } from "@/hooks/useChat";
import { Search, Eye, MessageCircle, Clock } from "lucide-react";
import { format } from "date-fns";

export function TelemarketingChatTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const { conversations, loading } = useChat();

  const filteredConversations = conversations?.filter(conversation => {
    const searchLower = searchTerm.toLowerCase();
    // Simple search by conversation ID for now
    return conversation.id.toLowerCase().includes(searchLower);
  }) || [];

  const totalConversations = filteredConversations.length;
  const activeConversations = filteredConversations.filter(c => 
    c.last_message_at && new Date(c.last_message_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  ).length;
  const totalMessages = 0; // Will be calculated separately

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading chat data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Chat Monitoring</h2>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConversations}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeConversations}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMessages}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Messages/Chat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalConversations > 0 ? Math.round(totalMessages / totalConversations) : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Conversations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Chat Conversations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Participants</TableHead>
                <TableHead>Messages</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredConversations.map((conversation) => {
                const isRecent = conversation.last_message_at && 
                  new Date(conversation.last_message_at) > new Date(Date.now() - 24 * 60 * 60 * 1000);
                
                return (
                  <TableRow key={conversation.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {conversation.participant1?.full_name || "User 1"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ↔ {conversation.participant2?.full_name || "User 2"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        {conversation.messages?.length || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      {conversation.last_message_at ? (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(conversation.last_message_at), "MMM dd, HH:mm")}
                        </div>
                      ) : (
                        "No messages"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={isRecent ? "default" : "secondary"}>
                        {isRecent ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="gap-1"
                            onClick={() => setSelectedConversation(conversation)}
                          >
                            <Eye className="h-3 w-3" />
                            View Chat
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Chat Conversation</DialogTitle>
                          </DialogHeader>
                          {selectedConversation && (
                            <div className="space-y-4">
                              {/* Participants Info */}
                              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                                <div>
                                  <h4 className="font-medium">Participant 1</h4>
                                  <p>{selectedConversation.participant1?.full_name || "Unknown"}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {selectedConversation.participant1?.email}
                                  </p>
                                </div>
                                <div>
                                  <h4 className="font-medium">Participant 2</h4>
                                  <p>{selectedConversation.participant2?.full_name || "Unknown"}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {selectedConversation.participant2?.email}
                                  </p>
                                </div>
                              </div>

                              {/* Messages */}
                              <div>
                                <h3 className="font-semibold mb-4">Messages</h3>
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                  {selectedConversation.messages?.map((message: any) => (
                                    <div 
                                      key={message.id} 
                                      className={`p-3 rounded-lg ${
                                        message.sender_id === selectedConversation.participant_1 
                                          ? "bg-blue-50 ml-4" 
                                          : "bg-gray-50 mr-4"
                                      }`}
                                    >
                                      <div className="flex justify-between items-start mb-2">
                                        <span className="font-medium">
                                          {message.sender_id === selectedConversation.participant_1 
                                            ? selectedConversation.participant1?.full_name 
                                            : selectedConversation.participant2?.full_name}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          {format(new Date(message.created_at), "MMM dd, HH:mm")}
                                        </span>
                                      </div>
                                      <p className="whitespace-pre-wrap">{message.message}</p>
                                      {message.media_url && (
                                        <div className="mt-2">
                                          <Badge variant="outline">Media Attachment</Badge>
                                        </div>
                                      )}
                                      {message.emoji && (
                                        <div className="mt-2">
                                          <span className="text-lg">{message.emoji}</span>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Conversation Stats */}
                              <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                                <div className="text-center">
                                  <div className="text-2xl font-bold">
                                    {selectedConversation.messages?.length || 0}
                                  </div>
                                  <div className="text-sm text-muted-foreground">Total Messages</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-2xl font-bold">
                                    {format(new Date(selectedConversation.created_at), "MMM dd")}
                                  </div>
                                  <div className="text-sm text-muted-foreground">Started</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-2xl font-bold">
                                    {selectedConversation.last_message_at 
                                      ? format(new Date(selectedConversation.last_message_at), "MMM dd")
                                      : "N/A"}
                                  </div>
                                  <div className="text-sm text-muted-foreground">Last Message</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {filteredConversations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No chat conversations found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}