import { FolderRoot } from "lucide-react";
import { ThemeToggle } from "@/components";
import FileBrowserFolderTree from "@/components/file-browser/FileBrowserFolderTree";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
} from "@/components/ui/sidebar";

export default function FileBrowserSidebar() {
  return (
    <Sidebar className="w-full border-0" collapsible="none">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
              <FolderRoot aria-hidden="true" className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">File Browser</p>
              <p className="truncate text-xs text-muted-foreground">
                Personal workspace
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Folders</SidebarGroupLabel>
          <SidebarGroupContent>
            <FileBrowserFolderTree />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
