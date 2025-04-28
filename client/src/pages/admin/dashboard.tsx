import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  UsersRound, 
  Vote, 
  UserPlus, 
  FileText,
  AlertCircle,
  CheckCircle 
} from "lucide-react";
import OngoingElections from "@/components/elections/ongoing-elections";
import UpcomingElections from "@/components/elections/upcoming-elections";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface OrganizationData {
  id: string;
  name: string;
  adminId: number;
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

export default function AdminDashboard() {
  const { data, isLoading, error } = useQuery<OrganizationData>({
    queryKey: ["/api/organization"],
  });

  // Stats to display
  const stats = [
    { 
      name: "Total Members", 
      value: data?.counts.totalMembers || 0, 
      icon: UsersRound,
      href: "/admin/members",
      iconColor: "text-blue-500",
      bgColor: "bg-blue-900/20" 
    },
    { 
      name: "Active Elections", 
      value: data?.counts.ongoingElections || 0, 
      icon: Vote,
      href: "/admin/elections",
      iconColor: "text-green-500",
      bgColor: "bg-green-900/20"
    },
    { 
      name: "Pending Approvals", 
      value: data?.counts.pendingMembers || 0, 
      icon: UserPlus,
      href: "/admin/members?tab=pending",
      iconColor: "text-yellow-500",
      bgColor: "bg-yellow-900/20"
    },
    { 
      name: "Total Elections", 
      value: data?.counts.totalElections || 0, 
      icon: FileText,
      href: "/admin/elections",
      iconColor: "text-purple-500",
      bgColor: "bg-purple-900/20"
    },
  ];

  return (
    <DashboardLayout title="Dashboard">
      {/* Organization Info */}
      <Card className="mb-6">
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex justify-between items-center">
              <div>
                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="h-4 w-52" />
              </div>
              <Skeleton className="h-9 w-20" />
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
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-medium text-foreground">{data?.name}</h2>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Organization ID: {data?.id}</p>
              </div>
              <Link href="/admin/settings">
                <Button variant="outline" size="sm">
                  Manage
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
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
            <OngoingElections isAdmin={true} />
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
            <UpcomingElections isAdmin={true} />
          </div>
        </CardContent>
      </Card>

      {/* Pending Member Notifications */}
      {data?.counts?.pendingMembers > 0 && (
        <div className="mt-6 bg-secondary/30 p-4 rounded-md border border-border/40">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-yellow-400 mr-2" />
            <h3 className="text-sm font-medium text-foreground">Members waiting for approval</h3>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            You have {data?.counts?.pendingMembers} member{data?.counts?.pendingMembers !== 1 ? 's' : ''} waiting for approval.
          </div>
          <div className="mt-4">
            <Link href="/admin/members?tab=pending">
              <Button variant="outline" size="sm">
                Review Members
              </Button>
            </Link>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
