import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/layout/dashboard-layout";
import ElectionTabs from "@/components/elections/election-tabs";
import OngoingElections from "@/components/elections/ongoing-elections";
import UpcomingElections from "@/components/elections/upcoming-elections";
import CompletedElections from "@/components/elections/completed-elections";
import { ElectionWithCandidates } from "@shared/schema";
import { AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function MemberElections() {
  const [activeTab, setActiveTab] = useState("ongoing");
  const [location] = useLocation();
  
  // Check for URL query parameters to set the initial tab
  useEffect(() => {
    const url = new URL(window.location.href);
    const tab = url.searchParams.get("tab");
    if (tab && ["ongoing", "upcoming", "completed"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location]);
  
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
      <div className="mb-6">
        <p className="text-gray-500">
          View and participate in your organization's elections.
        </p>
      </div>
      
      <ElectionTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        ongoingCount={ongoingCount}
        upcomingCount={upcomingCount}
        completedCount={completedCount}
        ongoingContent={<OngoingElections />}
        upcomingContent={<UpcomingElections />}
        completedContent={<CompletedElections />}
      />
    </DashboardLayout>
  );
}
