import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, Send, Edit, Trash2, Reply, AtSign, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: number;
  feedbackId: number;
  authorId: number;
  parentCommentId: number | null;
  content: string;
  isHeadCoachComment: boolean;
  createdAt: string;
  updatedAt: string;
  authorName: string;
  authorUsername: string;
  authorRole: string;
  mentionedUsers?: number[];
}

interface FeedbackCommentsProps {
  feedbackId: number;
  isOwner: boolean;
}

export function FeedbackComments({ feedbackId, isOwner }: FeedbackCommentsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [availableUsers, setAvailableUsers] = useState<Array<{id: number, name: string, username: string}>>([]);

  const { data: comments, isLoading } = useQuery<Comment[]>({
    queryKey: ["/api/feedback", feedbackId, "comments"],
    queryFn: async () => {
      const response = await fetch(`/api/feedback/${feedbackId}/comments`);
      if (!response.ok) {
        throw new Error("Failed to fetch comments");
      }
      return response.json();
    },
    enabled: !!feedbackId,
    refetchInterval: 3000, // Poll every 3 seconds for real-time updates
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true
  });

  // Fetch available users for tagging
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users/available-for-tagging');
        if (response.ok) {
          const users = await response.json();
          setAvailableUsers(users);
        }
      } catch (error) {
        console.error('Failed to fetch available users:', error);
      }
    };
    fetchUsers();
  }, []);

  const createCommentMutation = useMutation({
    mutationFn: async (data: { content: string; parentCommentId?: number; mentionedUsers?: number[] }) => {
      const response = await apiRequest("POST", `/api/feedback/${feedbackId}/comments`, data);
      return response.json();
    },
    onSuccess: (newComment) => {
      // Immediately update the cache with the new comment
      queryClient.setQueryData(["/api/feedback", feedbackId, "comments"], (oldComments: Comment[] = []) => {
        return [...oldComments, newComment];
      });
      
      // Also invalidate to ensure we get fresh data
      queryClient.invalidateQueries({ queryKey: ["/api/feedback", feedbackId, "comments"] });
      
      setNewComment("");
      setReplyingTo(null);
      toast({
        title: "Comment added",
        description: "Your comment has been posted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: async (data: { commentId: number; content: string }) => {
      const response = await apiRequest("PUT", `/api/feedback/comments/${data.commentId}`, {
        content: data.content
      });
      return response.json();
    },
    onSuccess: (updatedComment) => {
      // Immediately update the cache with the updated comment
      queryClient.setQueryData(["/api/feedback", feedbackId, "comments"], (oldComments: Comment[] = []) => {
        return oldComments.map(comment => 
          comment.id === updatedComment.id ? updatedComment : comment
        );
      });
      
      // Also invalidate to ensure we get fresh data
      queryClient.invalidateQueries({ queryKey: ["/api/feedback", feedbackId, "comments"] });
      
      setEditingComment(null);
      setEditContent("");
      toast({
        title: "Comment updated",
        description: "Your comment has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      await apiRequest("DELETE", `/api/feedback/comments/${commentId}`);
      return commentId;
    },
    onSuccess: (deletedCommentId) => {
      // Immediately remove the comment from cache
      queryClient.setQueryData(["/api/feedback", feedbackId, "comments"], (oldComments: Comment[] = []) => {
        return oldComments.filter(comment => comment.id !== deletedCommentId);
      });
      
      // Also invalidate to ensure we get fresh data
      queryClient.invalidateQueries({ queryKey: ["/api/feedback", feedbackId, "comments"] });
      
      toast({
        title: "Comment deleted",
        description: "Your comment has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const extractMentions = (text: string): number[] => {
    const mentionPattern = /@(\w+)/g;
    const mentions: number[] = [];
    let match;
    
    while ((match = mentionPattern.exec(text)) !== null) {
      const username = match[1];
      const user = availableUsers.find(u => u.username === username || u.name.toLowerCase().replace(/\s+/g, '') === username.toLowerCase());
      if (user) {
        mentions.push(user.id);
      }
    }
    
    return mentions;
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    setNewComment(value);
    setCursorPosition(cursorPos);
    
    // Check for @ mentions
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtSymbol !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtSymbol + 1);
      if (!textAfterAt.includes(' ') && textAfterAt.length >= 0) {
        setMentionQuery(textAfterAt);
        setShowUserSuggestions(true);
      } else {
        setShowUserSuggestions(false);
      }
    } else {
      setShowUserSuggestions(false);
    }
  };

  const insertMention = (user: {id: number, name: string, username: string}) => {
    const textBeforeCursor = newComment.substring(0, cursorPosition);
    const textAfterCursor = newComment.substring(cursorPosition);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    
    const beforeAt = newComment.substring(0, lastAtSymbol);
    const mention = `@${user.username} `;
    const newText = beforeAt + mention + textAfterCursor;
    
    setNewComment(newText);
    setShowUserSuggestions(false);
    setMentionQuery("");
    
    // Focus back to textarea
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = beforeAt.length + mention.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const filteredUsers = availableUsers.filter(user => 
    user.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    
    const mentionedUsers = extractMentions(newComment);
    
    createCommentMutation.mutate({
      content: newComment.trim(),
      parentCommentId: replyingTo || undefined,
      mentionedUsers: mentionedUsers.length > 0 ? mentionedUsers : undefined
    });
  };

  const handleEditComment = (commentId: number) => {
    updateCommentMutation.mutate({
      commentId,
      content: editContent.trim()
    });
  };

  const handleDeleteComment = (commentId: number) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  const cancelEdit = () => {
    setEditingComment(null);
    setEditContent("");
  };

  const startReply = (commentId: number) => {
    setReplyingTo(commentId);
    setNewComment("");
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setNewComment("");
    setShowUserSuggestions(false);
    setMentionQuery("");
  };

  const renderContentWithMentions = (content: string) => {
    const mentionPattern = /@(\w+)/g;
    const parts = content.split(mentionPattern);
    
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // This is a username (odd indices in split result)
        const user = availableUsers.find(u => u.username === part || u.name.toLowerCase().replace(/\s+/g, '') === part.toLowerCase());
        if (user) {
          return (
            <span key={index} className="bg-blue-100 text-blue-800 px-1 rounded font-medium">
              @{user.username}
            </span>
          );
        }
        return `@${part}`;
      }
      return part;
    });
  };

  if (!user || (!isOwner && user.role !== 'head_coach' && user.role !== 'super_admin')) {
    return null;
  }

  const topLevelComments = comments?.filter(c => !c.parentCommentId) || [];
  const getReplies = (parentId: number) => comments?.filter(c => c.parentCommentId === parentId) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Comments</h3>
        <Badge variant="secondary">{comments?.length || 0}</Badge>
      </div>

      {isLoading ? (
        <div className="text-center py-4">Loading comments...</div>
      ) : (
        <div className="space-y-4">
          {topLevelComments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No comments yet. Be the first to comment on this session report.
            </p>
          ) : (
            topLevelComments.map((comment) => (
              <Card key={comment.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{comment.authorName || comment.authorUsername}</span>
                      {comment.isHeadCoachComment && (
                        <Badge variant="outline" className="text-xs">Head Coach</Badge>
                      )}
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {user.role === 'head_coach' || user.role === 'super_admin' || isOwner ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startReply(comment.id)}
                          className="h-8 px-2"
                        >
                          <Reply className="h-3 w-3 mr-1" />
                          Reply
                        </Button>
                      ) : null}
                      {(comment.authorId === user.id || user.role === 'super_admin') && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEdit(comment)}
                            className="h-8 px-2"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="h-8 px-2 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {editingComment === comment.id ? (
                    <div className="space-y-3">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        placeholder="Edit your comment..."
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleEditComment(comment.id)}
                          disabled={!editContent.trim() || updateCommentMutation.isPending}
                        >
                          Save Changes
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={cancelEdit}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      {renderContentWithMentions(comment.content)}
                    </div>
                  )}

                  {/* Replies */}
                  {getReplies(comment.id).length > 0 && (
                    <div className="mt-4 space-y-3">
                      <Separator />
                      {getReplies(comment.id).map((reply) => (
                        <div key={reply.id} className="ml-4 pl-4 border-l-2 border-muted">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{reply.authorName || reply.authorUsername}</span>
                              {reply.isHeadCoachComment && (
                                <Badge variant="outline" className="text-xs">Head Coach</Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                            {(reply.authorId === user.id || user.role === 'super_admin') && (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => startEdit(reply)}
                                  className="h-6 px-1"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteComment(reply.id)}
                                  className="h-6 px-1 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                          {editingComment === reply.id ? (
                            <div className="space-y-2">
                              <Textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                placeholder="Edit your reply..."
                                rows={2}
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleEditComment(reply.id)}
                                  disabled={!editContent.trim() || updateCommentMutation.isPending}
                                >
                                  Save
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={cancelEdit}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm leading-relaxed whitespace-pre-wrap">
                              {renderContentWithMentions(reply.content)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Form */}
                  {replyingTo === comment.id && (
                    <div className="mt-4 space-y-3">
                      <Separator />
                      <div className="ml-4">
                        <div className="relative">
                          <Textarea
                            ref={textareaRef}
                            value={newComment}
                            onChange={handleTextareaChange}
                            placeholder="Write your reply... (use @ to mention users)"
                            rows={3}
                          />
                          {showUserSuggestions && filteredUsers.length > 0 && (
                            <div className="absolute bottom-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                              {filteredUsers.map(user => (
                                <button
                                  key={user.id}
                                  className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2"
                                  onClick={() => insertMention(user)}
                                >
                                  <AtSign className="h-3 w-3 text-gray-500" />
                                  <span className="font-medium">{user.name}</span>
                                  <span className="text-gray-500 text-sm">@{user.username}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            onClick={handleSubmitComment}
                            disabled={!newComment.trim() || createCommentMutation.isPending}
                          >
                            <Send className="h-3 w-3 mr-1" />
                            Reply
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={cancelReply}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}

          {/* New Comment Form */}
          {!replyingTo && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="relative">
                    <Textarea
                      ref={textareaRef}
                      value={newComment}
                      onChange={handleTextareaChange}
                      placeholder={
                        user.role === 'head_coach' || user.role === 'super_admin'
                          ? "Add feedback or guidance for this coaching session... (use @ to mention users)"
                          : "Share your thoughts on this session report... (use @ to mention users)"
                      }
                      rows={4}
                    />
                    {showUserSuggestions && filteredUsers.length > 0 && (
                      <div className="absolute bottom-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                        {filteredUsers.map(user => (
                          <button
                            key={user.id}
                            className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2"
                            onClick={() => insertMention(user)}
                          >
                            <AtSign className="h-3 w-3 text-gray-500" />
                            <span className="font-medium">{user.name}</span>
                            <span className="text-gray-500 text-sm">@{user.username}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim() || createCommentMutation.isPending}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Post Comment
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}