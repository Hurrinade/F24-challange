import type { Id } from "@convex/_generated/dataModel";

export type EntryKind = "folder" | "file";

export type EntryListItem = {
  _id: Id<"entries">;
  _creationTime: number;
  name: string;
  normalizedName: string;
  kind: EntryKind;
  parentId: Id<"entries"> | null;
  storageId?: Id<"_storage">;
  mimeType?: string;
  size?: number;
};

export type CreateEntryModalPayload = {
  title: string;
  description: string;
  label: string;
  submitText: string;
  onSubmit: (name: string) => void | Promise<void>;
};

export type AcceptedUploadMimeType = "application/pdf" | "text/plain";

export type SearchScope = "folder" | "all";

export type FileSearchResult = EntryListItem & {
  breadcrumb: string;
};

export type FileSearchSuggestion = FileSearchResult;

export type FileBrowserBreadcrumbItem = {
  entryId: Id<"entries"> | null;
  name: string;
};

export type FileBrowserEntriesByFolderId = Record<string, EntryListItem[]>;

export type FileBrowserBreadcrumbsByFolderId = Record<
  string,
  FileBrowserBreadcrumbItem[]
>;

export type FileBrowserStoreState = {
  entriesByFolderId: FileBrowserEntriesByFolderId;
  breadcrumbsByFolderId: FileBrowserBreadcrumbsByFolderId;
  setFolderEntries: (folderId: string, entries: EntryListItem[]) => void;
  setFolderBreadcrumbs: (
    folderId: string,
    breadcrumbs: FileBrowserBreadcrumbItem[],
  ) => void;
};
