import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { useConvex, useMutation, useQuery } from "convex/react";
import { FolderPlus, Upload } from "lucide-react";
import { toast } from "sonner";
import { api } from "@convex/_generated/api";
import FileBrowserBreadcrumbs from "@/components/file-browser/FileBrowserBreadcrumbs";
import FileBrowserEntryList from "@/components/file-browser/FileBrowserEntryList";
import FileBrowserSearch from "@/components/file-browser/FileBrowserSearch";
import { Button } from "@/components/ui/button";
import { useModal } from "@/hooks/modals/use-modal";
import { cn } from "@/lib/utils";
import { ROOT_FOLDER_ENTRIES_KEY, useFileBrowserStore } from "@/stores";
import type { Id } from "@convex/_generated/dataModel";
import type {
  AcceptedUploadMimeType,
  EntryListItem,
  FileSearchSuggestion,
  SearchScope,
} from "@/types";

const acceptedUploadMimeTypes: AcceptedUploadMimeType[] = [
  "application/pdf",
  "text/plain",
];
const maxUploadFileSizeInBytes = 5 * 1024 * 1024;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function isAcceptedUploadFile(file: File) {
  return acceptedUploadMimeTypes.includes(file.type as AcceptedUploadMimeType);
}

function isAllowedUploadFileSize(file: File) {
  return file.size <= maxUploadFileSizeInBytes;
}

function hasDraggedFiles(event: React.DragEvent<HTMLElement>) {
  return Array.from(event.dataTransfer.types).includes("Files");
}

function getUploadResponse(value: { storageId: Id<"_storage"> } | undefined): {
  storageId: Id<"_storage">;
} {
  if (value != null) {
    return {
      storageId: value.storageId as Id<"_storage">,
    };
  }

  throw new Error("Upload response is invalid.");
}

function getFolderPath(parentId: Id<"entries"> | null) {
  return parentId == null ? "/" : `/folders/${parentId}`;
}

