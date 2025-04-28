import { useAuth } from "@/hooks/use-auth";
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
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const passwordSchema = z.object({
  currentPassword: z.string().min(6, {
    message: "Current password must be at least 6 characters.",
  }),
  newPassword: z.string().min(6, {
    message: "New password must be at least 6 characters.",
  }),
  confirmPassword: z.string().min(6, {
    message: "Confirm password must be at least 6 characters.",
  }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function Profile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  const isAdmin = user?.role === 'admin';
  
  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  function onSubmit(values: z.infer<typeof passwordSchema>) {
    // This would be handled by an API call in a real implementation
    alert("Password change would be sent to the server: " + JSON.stringify(values, null, 2));
    setIsChangingPassword(false);
    form.reset();
  }
  
  return (
    <DashboardLayout title="My Profile">
      {/* Account Information */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Personal details and application settings.
            </CardDescription>
          </div>
          <Button 
            variant="outline"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? "Cancel" : "Edit"}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full name</Label>
                    <Input id="name" defaultValue={user?.name} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input id="email" defaultValue={user?.email} />
                  </div>
                </div>
                {!isAdmin && user?.memberId && (
                  <div className="space-y-2">
                    <Label htmlFor="member-id">Member ID</Label>
                    <Input id="member-id" defaultValue={user.memberId || ""} disabled />
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1 text-sm font-medium text-muted-foreground">
                    Full name
                  </div>
                  <div className="col-span-2 text-sm text-foreground">
                    {user?.name}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1 text-sm font-medium text-muted-foreground">
                    Role
                  </div>
                  <div className="col-span-2 text-sm text-foreground">
                    {isAdmin ? 'Administrator' : 'Member'}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1 text-sm font-medium text-muted-foreground">
                    Email address
                  </div>
                  <div className="col-span-2 text-sm text-foreground">
                    {user?.email}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1 text-sm font-medium text-muted-foreground">
                    Organization
                  </div>
                  <div className="col-span-2 text-sm text-foreground">
                    {user?.organizationId}
                  </div>
                </div>
                {!isAdmin && user?.memberId && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1 text-sm font-medium text-muted-foreground">
                      Member ID
                    </div>
                    <div className="col-span-2 text-sm text-foreground">
                      {user.memberId}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
        {isEditing && (
          <CardFooter className="flex justify-end">
            <Button onClick={() => setIsEditing(false)} className="bg-primary/90 hover:bg-primary">Save changes</Button>
          </CardFooter>
        )}
      </Card>
      
      {/* Security Settings */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
          <CardDescription>
            Password and authentication preferences.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isChangingPassword ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setIsChangingPassword(false);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Change Password</Button>
                </div>
              </form>
            </Form>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-medium text-foreground">Password</h3>
                  <p className="text-sm text-muted-foreground">••••••••••••</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsChangingPassword(true)}
                >
                  Change password
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="two-factor">Two-factor authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Switch id="two-factor" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      

    </DashboardLayout>
  );
}
