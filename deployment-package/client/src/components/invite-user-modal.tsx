import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus, Mail, Copy, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface InviteUserModalProps {
  trigger?: React.ReactNode;
}

export default function InviteUserModal({ trigger }: InviteUserModalProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    position: "",
    ageGroup: "",
    licenseLevel: ""
  });

  const queryClient = useQueryClient();

  const inviteUserMutation = useMutation({
    mutationFn: async (userData: typeof formData) => {
      const response = await fetch("/api/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
        credentials: "include"
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send invitation");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setOpen(false);
      setFormData({
        name: "",
        email: "",
        role: "",
        position: "",
        ageGroup: "",
        licenseLevel: ""
      });
      
      if (data.user.emailSent) {
        toast({
          title: "Invitation Sent",
          description: `Invitation email sent to ${data.user.email}. They will receive instructions to complete their registration.`
        });
      } else {
        toast({
          title: "User Invited",
          description: `User created successfully. Manual invitation URL needed for ${data.user.email}.`,
          variant: "default"
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Invitation Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.role) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in name, email, and role.",
        variant: "destructive"
      });
      return;
    }

    inviteUserMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Invite User
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invite New User
          </DialogTitle>
          <DialogDescription>
            Send an invitation email to add a new user to your organization. They will receive a link to complete their registration.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="Enter email address"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="coach">Coach</SelectItem>
                <SelectItem value="club_admin">Club Admin</SelectItem>
                <SelectItem value="admin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Position</Label>
            <Select value={formData.position} onValueChange={(value) => handleInputChange("position", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select position (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="head_coach">Head Coach</SelectItem>
                <SelectItem value="assistant_coach">Assistant Coach</SelectItem>
                <SelectItem value="youth_coach">Youth Coach</SelectItem>
                <SelectItem value="goalkeeper_coach">Goalkeeper Coach</SelectItem>
                <SelectItem value="fitness_coach">Fitness Coach</SelectItem>
                <SelectItem value="academy_coach">Academy Coach</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ageGroup">Age Group</Label>
            <Select value={formData.ageGroup} onValueChange={(value) => handleInputChange("ageGroup", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select age group (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="U8">Under 8</SelectItem>
                <SelectItem value="U10">Under 10</SelectItem>
                <SelectItem value="U12">Under 12</SelectItem>
                <SelectItem value="U14">Under 14</SelectItem>
                <SelectItem value="U16">Under 16</SelectItem>
                <SelectItem value="U18">Under 18</SelectItem>
                <SelectItem value="U21">Under 21</SelectItem>
                <SelectItem value="Senior">Senior</SelectItem>
                <SelectItem value="Mixed">Mixed Ages</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="licenseLevel">License Level</Label>
            <Select value={formData.licenseLevel} onValueChange={(value) => handleInputChange("licenseLevel", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select license level (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Level 1">Level 1</SelectItem>
                <SelectItem value="Level 2">Level 2</SelectItem>
                <SelectItem value="Level 3">Level 3</SelectItem>
                <SelectItem value="A License">A License</SelectItem>
                <SelectItem value="Pro License">Pro License</SelectItem>
                <SelectItem value="UEFA A">UEFA A</SelectItem>
                <SelectItem value="UEFA Pro">UEFA Pro</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={inviteUserMutation.isPending}
            >
              {inviteUserMutation.isPending ? "Sending..." : "Send Invitation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}