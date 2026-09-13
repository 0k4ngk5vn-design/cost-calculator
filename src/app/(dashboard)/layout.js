import { AppSidebar } from "@/components/app-sidebar";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { UnitProvider } from "@/components/unit-provider";

export default function RootLayout({ children }) {
  return (
    <UnitProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />

            <div className="h-4 w-px bg-border" />

            <span className="whitespace-nowrap font-semibold ml-1">
              원가계산기 - For MUCHACHOS
            </span>
          </header>

          <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </UnitProvider>
  );
}
