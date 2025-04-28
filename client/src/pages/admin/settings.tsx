import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

export default function AdminSettings() {
  const { user } = useAuth();
  
  const { data: organization, isLoading, error } = useQuery<OrganizationData>({
    queryKey: ["/api/organization"],
  });
  
  return (
    <DashboardLayout title="Organization Settings">
      {/* Organization Information */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Organization Information</CardTitle>
            <CardDescription>
              Basic details about your organization.
            </CardDescription>
          </div>
          <Button variant="outline">Edit</Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-md">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <h3 className="text-sm font-medium text-red-800">Error loading organization data</h3>
              </div>
              <div className="mt-2 text-sm text-red-700">
                {error.message}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 text-sm font-medium text-gray-500">
                  Organization name
                </div>
                <div className="col-span-2 text-sm text-gray-900">
                  {organization?.name}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 text-sm font-medium text-gray-500">
                  Organization ID
                </div>
                <div className="col-span-2 text-sm text-gray-900">
                  {organization?.id}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 text-sm font-medium text-gray-500">
                  Administrator
                </div>
                <div className="col-span-2 text-sm text-gray-900">
                  {user?.name} ({user?.email})
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 text-sm font-medium text-gray-500">
                  Member count
                </div>
                <div className="col-span-2 text-sm text-gray-900">
                  {organization?.counts.totalMembers || 0}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Election Settings */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Election Settings</CardTitle>
          <CardDescription>
            Configure default behavior for elections.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-send-results">Automatically send results</Label>
                <p className="text-sm text-gray-500">
                  Send election results to all members when an election ends.
                </p>
              </div>
              <Switch id="auto-send-results" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="allow-reopen">Allow reopening closed elections</Label>
                <p className="text-sm text-gray-500">
                  Enable the ability to reopen elections after they've concluded.
                </p>
              </div>
              <Switch id="allow-reopen" />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="require-all-votes">Require all members to vote</Label>
                <p className="text-sm text-gray-500">
                  Keep sending reminders until all members have voted.
                </p>
              </div>
              <Switch id="require-all-votes" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="default-duration">Default election duration</Label>
              <Select defaultValue="week">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">1 day</SelectItem>
                  <SelectItem value="week">1 week</SelectItem>
                  <SelectItem value="twoweeks">2 weeks</SelectItem>
                  <SelectItem value="month">1 month</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button>Save settings</Button>
        </CardFooter>
      </Card>
      
      {/* Security Settings */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
          <CardDescription>
            Configure security options for your organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="require-2fa">Require two-factor authentication</Label>
                <p className="text-sm text-gray-500">
                  Force all users to set up 2FA for their accounts.
                </p>
              </div>
              <Switch id="require-2fa" />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="single-session">Single session per user</Label>
                <p className="text-sm text-gray-500">
                  Only allow one active session per user at a time.
                </p>
              </div>
              <Switch id="single-session" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="session-timeout">Session timeout</Label>
              <Select defaultValue="hour">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select timeout" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15min">15 minutes</SelectItem>
                  <SelectItem value="30min">30 minutes</SelectItem>
                  <SelectItem value="hour">1 hour</SelectItem>
                  <SelectItem value="4hours">4 hours</SelectItem>
                  <SelectItem value="8hours">8 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button>Save settings</Button>
        </CardFooter>
      </Card>
      
      {/* Danger Zone */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>
            Actions that cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Reset all members' passwords</h4>
              <p className="text-sm text-gray-500 mt-1">This will send password reset emails to all members.</p>
              <Button variant="outline" className="mt-2">
                Reset passwords
              </Button>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-900">Delete all election data</h4>
              <p className="text-sm text-gray-500 mt-1">This will remove all elections and their associated data.</p>
              <Button variant="destructive" className="mt-2">
                Delete election data
              </Button>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-900">Delete organization</h4>
              <p className="text-sm text-gray-500 mt-1">This will permanently delete your organization and all associated data.</p>
              <Button variant="destructive" className="mt-2">
                Delete organization
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Alert variant="warning" className="mt-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Important Note</AlertTitle>
        <AlertDescription>
          These settings are for demonstration purposes. In a production environment, these would be fully functional.
        </AlertDescription>
      </Alert>
    </DashboardLayout>
  );
}
