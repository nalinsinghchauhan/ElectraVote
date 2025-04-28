import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface ElectionTabsProps {
  activeTab: string;
  setActiveTab: (value: string) => void;
  ongoingCount: number;
  upcomingCount: number;
  completedCount: number;
  ongoingContent: React.ReactNode;
  upcomingContent: React.ReactNode;
  completedContent: React.ReactNode;
}

export default function ElectionTabs({
  activeTab,
  setActiveTab,
  ongoingCount,
  upcomingCount,
  completedCount,
  ongoingContent,
  upcomingContent,
  completedContent,
}: ElectionTabsProps) {
  return (
    <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
      <div className="border-b border-gray-200">
        <TabsList className="bg-transparent w-full justify-start h-12 rounded-none p-0">
          <TabsTrigger
            value="ongoing"
            className="data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 data-[state=active]:shadow-none border-b-2 border-transparent px-1 py-4 rounded-none"
          >
            Ongoing
            <Badge className="ml-1.5 h-5 px-1.5 bg-primary-100 text-primary-600 hover:bg-primary-100">
              {ongoingCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="upcoming"
            className="data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 data-[state=active]:shadow-none border-b-2 border-transparent px-1 py-4 rounded-none"
          >
            Upcoming
            <Badge className="ml-1.5 h-5 px-1.5 bg-gray-100 text-gray-900 hover:bg-gray-100">
              {upcomingCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="completed"
            className="data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 data-[state=active]:shadow-none border-b-2 border-transparent px-1 py-4 rounded-none"
          >
            Completed
            <Badge className="ml-1.5 h-5 px-1.5 bg-gray-100 text-gray-900 hover:bg-gray-100">
              {completedCount}
            </Badge>
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="ongoing" className="pt-6">
        {ongoingContent}
      </TabsContent>
      <TabsContent value="upcoming" className="pt-6">
        {upcomingContent}
      </TabsContent>
      <TabsContent value="completed" className="pt-6">
        {completedContent}
      </TabsContent>
    </Tabs>
  );
}
