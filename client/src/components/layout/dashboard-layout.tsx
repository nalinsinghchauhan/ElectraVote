import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  return (
    <Sidebar>
      <Header title={title} />
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4 space-y-8">{children}</div>
        </div>
      </div>
    </Sidebar>
  );
}
