import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Users, MessageCircle, Paperclip, Download, File, Image, Video, FileText } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ClubChatProps {
  className?: string;
}

export default function ClubChat({ className }: ClubChatProps) {
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Only show if user is a club member
  if (!user?.clubId) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">You must be a member of a club to access communication features.</p>
      </div>
    );
  }

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/club/messages"],
    refetchInterval: 3000, // Refresh every 3 seconds for real-time feel
  });

  const { data: members } = useQuery({
    queryKey: ["/api/club/members"],
  });

  const sendMessage = useMutation({
    mutationFn: async ({ content, file }: { content: string; file?: File }) => {
      const formData = new FormData();
      if (content.trim()) {
        formData.append('content', content);
      }
      if (file) {
        formData.append('attachment', file);
      }

      const response = await fetch("/api/club/messages", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Failed to send message");
      return response.json();
    },
    onSuccess: () => {
      setMessage("");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      queryClient.invalidateQueries({ queryKey: ["/api/club/messages"] });
      // Scroll to bottom after sending
      setTimeout(() => scrollToBottom(), 100);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive"
      });
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if ((message.trim() || selectedFile) && !sendMessage.isPending) {
      sendMessage.mutate({ content: message.trim(), file: selectedFile || undefined });
    }
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

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.toLowerCase().split('.').pop();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return Image;
    if (['mp4', 'avi', 'mov', 'wmv', 'webm'].includes(ext || '')) return Video;
    if (['pdf', 'doc', 'docx', 'txt'].includes(ext || '')) return FileText;
    return File;
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
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
      case 'super_admin':
        return 'bg-red-100 text-red-800';
      case 'head_coach':
        return 'bg-blue-100 text-blue-800';
      case 'coach':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (messagesLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Club Members Panel */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50/30 border-blue-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-t-lg border-b border-blue-100">
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <Users className="h-5 w-5 text-blue-600" />
            Club Members ({members?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {members?.map((member: any) => (
              <div key={member.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-blue-100">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                    {member.name?.split(' ').map((n: string) => n[0]).join('') || member.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{member.name || member.username}</p>
                  <Badge variant="outline" className={`text-xs ${getRoleBadgeColor(member.role)}`}>
                    {member.role === 'head_coach' ? 'Head Coach' : 
                     member.role === 'coach' ? 'Coach' :
                     member.role === 'admin' ? 'Admin' : member.role}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chat Messages */}
      <Card className="bg-gradient-to-br from-slate-50 to-gray-50/30 border-slate-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-500/10 to-gray-500/10 rounded-t-lg border-b border-slate-100">
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <MessageCircle className="h-5 w-5 text-slate-600" />
            Club Communication
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Messages Area */}
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {messages && messages.length > 0 ? (
              messages.map((msg: any) => (
                <div key={msg.id} className="flex items-start gap-3">
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarFallback className="text-xs bg-slate-100 text-slate-700">
                      {msg.senderName?.split(' ').map((n: string) => n[0]).join('') || msg.senderUsername.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-slate-800">
                        {msg.senderName || msg.senderUsername}
                      </span>
                      <Badge variant="outline" className={`text-xs ${getRoleBadgeColor(msg.senderRole)}`}>
                        {msg.senderRole === 'head_coach' ? 'Head Coach' : 
                         msg.senderRole === 'coach' ? 'Coach' :
                         msg.senderRole === 'admin' ? 'Admin' : msg.senderRole}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                      {msg.content && (
                        <p className="text-slate-700 mb-2">{msg.content}</p>
                      )}
                      {msg.messageType === 'file' && msg.attachmentUrl && (
                        <div className="flex items-center gap-2 p-2 bg-slate-50 rounded border border-slate-200">
                          {React.createElement(getFileIcon(msg.attachmentName), { className: "h-4 w-4 text-slate-600" })}
                          <span className="text-sm text-slate-700 flex-1">{msg.attachmentName}</span>
                          {msg.attachmentSize && (
                            <span className="text-xs text-slate-500">{formatFileSize(msg.attachmentSize)}</span>
                          )}
                          <a
                            href={`/api/club/attachment/${msg.attachmentUrl}`}
                            download={msg.attachmentName}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                <h3 className="text-lg font-semibold text-slate-800 mb-2">No messages yet</h3>
                <p className="text-slate-600">Be the first to start the conversation!</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t border-slate-200 p-4">
            {selectedFile && (
              <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200 flex items-center gap-2">
                {React.createElement(getFileIcon(selectedFile.name), { className: "h-4 w-4 text-blue-600" })}
                <span className="text-sm text-slate-700 flex-1">{selectedFile.name}</span>
                <span className="text-xs text-slate-500">{formatFileSize(selectedFile.size)}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeSelectedFile}
                  className="h-6 w-6 p-0 text-slate-500 hover:text-slate-700"
                >
                  ×
                </Button>
              </div>
            )}
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <div className="flex-1 relative">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message to the club..."
                  className="min-h-[60px] resize-none pr-12"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,video/*,.pdf,.doc,.docx,.txt,.xlsx,.csv"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-2 right-2 h-8 w-8 p-0 text-slate-500 hover:text-slate-700"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </div>
              <Button 
                type="submit" 
                disabled={(!message.trim() && !selectedFile) || sendMessage.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <p className="text-xs text-slate-500 mt-2">
              Press Enter to send, Shift+Enter for new line. Attach files up to 100MB.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}