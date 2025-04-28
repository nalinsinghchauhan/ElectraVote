import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface MembersTabsProps {
  activeTab: string;
  setActiveTab: (value: string) => void;
  activeCount: number;
  pendingCount: number;
  activeContent: React.ReactNode;
  pendingContent: React.ReactNode;
}

export default function MembersTabs({
  activeTab,
  setActiveTab,
  activeCount,
  pendingCount,
  activeContent,
  pendingContent,
}: MembersTabsProps) {
  return (
    <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
      <div className="border-b border-border/40">
        <TabsList className="bg-transparent w-full justify-start h-12 rounded-none p-0">
          <TabsTrigger
            value="active"
            className="data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent px-1 py-4 rounded-none"
          >
            Active
            <Badge className="ml-1.5 h-5 px-1.5 bg-primary/10 text-primary hover:bg-primary/15">
              {activeCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="pending"
            className="data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent px-1 py-4 rounded-none"
          >
            Pending Approval
            <Badge className="ml-1.5 h-5 px-1.5 bg-muted text-muted-foreground hover:bg-muted/70">
              {pendingCount}
            </Badge>
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="active" className="pt-6">
        {activeContent}
      </TabsContent>
      <TabsContent value="pending" className="pt-6">
        {pendingContent}
      </TabsContent>
    </Tabs>
  );
}
