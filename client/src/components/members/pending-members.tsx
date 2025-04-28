import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";
import { UserCheck, UserX, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

export default function PendingMembers() {
  const { toast } = useToast();
  const [memberToReject, setMemberToReject] = useState<User | null>(null);
  const [confirmRejectOpen, setConfirmRejectOpen] = useState(false);
  
  const { data: members, isLoading, error } = useQuery<User[]>({
    queryKey: ["/api/members/status/pending"],
  });
  
  // Approve member mutation
  const approveMutation = useMutation({
    mutationFn: async (memberId: number) => {
      await apiRequest("POST", `/api/members/${memberId}/approve`, {});
    },
    onSuccess: () => {
      toast({
        title: "Member approved",
        description: "The member has been approved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/members/status/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/members/status/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/organization'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Reject member mutation
  const rejectMutation = useMutation({
    mutationFn: async (memberId: number) => {
      await apiRequest("POST", `/api/members/${memberId}/reject`, {});
    },
    onSuccess: () => {
      toast({
        title: "Member rejected",
        description: "The member has been rejected.",
      });
      setConfirmRejectOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/members/status/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/organization'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle approve click
  const handleApprove = (memberId: number) => {
    approveMutation.mutate(memberId);
  };
  
  // Handle reject click
  const handleRejectClick = (member: User) => {
    setMemberToReject(member);
    setConfirmRejectOpen(true);
  };
  
  // Handle confirm reject
  const handleConfirmReject = () => {
    if (memberToReject) {
      rejectMutation.mutate(memberToReject.id);
    }
  };
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-destructive mr-3" />
          <h3 className="text-sm font-medium text-destructive">Error loading pending members</h3>
        </div>
        <div className="mt-2 text-sm text-destructive/90">
          {error.message}
        </div>
      </div>
    );
  }
  
  if (!members || members.length === 0) {
    return (
      <div className="text-center py-12 bg-card rounded-lg shadow-md border border-border/40">
        <UserCheck className="mx-auto h-12 w-12 text-muted-foreground/40" />
        <h3 className="mt-2 text-sm font-medium text-foreground">No pending approval requests</h3>
        <p className="mt-1 text-sm text-muted-foreground">There are no member requests waiting for approval.</p>
      </div>
    );
  }
  
  return (
    <>
      <div className="bg-card shadow-md overflow-hidden border border-border/40 rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Member ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-yellow-500/20 flex items-center justify-center mr-2">
                      <span className="text-yellow-500 font-medium">
                        {member.name.charAt(0)}
                      </span>
                    </div>
                    {member.name}
                  </div>
                </TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell>{member.memberId}</TableCell>
                <TableCell>
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-500/20 text-yellow-500">
                    Pending
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-green-500 hover:text-green-500 hover:bg-green-500/10"
                    onClick={() => handleApprove(member.id)}
                    disabled={approveMutation.isPending && approveMutation.variables === member.id}
                  >
                    {approveMutation.isPending && approveMutation.variables === member.id
                      ? "Approving..."
                      : "Approve"}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleRejectClick(member)}
                    disabled={rejectMutation.isPending && memberToReject?.id === member.id}
                  >
                    {rejectMutation.isPending && memberToReject?.id === member.id
                      ? "Rejecting..."
                      : "Reject"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Confirm reject dialog */}
      <AlertDialog 
        open={confirmRejectOpen} 
        onOpenChange={setConfirmRejectOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Member Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject {memberToReject?.name}'s membership request? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmReject}
              className="bg-destructive hover:bg-destructive/90"
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
