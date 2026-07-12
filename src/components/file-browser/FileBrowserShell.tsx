import FileBrowserSidebar from "@/components/file-browser/FileBrowserSidebar";
import FileBrowserWorkspace from "@/components/file-browser/FileBrowserWorkspace";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function FileBrowserShell() {
  return (
    <main className="h-svh w-full overflow-hidden bg-background text-foreground">
      <SidebarProvider className="min-h-0 h-full">
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel defaultSize="20%" minSize="15%" maxSize="35%">
            <FileBrowserSidebar />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize="80%" minSize="65%">
            <FileBrowserWorkspace />
          </ResizablePanel>
        </ResizablePanelGroup>
      </SidebarProvider>
    </main>
  );
}
