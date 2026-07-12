import { File } from "lucide-react";
import { ThemeToggle } from "@/components";

export default function FileBrowserWorkspace() {
  return (
    <section className="flex h-full min-w-0 flex-col bg-background">
      <header className="flex min-h-16 items-center justify-between gap-4 border-b border-border px-6 py-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">Workspace</p>
          <h1 className="truncate text-lg font-semibold">All files</h1>
        </div>
        <ThemeToggle />
      </header>

      <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-6">
        <div className="flex max-w-sm flex-col items-center gap-3 text-center">
          <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <File aria-hidden="true" className="size-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-medium">No files yet</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Files and folders will appear here after they are created.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
