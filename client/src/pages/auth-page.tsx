import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { z } from "zod";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle } from "lucide-react";

// Login form schema
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

// Admin registration schema
const adminRegisterSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  organizationName: z.string().min(3, { message: "Organization name must be at least 3 characters" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Member registration schema
const memberRegisterSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  organizationId: z.string().min(3, { message: "Organization ID must be at least 3 characters" }),
  memberId: z.string().min(3, { message: "Member ID must be at least 3 characters" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function AuthPage() {
  const [authTab, setAuthTab] = useState("login");
  const [registerTab, setRegisterTab] = useState("admin");
  const [memberSuccess, setMemberSuccess] = useState(false);
  const { user, loginMutation, adminRegisterMutation, memberRegisterMutation } = useAuth();
  const [location, navigate] = useLocation();

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const adminRegisterForm = useForm<z.infer<typeof adminRegisterSchema>>({
    resolver: zodResolver(adminRegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      organizationName: "",
      password: "",
      confirmPassword: "",
    },
  });

  const memberRegisterForm = useForm<z.infer<typeof memberRegisterSchema>>({
    resolver: zodResolver(memberRegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      organizationId: "",
      memberId: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Handle login submission
  const onLoginSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(values);
  };

  // Handle admin registration submission
  const onAdminRegisterSubmit = (values: z.infer<typeof adminRegisterSchema>) => {
    adminRegisterMutation.mutate(values);
  };

  // Handle member registration submission
  const onMemberRegisterSubmit = (values: z.infer<typeof memberRegisterSchema>) => {
    memberRegisterMutation.mutate(values, {
      onSuccess: () => {
        setMemberSuccess(true);
        memberRegisterForm.reset();
      }
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-extrabold text-gradient">ElectraVote</h1>
        <h2 className="mt-2 text-center text-sm text-muted-foreground">
          Secure Organizational Voting Platform
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow-lg border border-border/40 sm:rounded-lg sm:px-10">
          <Tabs defaultValue="login" value={authTab} onValueChange={setAuthTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card className="border-0 shadow-none">
                <CardHeader className="p-0 mb-4">
                  <CardTitle className="text-xl">Sign in to your account</CardTitle>
                  <CardDescription>
                    Enter your email address and password to access your organization.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="name@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing in...
                          </>
                        ) : (
                          "Sign in"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="register">
              <Tabs defaultValue="admin" value={registerTab} onValueChange={setRegisterTab}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="admin">Administrator</TabsTrigger>
                  <TabsTrigger value="member">Member</TabsTrigger>
                </TabsList>
                
                <TabsContent value="admin">
                  <Card className="border-0 shadow-none">
                    <CardHeader className="p-0 mb-4">
                      <CardTitle className="text-xl">Create an Organization</CardTitle>
                      <CardDescription>
                        Register as an administrator and create your organization.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Form {...adminRegisterForm}>
                        <form onSubmit={adminRegisterForm.handleSubmit(onAdminRegisterSubmit)} className="space-y-4">
                          <FormField
                            control={adminRegisterForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="John Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={adminRegisterForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input placeholder="name@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={adminRegisterForm.control}
                            name="organizationName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Organization Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Acme Inc." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={adminRegisterForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="••••••" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={adminRegisterForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirm Password</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="••••••" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button 
                            type="submit" 
                            className="w-full"
                            disabled={adminRegisterMutation.isPending}
                          >
                            {adminRegisterMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating organization...
                              </>
                            ) : (
                              "Create Organization"
                            )}
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="member">
                  {memberSuccess ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                      <h3 className="text-xl font-medium text-foreground mb-2">Registration Successful!</h3>
                      <p className="text-sm text-muted-foreground text-center mb-6">
                        Your request has been sent to the organization admin for approval.
                      </p>
                      <Button
                        onClick={() => {
                          setMemberSuccess(false);
                          setAuthTab("login");
                        }}
                        className="bg-primary/90 hover:bg-primary"
                      >
                        Go to Login
                      </Button>
                    </div>
                  ) : (
                    <Card className="border-0 shadow-none">
                      <CardHeader className="p-0 mb-4">
                        <CardTitle className="text-xl">Join an Organization</CardTitle>
                        <CardDescription>
                          Register as a member using your organization credentials.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-0">
                        <Form {...memberRegisterForm}>
                          <form onSubmit={memberRegisterForm.handleSubmit(onMemberRegisterSubmit)} className="space-y-4">
                            <FormField
                              control={memberRegisterForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Full Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="John Doe" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={memberRegisterForm.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email</FormLabel>
                                  <FormControl>
                                    <Input placeholder="name@example.com" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={memberRegisterForm.control}
                              name="organizationId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Organization ID</FormLabel>
                                  <FormControl>
                                    <Input placeholder="XYZ123" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={memberRegisterForm.control}
                              name="memberId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Member ID</FormLabel>
                                  <FormControl>
                                    <Input placeholder="M1001" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={memberRegisterForm.control}
                              name="password"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Password</FormLabel>
                                  <FormControl>
                                    <Input type="password" placeholder="••••••" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={memberRegisterForm.control}
                              name="confirmPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Confirm Password</FormLabel>
                                  <FormControl>
                                    <Input type="password" placeholder="••••••" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button 
                              type="submit" 
                              className="w-full"
                              disabled={memberRegisterMutation.isPending}
                            >
                              {memberRegisterMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Joining organization...
                                </>
                              ) : (
                                "Join Organization"
                              )}
                            </Button>
                          </form>
                        </Form>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
