import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { UserRound, AlertCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";

interface ActiveMembersProps {
  onAddMember?: () => void;
}

export default function ActiveMembers({ onAddMember }: ActiveMembersProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: members, isLoading, error } = useQuery<User[]>({
    queryKey: ["/api/members/status/active"],
  });
  
  // Filter members based on search term
  const filteredMembers = members?.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (member.memberId && member.memberId.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
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
          <h3 className="text-sm font-medium text-destructive">Error loading members</h3>
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
        <UserRound className="mx-auto h-12 w-12 text-muted-foreground/40" />
        <h3 className="mt-2 text-sm font-medium text-foreground">No active members</h3>
        <p className="mt-1 text-sm text-muted-foreground">Your organization doesn't have any active members yet.</p>
        {onAddMember && (
          <div className="mt-6">
            <Button onClick={onAddMember}>Add Member</Button>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <Input
            className="pl-10"
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {onAddMember && (
          <Button onClick={onAddMember} className="bg-primary/90 hover:bg-primary">Add Member</Button>
        )}
      </div>
      
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
            {filteredMembers && filteredMembers.length > 0 ? (
              filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center mr-2">
                        <span className="text-primary font-medium">
                          {member.name.charAt(0)}
                        </span>
                      </div>
                      {member.name}
                    </div>
                  </TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>{member.memberId}</TableCell>
                  <TableCell>
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-500/20 text-green-500">
                      Active
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8"
                      onClick={() => alert(`This would open an edit modal for member: ${member.name}`)}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => alert(`This would deactivate member: ${member.name}`)}
                    >
                      Deactivate
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                  No members match your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
