import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "Dashboard — Masidy",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        {/* Top bar */}
        <header className="flex h-10 items-center gap-2 border-b border-foreground/10 px-4 shrink-0">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />
          {/* Breadcrumb / page title injected by each page via a slot — 
              for now we render children which include their own top bar content */}
        </header>
        <div className="flex flex-1 flex-col overflow-auto">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
