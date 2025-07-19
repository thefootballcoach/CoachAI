import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, Mail, Clock, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PendingInvitation {
  id: number;
  name: string;
  email: string;
  role: string;
  position?: string;
  ageGroup?: string;
  licenseLevel?: string;
  invitationExpires: string;
  createdAt: string;
}

export default function PendingInvitations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [resendingEmails, setResendingEmails] = useState<Set<string>>(new Set());

  const { data: pendingInvitations, isLoading } = useQuery({
    queryKey: ["/api/users/pending-invitations"],
    queryFn: () => apiRequest("/api/users/pending-invitations"),
  });

  const resendInviteMutation = useMutation({
    mutationFn: (email: string) => 
      apiRequest("/api/users/resend-invite", {
        method: "POST",
        body: { email }
      }),
    onMutate: (email) => {
      setResendingEmails(prev => new Set([...prev, email]));
    },
    onSuccess: (data, email) => {
      toast({
        title: "Invitation Resent",
        description: `New invitation sent to ${email}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/pending-invitations"] });
    },
    onError: (error: any, email) => {
      toast({
        title: "Failed to Resend Invitation",
        description: error.message || "An error occurred while resending the invitation",
        variant: "destructive",
      });
    },
    onSettled: (data, error, email) => {
      setResendingEmails(prev => {
        const newSet = new Set(prev);
        newSet.delete(email);
        return newSet;
      });
    },
  });

  const handleResendInvite = (email: string) => {
    resendInviteMutation.mutate(email);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isExpired = (expiresString: string) => {
    return new Date(expiresString) < new Date();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserPlus className="mr-2 h-5 w-5" />
            Pending Invitations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!pendingInvitations || pendingInvitations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserPlus className="mr-2 h-5 w-5" />
            Pending Invitations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No pending invitations
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <UserPlus className="mr-2 h-5 w-5" />
          Pending Invitations ({pendingInvitations.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingInvitations.map((invitation: PendingInvitation) => (
              <TableRow key={invitation.id}>
                <TableCell className="font-medium">{invitation.name}</TableCell>
                <TableCell>{invitation.email}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {invitation.role.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>{invitation.position || '-'}</TableCell>
                <TableCell>
                  <div className="flex items-center text-sm">
                    <Clock className="mr-1 h-3 w-3" />
                    {formatDate(invitation.invitationExpires)}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={isExpired(invitation.invitationExpires) ? "destructive" : "secondary"}
                  >
                    {isExpired(invitation.invitationExpires) ? "Expired" : "Pending"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResendInvite(invitation.email)}
                    disabled={resendingEmails.has(invitation.email)}
                    className="flex items-center"
                  >
                    {resendingEmails.has(invitation.email) ? (
                      <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <Mail className="mr-1 h-3 w-3" />
                    )}
                    {resendingEmails.has(invitation.email) ? "Sending..." : "Resend"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}