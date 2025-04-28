import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  Vote,
  Users,
  Settings,
  UserCog,
  LogOut,
  ChevronDown,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface SidebarProps {
  children?: React.ReactNode;
}

export default function Sidebar({ children }: SidebarProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [isCollapsibleOpen, setIsCollapsibleOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAdmin = user?.role === "admin";
  
  const adminNav = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Elections", href: "/admin/elections", icon: Vote },
    { name: "Members", href: "/admin/members", icon: Users },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];
  
  const memberNav = [
    { name: "Dashboard", href: "/member/dashboard", icon: LayoutDashboard },
    { name: "Elections", href: "/member/elections", icon: Vote },
  ];
  
  const navItems = isAdmin ? adminNav : memberNav;
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  // Get the initials for the avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const sidebarContent = (
    <>
      <div className="space-y-4 py-6">
        <div className="px-4 py-2">
          <h2 className="text-xl font-bold text-gradient">ElectraVote</h2>
        </div>
        <div className="px-4">
          <h3 className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Navigation
          </h3>
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${
                      isActive ? "text-sidebar-primary" : "text-sidebar-foreground/70 group-hover:text-sidebar-primary"
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="px-4 pt-2">
          <div className="divider mb-4"></div>
          <h3 className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Account
          </h3>
          <nav className="space-y-1.5">
            <Link
              href="/profile"
              className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                location === "/profile"
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              }`}
            >
              <UserCog
                className={`mr-3 h-5 w-5 ${
                  location === "/profile" ? "text-sidebar-primary" : "text-sidebar-foreground/70 group-hover:text-sidebar-primary"
                }`}
              />
              My Profile
            </Link>
            <Button
              variant="ghost"
              className="w-full justify-start px-3 py-2.5 h-10 font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="mr-3 h-5 w-5 text-sidebar-foreground/70" />
              {logoutMutation.isPending ? "Logging out..." : "Sign out"}
            </Button>
          </nav>
        </div>
      </div>
      
      {/* User profile at bottom */}
      <div className="border-t border-sidebar-border p-4">
        <Collapsible
          open={isCollapsibleOpen}
          onOpenChange={setIsCollapsibleOpen}
          className="bg-sidebar-accent/30 rounded-lg p-2"
        >
          <div className="flex items-center">
            <div className="flex items-center">
              <Avatar className="h-9 w-9 mr-3 border-2 border-sidebar-primary/40">
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground font-bold">
                  {user?.name ? getInitials(user.name) : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.name}
                </h4>
                <p className="text-xs text-sidebar-foreground/70 truncate">
                  {isAdmin ? "Administrator" : "Member"}
                </p>
              </div>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="ml-1 p-0 h-8 w-8 hover:bg-sidebar-accent">
                <ChevronDown
                  className={`h-4 w-4 text-sidebar-foreground/70 ${isCollapsibleOpen ? "rotate-180" : ""} transition-transform`}
                />
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="mt-3 space-y-2 pl-12">
            <p className="text-xs text-sidebar-foreground/70">
              <span className="text-muted-foreground">Organization:</span> {user?.organizationId}
            </p>
            {!isAdmin && user?.memberId && (
              <p className="text-xs text-sidebar-foreground/70">
                <span className="text-muted-foreground">Member ID:</span> {user.memberId}
              </p>
            )}
            <Link href="/profile">
              <Button variant="outline" size="sm" className="w-full mt-2 text-xs bg-sidebar-primary/10 border-sidebar-primary/20 hover:bg-sidebar-primary/20">
                View Profile
              </Button>
            </Link>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-72">
          <div className="flex flex-col flex-grow overflow-y-auto sidebar border-r border-sidebar-border">
            {sidebarContent}
          </div>
        </div>
      </div>
      
      {/* Mobile sidebar */}
      <div className="md:hidden">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="ghost" 
              className="h-12 w-12 p-0 fixed top-2 left-2 z-30 rounded-full bg-background/80 backdrop-blur-sm border border-border/50"
            >
              <Menu size={22} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0 sidebar">
            {sidebarContent}
          </SheetContent>
        </Sheet>
      </div>
      
      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-y-auto">
        <div className="md:hidden h-16 bg-background flex items-center justify-center px-4 border-b border-border/50">
          <div className="flex-1 flex justify-center">
            <h1 className="text-xl font-bold text-gradient">ElectraVote</h1>
          </div>
        </div>
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
