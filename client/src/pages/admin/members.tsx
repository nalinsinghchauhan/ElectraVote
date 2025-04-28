import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/layout/dashboard-layout";
import MembersTabs from "@/components/members/members-tabs";
import ActiveMembers from "@/components/members/active-members";
import PendingMembers from "@/components/members/pending-members";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, AlertCircle } from "lucide-react";
import { User } from "@shared/schema";

export default function AdminMembers() {
  const [activeTab, setActiveTab] = useState("active");
  const [location] = useLocation();
  
  // Check for URL query parameters to set the initial tab
  useEffect(() => {
    const url = new URL(window.location.href);
    const tab = url.searchParams.get("tab");
    if (tab === "pending") {
      setActiveTab("pending");
    }
  }, [location]);
  
  // Query for active members
  const { 
    data: activeMembers, 
    isLoading: activeLoading, 
    error: activeError
  } = useQuery<User[]>({
    queryKey: ["/api/members/status/active"],
  });
  
  // Query for pending members
  const { 
    data: pendingMembers, 
    isLoading: pendingLoading, 
    error: pendingError
  } = useQuery<User[]>({
    queryKey: ["/api/members/status/pending"],
  });
  
  // Handle adding a new member
  const handleAddMember = () => {
    // Create a temporary form to collect member information
    const email = prompt("Enter the member's email address:");
    if (email) {
      const name = prompt("Enter the member's name:");
      if (name) {
        const memberId = prompt("Enter an optional member ID:");
        
        // Show confirmation
        alert(`Member invitation would be sent to ${email} for ${name} ${memberId ? `(ID: ${memberId})` : ""}`);
        
        // In a real implementation, you would call an API endpoint to invite the member
        // apiRequest("POST", "/api/members/invite", { email, name, memberId })
      }
    }
  };
  
  // Display loading or error states
  if ((activeLoading && pendingLoading) || (activeError && pendingError)) {
    return (
      <DashboardLayout title="Members">
        {activeLoading && pendingLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-12 w-full mb-6" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        ) : (
          <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-destructive mr-3" />
              <h3 className="text-sm font-medium text-destructive">Error loading members</h3>
            </div>
            <div className="mt-2 text-sm text-destructive/90">
              {activeError?.message || pendingError?.message}
            </div>
          </div>
        )}
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout title="Members">
      <div className="mb-6 flex justify-between items-center">
        <p className="text-muted-foreground">
          Manage your organization's members and approval requests.
        </p>
        <Button onClick={handleAddMember} className="bg-primary/90 hover:bg-primary">
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </div>
      
      <MembersTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeCount={activeMembers?.length || 0}
        pendingCount={pendingMembers?.length || 0}
        activeContent={<ActiveMembers onAddMember={handleAddMember} />}
        pendingContent={<PendingMembers />}
      />
    </DashboardLayout>
  );
}