export default function FileBrowserWorkspace() {
  const { folderId } = useParams<{ folderId?: string }>();
  const currentFolderId = (folderId ?? null) as Id<"entries"> | null;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { openModal } = useModal();
  const convex = useConvex();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragDepthRef = useRef(0);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchScope, setSearchScope] = useState<SearchScope>("folder");
  const [submittedSearchPrefix, setSubmittedSearchPrefix] = useState("");
  const breadcrumbs = useQuery(api.queries.entries.getBreadcrumbs, {
    folderId: currentFolderId,
  });
  const entries = useQuery(api.queries.entries.listChildren, {
    parentId: currentFolderId,
  });
  const isSearchActive = submittedSearchPrefix.length > 0;
  const searchResults = useQuery(
    api.queries.entries.searchFilesByPrefix,
    isSearchActive
      ? {
          scope: searchScope,
          parentId: currentFolderId,
          prefix: submittedSearchPrefix,
        }
      : "skip",
  );
  const currentFolderKey = currentFolderId ?? ROOT_FOLDER_ENTRIES_KEY;
  const cachedEntries = useFileBrowserStore(
    (state) => state.entriesByFolderId[currentFolderKey],
  );
  const cachedBreadcrumbs = useFileBrowserStore(
    (state) => state.breadcrumbsByFolderId[currentFolderKey],
  );
  const setFolderEntries = useFileBrowserStore(
    (state) => state.setFolderEntries,
  );
  const setFolderBreadcrumbs = useFileBrowserStore(
    (state) => state.setFolderBreadcrumbs,
  );
  const createFolder = useMutation(api.mutations.entries.createFolder);
  const createFile = useMutation(api.mutations.entries.createFile);
  const deleteEntry = useMutation(api.mutations.entries.deleteEntry);
  const generateUploadUrl = useMutation(
    api.mutations.entries.generateUploadUrl,
  );

  const visibleBreadcrumbs = breadcrumbs ?? cachedBreadcrumbs;
  const currentFolderName = visibleBreadcrumbs?.at(-1)?.name ?? "";
  const visibleEntries = isSearchActive
    ? searchResults
    : (entries ?? cachedEntries);
  const selectedFileId = searchParams.get("selectedFile");

  // Cache entries in store for better UX
  useEffect(() => {
    if (entries === undefined) {
      return;
    }

    setFolderEntries(currentFolderKey, entries);
  }, [currentFolderKey, entries, setFolderEntries]);

  useEffect(() => {
    if (breadcrumbs === undefined) {
      return;
    }

    setFolderBreadcrumbs(currentFolderKey, breadcrumbs);
  }, [breadcrumbs, currentFolderKey, setFolderBreadcrumbs]);

  const openCreateFolderModal = () => {
    openModal("createFolder", {
      title: "New folder",
      description: `Create a folder in ${currentFolderName}.`,
      label: "Folder name",
      submitText: "Create folder",
      onSubmit: async (name) => {
        try {
          await createFolder({
            parentId: currentFolderId,
            name,
          });
          toast.success("Folder created.");
        } catch (error) {
          toast.error(getErrorMessage(error));
          throw error;
        }
      },
    });
  };

  const openDeleteModal = (entry: EntryListItem) => {
    openModal("confirm", {
      title: `Delete ${entry.kind}`,
      message: `Delete "${entry.name}" permanently?`,
      confirmText: "Delete",
      variant: "danger",
      onConfirm: async () => {
        try {
          await deleteEntry({
            entryId: entry._id,
          });
          toast.success(
            entry.kind === "folder" ? "Folder deleted." : "File deleted.",
          );
        } catch (error) {
          toast.error(getErrorMessage(error));
          throw error;
        }
      },
    });
  };

  const uploadSingleFile = async (file: File) => {
    const uploadUrl = await generateUploadUrl({});
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error("File upload failed.");
    }

    const { storageId } = getUploadResponse(await uploadResponse.json());

    await createFile({
      parentId: currentFolderId,
      name: file.name,
      storageId,
      mimeType: file.type,
      size: file.size,
    });
  };

  const uploadFiles = async (files: File[]) => {
    if (isUploading || files.length === 0) {
      return;
    }

    const acceptedTypeFiles = files.filter(isAcceptedUploadFile);
    const unsupportedTypeCount = files.length - acceptedTypeFiles.length;

    if (unsupportedTypeCount > 0) {
      toast.error(
        `${unsupportedTypeCount} file${unsupportedTypeCount === 1 ? "" : "s"} skipped. Only PDF and text files are supported.`,
      );
    }

    const acceptedFiles = acceptedTypeFiles.filter(isAllowedUploadFileSize);
    const oversizedCount = acceptedTypeFiles.length - acceptedFiles.length;

    if (oversizedCount > 0) {
      toast.error(
        `${oversizedCount} file${oversizedCount === 1 ? "" : "s"} skipped. Files must be 5 MB or smaller.`,
      );
    }

    if (acceptedFiles.length === 0) {
      return;
    }

    setIsUploading(true);

    try {
      const uploadResults = await Promise.all(
        acceptedFiles.map(async (file) => {
          try {
            await uploadSingleFile(file);
            return { file, isUploaded: true };
          } catch (error) {
            return { file, isUploaded: false, error };
          }
        }),
      );

      const uploadedCount = uploadResults.filter(
        (result) => result.isUploaded,
      ).length;

      uploadResults
        .filter((result) => !result.isUploaded)
        .forEach((result) => {
          toast.error(`${result.file.name}: ${getErrorMessage(result.error)}`);
        });

      if (uploadedCount > 0) {
        toast.success(
          `${uploadedCount} file${uploadedCount === 1 ? "" : "s"} uploaded.`,
        );
      }
    } finally {
      setIsUploading(false);
    }
  };

  const openUploadPicker = () => {
    fileInputRef.current?.click();
  };

  const selectFile = (file: FileSearchSuggestion) => {
    const nextSearchParams = new URLSearchParams({
      selectedFile: file._id,
    });

    setSearchValue("");
    setSubmittedSearchPrefix("");
    navigate(`${getFolderPath(file.parentId)}?${nextSearchParams.toString()}`);
  };

  const submitSearch = (value: string) => {
    const trimmedValue = value.trim();

    setSearchParams({});
    setSubmittedSearchPrefix(trimmedValue);
    setSearchValue(trimmedValue);
  };

  const clearSearch = () => {
    setSearchValue("");
    setSubmittedSearchPrefix("");
    setSearchParams({});
  };

  // To open file in another tab
  const openFile = async (entry: EntryListItem) => {
    if (!entry.storageId) {
      toast.error("This file has no uploaded content.");
      return;
    }

    try {
      const fileUrl = await convex.query(api.queries.entries.getFileUrl, {
        entryId: entry._id,
      });

      if (!fileUrl) {
        throw new Error("File URL is unavailable.");
      }

      window.open(fileUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleDragEnter = (event: React.DragEvent<HTMLElement>) => {
    if (!hasDraggedFiles(event)) {
      return;
    }

    event.preventDefault();
    dragDepthRef.current += 1;
    setIsDragActive(true);
  };

  const handleDragOver = (event: React.DragEvent<HTMLElement>) => {
    if (!hasDraggedFiles(event)) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  };

  const handleDragLeave = (event: React.DragEvent<HTMLElement>) => {
    if (!hasDraggedFiles(event)) {
      return;
    }

    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);

    if (dragDepthRef.current === 0) {
      setIsDragActive(false);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLElement>) => {
    if (!hasDraggedFiles(event)) {
      return;
    }

    event.preventDefault();
    dragDepthRef.current = 0;
    setIsDragActive(false);

    void uploadFiles(Array.from(event.dataTransfer.files));
  };

  return (
    <section
      className={cn(
        "relative flex h-full min-w-0 flex-col bg-background",
        isDragActive && "bg-primary/5",
      )}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedUploadMimeTypes.join(",")}
        multiple
        className="sr-only"
        onChange={(event) => {
          void uploadFiles(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />

      {isDragActive && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 border-2 border-dashed border-primary/60 bg-primary/5"
        />
      )}

      <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 md:px-6">
        <div className="min-w-0 flex-1 space-y-1">
          <FileBrowserBreadcrumbs breadcrumbs={visibleBreadcrumbs} />
          <h1 className="truncate text-lg font-semibold">
            {currentFolderName}
          </h1>
        </div>

        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2">
          <FileBrowserSearch
            className="min-w-64 basis-80 md:max-w-xl"
            currentFolderId={currentFolderId}
            searchValue={searchValue}
            searchScope={searchScope}
            isSearchActive={isSearchActive}
            onSearchValueChange={(value) => {
              setSearchValue(value);

              if (!value.trim()) {
                setSubmittedSearchPrefix("");
                setSearchParams({});
              }
            }}
            onSearchScopeChange={setSearchScope}
            onSearchSubmit={submitSearch}
            onSearchClear={clearSearch}
            onSelectFile={selectFile}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-w-30"
            onClick={openCreateFolderModal}
          >
            <FolderPlus aria-hidden="true" className="size-4" />
            New folder
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-w-30"
            onClick={openUploadPicker}
            disabled={isUploading}
          >
            <Upload aria-hidden="true" className="size-4" />
            {isUploading ? "Uploading..." : "Upload files"}
          </Button>
        </div>
      </header>

      <FileBrowserEntryList
        entries={visibleEntries}
        onDeleteEntry={openDeleteModal}
        onOpenFile={(entry) => {
          void openFile(entry);
        }}
        onUploadClick={openUploadPicker}
        isDragActive={isDragActive}
        isUploading={isUploading}
        selectedFileId={selectedFileId}
        variant={isSearchActive ? "search" : "browse"}
        searchTerm={submittedSearchPrefix}
      />
    </section>
  );
}
