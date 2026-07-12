import { create } from "zustand";
import type { FileBrowserStoreState } from "@/types";

export const ROOT_FOLDER_ENTRIES_KEY = "root";

export const useFileBrowserStore = create<FileBrowserStoreState>((set) => ({
  entriesByFolderId: {},
  breadcrumbsByFolderId: {},
  setFolderEntries: (folderId, entries) => {
    set((state) => ({
      entriesByFolderId: {
        ...state.entriesByFolderId,
        [folderId]: entries,
      },
    }));
  },
  setFolderBreadcrumbs: (folderId, breadcrumbs) => {
    set((state) => ({
      breadcrumbsByFolderId: {
        ...state.breadcrumbsByFolderId,
        [folderId]: breadcrumbs,
      },
    }));
  },
}));
