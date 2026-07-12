import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { useQuery } from "convex/react";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  HardDrive,
} from "lucide-react";
import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { ROOT_FOLDER_ENTRIES_KEY, useFileBrowserStore } from "@/stores";
import type { Id } from "@convex/_generated/dataModel";
import type { EntryListItem } from "@/types";

type FolderNodeProps = {
  folder: EntryListItem;
  level: number;
  activeFolderIds: ReadonlySet<Id<"entries">>;
};

function FolderTreeIndent({ level }: { level: number }) {
  if (level <= 0) {
    return null;
  }

  return Array.from({ length: level }).map((_, index) => (
    <span key={index} aria-hidden="true" className="w-3 shrink-0" />
  ));
}

function getFolderPath(folderId: Id<"entries">) {
  return `/folders/${folderId}`;
}

function FolderNode({ folder, level, activeFolderIds }: FolderNodeProps) {
  const { folderId } = useParams<{ folderId?: string }>();
  const [isManuallyExpanded, setIsManuallyExpanded] = useState(false);
  const isActivePathFolder = activeFolderIds.has(folder._id);
  const isExpanded = isManuallyExpanded || isActivePathFolder;
  const childFolders = useQuery(
    api.queries.entries.listFolders,
    isExpanded ? { parentId: folder._id } : "skip",
  );
  const isActive = folderId === folder._id;
  const hasLoadedChildren =
    childFolders !== undefined && childFolders.length > 0;
  const FolderIcon = isExpanded ? FolderOpen : Folder;

  return (
    <li>
      <div className="flex items-center gap-1">
        <FolderTreeIndent level={level} />
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="size-6 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => {
            setIsManuallyExpanded((current) => !current);
          }}
          aria-label={isExpanded ? "Collapse folder" : "Expand folder"}
        >
          {isExpanded ? (
            <ChevronDown aria-hidden="true" className="size-3.5" />
          ) : (
            <ChevronRight aria-hidden="true" className="size-3.5" />
          )}
        </Button>

        <Link
          to={getFolderPath(folder._id)}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-ring",
            isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
          )}
        >
          <FolderIcon aria-hidden="true" className="size-4 shrink-0" />
          <span className="truncate">{folder.name}</span>
        </Link>
      </div>

      {isExpanded && (
        <ul className="mt-0.5 space-y-0.5">
          {childFolders === undefined && (
            <li className="flex items-center gap-1 py-1.5 text-xs text-muted-foreground">
              <FolderTreeIndent level={level + 1} />
              <span aria-hidden="true" className="w-6 shrink-0" />
              <Spinner className="size-3.5" />
            </li>
          )}
          {childFolders !== undefined && !hasLoadedChildren && (
            <li className="flex items-center gap-1 py-1.5 text-xs text-muted-foreground">
              <FolderTreeIndent level={level + 1} />
              <span aria-hidden="true" className="w-6 shrink-0" />
              <span className="px-2">Empty</span>
            </li>
          )}
          {childFolders?.map((childFolder) => (
            <FolderNode
              key={childFolder._id}
              folder={childFolder}
              level={level + 1}
              activeFolderIds={activeFolderIds}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function FileBrowserFolderTree() {
  const { folderId } = useParams<{ folderId?: string }>();
  const currentFolderId = (folderId ?? null) as Id<"entries"> | null;
  const currentFolderKey = currentFolderId ?? ROOT_FOLDER_ENTRIES_KEY;
  const breadcrumbs = useQuery(
    api.queries.entries.getBreadcrumbs,
    currentFolderId == null ? "skip" : { folderId: currentFolderId },
  );
  const rootFolders = useQuery(api.queries.entries.listFolders, {
    parentId: null,
  });
  const cachedBreadcrumbs = useFileBrowserStore(
    (state) => state.breadcrumbsByFolderId[currentFolderKey],
  );
  const setFolderBreadcrumbs = useFileBrowserStore(
    (state) => state.setFolderBreadcrumbs,
  );
  const isRootActive = !folderId;
  const visibleBreadcrumbs = breadcrumbs ?? cachedBreadcrumbs;
  const activeFolderIds = useMemo(() => {
    const folderIds =
      visibleBreadcrumbs?.flatMap((breadcrumb) =>
        breadcrumb.entryId == null ? [] : [breadcrumb.entryId],
      ) ?? [];

    return new Set(folderIds);
  }, [visibleBreadcrumbs]);

  useEffect(() => {
    if (breadcrumbs === undefined) {
      return;
    }

    setFolderBreadcrumbs(currentFolderKey, breadcrumbs);
  }, [breadcrumbs, currentFolderKey, setFolderBreadcrumbs]);

  return (
    <nav aria-label="Folder navigation">
      <Link
        to="/"
        className={cn(
          "mb-1 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-ring",
          isRootActive && "bg-sidebar-accent text-sidebar-accent-foreground",
        )}
      >
        <HardDrive aria-hidden="true" className="size-4 shrink-0" />
        <span className="truncate">All files</span>
      </Link>

      {rootFolders === undefined && (
        <p className="px-2 py-3 text-sm text-muted-foreground">Loading...</p>
      )}

      {rootFolders !== undefined && rootFolders.length === 0 && (
        <p className="px-2 py-3 text-sm leading-5 text-muted-foreground">
          No folders yet.
        </p>
      )}

      {rootFolders !== undefined && rootFolders.length > 0 && (
        <ul className="space-y-0.5">
          {rootFolders.map((folder) => (
            <FolderNode
              key={folder._id}
              folder={folder}
              level={0}
              activeFolderIds={activeFolderIds}
            />
          ))}
        </ul>
      )}
    </nav>
  );
}
