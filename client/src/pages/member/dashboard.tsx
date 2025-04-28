import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CheckCircle2, 
  CalendarDays, 
  FileCheck, 
  AlertCircle 
} from "lucide-react";
import OngoingElections from "@/components/elections/ongoing-elections";
import UpcomingElections from "@/components/elections/upcoming-elections";
import { Link } from "wouter";

interface OrganizationData {
  id: string;
  name: string;
  createdAt: string;
  counts: {
    activeMembers: number;
    pendingMembers: number;
    totalMembers: number;
    ongoingElections: number;
    upcomingElections: number;
    completedElections: number;
    totalElections: number;
  };
}

interface ElectionSummary {
  ongoing: number;
  upcoming: number;
  completed: number;
  votedCount: number;
}

export default function MemberDashboard() {
  // Query organization data
  const { data: organization, isLoading: orgLoading, error: orgError } = useQuery<OrganizationData>({
    queryKey: ["/api/organization"],
  });
  
  // Query election data for more details
  const { data: elections, isLoading: electionsLoading, error: electionsError } = useQuery({
    queryKey: ["/api/elections"],
  });
  
  // Calculate election statistics
  const electionStats: ElectionSummary = {
    ongoing: organization?.counts.ongoingElections || 0,
    upcoming: organization?.counts.upcomingElections || 0,
    completed: organization?.counts.completedElections || 0,
    votedCount: elections?.filter(e => e.userVoted).length || 0
  };
  
  // Stats to display
  const stats = [
    { 
      name: "Open Elections", 
      value: electionStats.ongoing, 
      icon: CheckCircle2,
      href: "/member/elections?tab=ongoing",
      iconColor: "text-green-500",
      bgColor: "bg-green-900/20"
    },
    { 
      name: "Upcoming Elections", 
      value: electionStats.upcoming, 
      icon: CalendarDays,
      href: "/member/elections?tab=upcoming",
      iconColor: "text-blue-500",
      bgColor: "bg-blue-900/20"
    },
    { 
      name: "Past Elections", 
      value: electionStats.completed, 
      icon: FileCheck,
      href: "/member/elections?tab=completed",
      iconColor: "text-purple-500",
      bgColor: "bg-purple-900/20"
    },
  ];
  
  const isLoading = orgLoading || electionsLoading;
  const error = orgError || electionsError;

  return (
    <DashboardLayout title="Dashboard">
      {/* Organization Info */}
      <Card className="mb-6">
        <CardContent className="p-6">
          {isLoading ? (
            <div>
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-52" />
            </div>
          ) : error ? (
            <div className="bg-destructive/20 p-4 rounded-md border border-destructive/40">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-destructive mr-2" />
                <h3 className="text-sm font-medium text-foreground">Error loading organization data</h3>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                {error.message}
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-medium text-foreground">{organization?.name}</h2>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Member of Organization ID: {organization?.id}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-6">
        {stats.map((item) => (
          <Link key={item.name} href={item.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 ${item.bgColor} p-3 rounded-full`}>
                    <item.icon className={`h-6 w-6 ${item.iconColor}`} />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-muted-foreground truncate">{item.name}</dt>
                      <dd>
                        {isLoading ? (
                          <Skeleton className="h-6 w-12 mt-1" />
                        ) : (
                          <div className="text-lg font-medium text-foreground">{item.value}</div>
                        )}
                      </dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Active Elections */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="mb-4">
            <h2 className="text-lg font-medium text-foreground">Active Elections</h2>
            <p className="text-sm text-muted-foreground">Elections that are currently open for voting</p>
          </div>
          <div className="border-t border-border/40 pt-4">
            <OngoingElections />
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Elections */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-4">
            <h2 className="text-lg font-medium text-foreground">Upcoming Elections</h2>
            <p className="text-sm text-muted-foreground">Elections scheduled for the future</p>
          </div>
          <div className="border-t border-border/40 pt-4">
            <UpcomingElections />
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
