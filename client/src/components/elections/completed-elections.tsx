import { useQuery } from "@tanstack/react-query";
import { ElectionWithCandidates } from "@shared/schema";
import ElectionCard from "@/components/election-card";
import { Archive, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface CompletedElectionsProps {
  onStatusChange?: (id: number, status: string) => void;
}

export default function CompletedElections({ onStatusChange }: CompletedElectionsProps) {
  const { data: elections, isLoading, error } = useQuery<ElectionWithCandidates[]>({
    queryKey: ["/api/elections/status/completed"],
  });
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[300px] w-full" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-destructive mr-3" />
          <h3 className="text-sm font-medium text-destructive">Error loading elections</h3>
        </div>
        <div className="mt-2 text-sm text-destructive/90">
          {error.message}
        </div>
      </div>
    );
  }
  
  if (!elections || elections.length === 0) {
    return (
      <div className="text-center py-12 bg-card rounded-lg shadow-md border border-border/40">
        <Archive className="mx-auto h-12 w-12 text-muted-foreground/40" />
        <h3 className="mt-2 text-sm font-medium text-foreground">No completed elections</h3>
        <p className="mt-1 text-sm text-muted-foreground">There are no completed elections to display.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {elections.map((election) => (
        <ElectionCard 
          key={election.id} 
          election={election}
          onStatusChange={onStatusChange}
        />
      ))}
    </div>
  );
}
