import { useNavigate } from "react-router";
import { FileText, Folder, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { EntryListItem } from "@/types";

type FileBrowserEntryListProps = {
  entries: EntryListItem[] | undefined;
  onDeleteEntry: (entry: EntryListItem) => void;
  onOpenFile: (entry: EntryListItem) => void;
  onUploadClick: () => void;
  isDragActive: boolean;
  isUploading: boolean;
  selectedFileId?: string | null;
  variant?: "browse" | "search";
  searchTerm?: string;
};

function getFolderPath(entry: EntryListItem) {
  return `/folders/${entry._id}`;
}

function getEntrySubtitle(entry: EntryListItem) {
  if ("breadcrumb" in entry) {
    return entry.breadcrumb as string;
  }

  return entry.kind === "folder" ? entry.kind : (entry.mimeType ?? entry.kind);
}

export default function FileBrowserEntryList({
  entries,
  onDeleteEntry,
  onOpenFile,
  onUploadClick,
  isDragActive,
  isUploading,
  selectedFileId,
  variant = "browse",
  searchTerm,
}: FileBrowserEntryListProps) {
  const navigate = useNavigate();

  if (entries === undefined) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (entries.length === 0) {
    if (variant === "search") {
      return (
        <div className="flex min-h-0 flex-1 items-center justify-center p-6 text-center">
          <div className="space-y-2">
            <h2 className="text-sm font-medium">No matching files</h2>
            <p className="text-sm text-muted-foreground">
              No files are named {searchTerm ? `"${searchTerm}"` : "that"}.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-6">
        <div
          className={cn(
            "flex w-full max-w-md flex-col items-center gap-4 rounded-lg border border-dashed border-border bg-muted/20 px-6 py-10 text-center",
            isDragActive && "border-primary bg-primary/5",
          )}
        >
          <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Upload aria-hidden="true" className="size-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-medium">Drop PDF or text files here</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Drag files into this folder, or use the upload button.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={onUploadClick}
            disabled={isUploading}
          >
            <Upload aria-hidden="true" className="size-4" />
            {isUploading ? "Uploading..." : "Choose files"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      {variant === "search" && (
        <div className="border-b border-border px-6 py-2 text-sm text-muted-foreground">
          Files named {searchTerm ? `"${searchTerm}"` : "search text"}
        </div>
      )}
      <div className="divide-y divide-border border-y border-border">
        {entries.map((entry) => {
          const isFolder = entry.kind === "folder";
          const EntryIcon = isFolder ? Folder : FileText;
          const isSelected = !isFolder && entry._id === selectedFileId;

          return (
            <div
              key={entry._id}
              className={cn(
                "flex min-h-12 items-center gap-3 px-6 py-2 hover:bg-muted/50",
                "cursor-pointer",
                isSelected && "bg-primary/10 hover:bg-primary/10",
              )}
              onClick={() => {
                if (isFolder) {
                  navigate(getFolderPath(entry));
                  return;
                }

                onOpenFile(entry);
              }}
            >
              <EntryIcon
                aria-hidden="true"
                className={cn(
                  "size-4 shrink-0",
                  isFolder ? "text-primary" : "text-muted-foreground",
                )}
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{entry.name}</p>
                <p className="text-xs capitalize text-muted-foreground">
                  {getEntrySubtitle(entry)}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDeleteEntry(entry);
                  }}
                  aria-label={`Delete ${entry.name}`}
                  title="Delete"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
