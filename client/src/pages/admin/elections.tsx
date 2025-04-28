import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import ElectionTabs from "@/components/elections/election-tabs";
import OngoingElections from "@/components/elections/ongoing-elections";
import UpcomingElections from "@/components/elections/upcoming-elections";
import CompletedElections from "@/components/elections/completed-elections";
import CreateElectionDialog from "@/components/create-election-dialog";
import { Button } from "@/components/ui/button";
import { ElectionWithCandidates } from "@shared/schema";
import { PlusCircle, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminElections() {
  const [activeTab, setActiveTab] = useState("ongoing");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Query for all elections to get counts
  const { 
    data: elections, 
    isLoading, 
    error 
  } = useQuery<ElectionWithCandidates[]>({
    queryKey: ["/api/elections"],
  });
  
  // Counts for tabs
  const ongoingCount = elections?.filter(e => e.status === "ongoing").length || 0;
  const upcomingCount = elections?.filter(e => e.status === "upcoming").length || 0;
  const completedCount = elections?.filter(e => e.status === "completed").length || 0;
  
  // Handle election status change
  const handleStatusChange = (id: number, status: string) => {
    // This is handled by the mutation in ElectionCard component
    // We just ensure the active tab is updated if needed
    if (status === "ongoing" && activeTab !== "ongoing") {
      setActiveTab("ongoing");
    } else if (status === "completed" && activeTab !== "completed") {
      setActiveTab("completed");
    }
  };
  
  if (isLoading || error) {
    return (
      <DashboardLayout title="Elections">
        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-12 w-full mb-6" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        ) : (
          <div className="bg-red-50 p-4 rounded-md">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <h3 className="text-sm font-medium text-red-800">Error loading elections</h3>
            </div>
            <div className="mt-2 text-sm text-red-700">
              {error.message}
            </div>
          </div>
        )}
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout title="Elections">
      <div className="mb-6 flex justify-between items-center">
        <p className="text-gray-500">
          Create and manage elections for your organization.
        </p>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Create Election
        </Button>
      </div>
      
      <ElectionTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        ongoingCount={ongoingCount}
        upcomingCount={upcomingCount}
        completedCount={completedCount}
        ongoingContent={
          <OngoingElections 
            isAdmin={true} 
            onCreateElection={() => setIsCreateDialogOpen(true)}
            onStatusChange={handleStatusChange}
          />
        }
        upcomingContent={
          <UpcomingElections 
            isAdmin={true} 
            onCreateElection={() => setIsCreateDialogOpen(true)}
            onStatusChange={handleStatusChange}
          />
        }
        completedContent={
          <CompletedElections 
            onStatusChange={handleStatusChange}
          />
        }
      />
      
      <CreateElectionDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </DashboardLayout>
  );
}
