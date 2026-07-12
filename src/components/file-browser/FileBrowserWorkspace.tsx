import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { useConvex, useMutation, useQuery } from "convex/react";
import { FolderPlus, Upload } from "lucide-react";
import { toast } from "sonner";
import { api } from "@convex/_generated/api";
import { ThemeToggle } from "@/components";
import FileBrowserBreadcrumbs from "@/components/file-browser/FileBrowserBreadcrumbs";
import FileBrowserEntryList from "@/components/file-browser/FileBrowserEntryList";
import { Button } from "@/components/ui/button";
import { useModal } from "@/hooks/modals/use-modal";
import { cn } from "@/lib/utils";
import { ROOT_FOLDER_ENTRIES_KEY, useFileBrowserStore } from "@/stores";
import type { Id } from "@convex/_generated/dataModel";
import type { AcceptedUploadMimeType, EntryListItem } from "@/types";

const acceptedUploadMimeTypes: AcceptedUploadMimeType[] = [
  "application/pdf",
  "text/plain",
];

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function isAcceptedUploadFile(file: File) {
  return acceptedUploadMimeTypes.includes(file.type as AcceptedUploadMimeType);
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

export default function FileBrowserWorkspace() {
  const { folderId } = useParams<{ folderId?: string }>();
  const currentFolderId = (folderId ?? null) as Id<"entries"> | null;
  const { openModal } = useModal();
  const convex = useConvex();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragDepthRef = useRef(0);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const breadcrumbs = useQuery(api.queries.entries.getBreadcrumbs, {
    folderId: currentFolderId,
  });
  const entries = useQuery(api.queries.entries.listChildren, {
    parentId: currentFolderId,
  });
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
  const visibleEntries = entries ?? cachedEntries;

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

    const acceptedFiles = files.filter(isAcceptedUploadFile);
    const skippedCount = files.length - acceptedFiles.length;

    if (skippedCount > 0) {
      toast.error(
        `${skippedCount} file${skippedCount === 1 ? "" : "s"} skipped. Only PDF and text files are supported.`,
      );
    }

    if (acceptedFiles.length === 0) {
      return;
    }

    setIsUploading(true);

    let uploadedCount = 0;

    try {
      for (const file of acceptedFiles) {
        try {
          await uploadSingleFile(file);
          uploadedCount += 1;
        } catch (error) {
          toast.error(`${file.name}: ${getErrorMessage(error)}`);
        }
      }

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

      <header className="flex min-h-16 items-center justify-between gap-4 border-b border-border px-6 py-3">
        <div className="min-w-0 space-y-1">
          <FileBrowserBreadcrumbs breadcrumbs={visibleBreadcrumbs} />
          <h1 className="truncate text-lg font-semibold">
            {currentFolderName}
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={openCreateFolderModal}
          >
            <FolderPlus aria-hidden="true" className="size-4" />
            New folder
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={openUploadPicker}
            disabled={isUploading}
          >
            <Upload aria-hidden="true" className="size-4" />
            {isUploading ? "Uploading..." : "Upload files"}
          </Button>
          <ThemeToggle />
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
      />
    </section>
  );
}
