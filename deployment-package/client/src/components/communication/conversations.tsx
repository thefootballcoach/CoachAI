import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Send, Paperclip, ArrowLeft, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: number;
  username: string;
  email: string;
  clubId: number;
  role: string;
}

interface Conversation {
  id: number;
  participant1Id: number;
  participant2Id: number;
  clubId: number;
  lastMessageAt: string;
  createdAt: string;
  otherParticipant: User;
}

interface DirectMessage {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  messageType: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: number;
  isRead: boolean;
  createdAt: string;
  sender: User;
}

export default function Conversations() {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user's conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ["/api/conversations"],
    refetchInterval: 3000, // Poll every 3 seconds for new conversations
  });

  // Fetch messages for selected conversation
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/conversations", selectedConversation, "messages"],
    enabled: !!selectedConversation,
    refetchInterval: 1000, // Poll every second for new messages
  });

  // Fetch club members for starting new conversations
  const { data: clubMembers = [] } = useQuery({
    queryKey: ["/api/club/members"],
  });

  // Get current user ID for message alignment
  const { data: currentUser } = useQuery({
    queryKey: ["/api/user"],
  });

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: (otherUserId: number) =>
      apiRequest("/api/conversations", {
        method: "POST",
        body: JSON.stringify({ otherUserId }),
      }),
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setSelectedConversation(conversation.id);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive",
      });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return await fetch("/api/direct-messages", {
        method: "POST",
        body: formData,
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", selectedConversation, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setNewMessage("");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  // Mark messages as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (conversationId: number) =>
      apiRequest(`/api/conversations/${conversationId}/mark-read`, {
        method: "POST",
      }),
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      markAsReadMutation.mutate(selectedConversation);
    }
  }, [selectedConversation]);

  const handleSendMessage = () => {
    if (!selectedConversation || (!newMessage.trim() && !selectedFile)) return;

    const formData = new FormData();
    formData.append("conversationId", selectedConversation.toString());
    if (newMessage.trim()) {
      formData.append("content", newMessage.trim());
    }
    if (selectedFile) {
      formData.append("attachment", selectedFile);
    }

    sendMessageMutation.mutate(formData);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (100MB limit)
      if (file.size > 100 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 100MB",
          variant: "destructive"
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  if (!selectedConversation) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Conversations</h2>
        </div>

        {/* Start new conversation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Start New Conversation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2">
              {clubMembers
                .filter((member: User) => member.id !== currentUser?.id) // Filter out current user
                .map((member: User) => (
                <Button
                  key={member.id}
                  variant="outline"
                  className="justify-start"
                  onClick={() => createConversationMutation.mutate(member.id)}
                  disabled={createConversationMutation.isPending}
                >
                  <User className="h-4 w-4 mr-2" />
                  {member.username}
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {member.role}
                  </Badge>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Existing conversations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            {conversationsLoading ? (
              <div className="text-sm text-slate-500">Loading conversations...</div>
            ) : conversations.length === 0 ? (
              <div className="text-sm text-slate-500">No conversations yet. Start one above!</div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conversation: Conversation) => (
                  <Button
                    key={conversation.id}
                    variant="ghost"
                    className="w-full justify-start h-auto p-3"
                    onClick={() => setSelectedConversation(conversation.id)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <User className="h-8 w-8 p-1 bg-slate-100 rounded-full" />
                      <div className="flex-1 text-left">
                        <div className="font-medium">{conversation.otherParticipant.username}</div>
                        <div className="text-xs text-slate-500">
                          Last active: {formatTime(conversation.lastMessageAt)}
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {conversation.otherParticipant.role}
                      </Badge>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentConversation = conversations.find((c: Conversation) => c.id === selectedConversation);

  return (
    <div className="space-y-4">
      {/* Conversation header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedConversation(null)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <User className="h-8 w-8 p-1 bg-slate-100 rounded-full" />
        <div>
          <h2 className="font-semibold">{currentConversation?.otherParticipant.username}</h2>
          <Badge variant="secondary" className="text-xs">
            {currentConversation?.otherParticipant.role}
          </Badge>
        </div>
      </div>

      {/* Messages */}
      <Card className="h-96">
        <CardContent className="p-4 h-full flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-3 mb-4">
            {messagesLoading ? (
              <div className="text-sm text-slate-500">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="text-sm text-slate-500 text-center py-8">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((message: DirectMessage) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender.id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                      message.sender.id === currentUser?.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-900'
                    }`}
                  >
                    {message.messageType === "file" && message.attachmentUrl ? (
                      <div className="space-y-2">
                        <div className="font-medium text-xs opacity-75">
                          📎 {message.attachmentName}
                        </div>
                        <div className="text-xs opacity-75">
                          {message.attachmentSize && formatFileSize(message.attachmentSize)}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-1 text-xs"
                          onClick={() => window.open(`/api/club/attachments/${message.attachmentUrl}`, '_blank')}
                        >
                          Download
                        </Button>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    )}
                    <div className="text-xs opacity-75 mt-1">
                      {formatTime(message.createdAt)}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message input */}
          <div className="space-y-2">
            {selectedFile && (
              <div className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                <Paperclip className="h-4 w-4" />
                <span className="text-sm">{selectedFile.name}</span>
                <span className="text-xs text-slate-500">({formatFileSize(selectedFile.size)})</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  Remove
                </Button>
              </div>
            )}
            
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type a message..."
                className="min-h-0 h-10 resize-none"
                rows={1}
              />
              <Button
                type="submit"
                size="sm"
                disabled={(!newMessage.trim() && !selectedFile) || sendMessageMutation.isPending}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <p className="text-xs text-slate-500">
              Press Enter to send, Shift+Enter for new line. Attach files up to 100MB.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}