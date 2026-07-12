import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

const MAX_ENTRY_NAME_LENGTH = 255;

export const ROOT_BREADCRUMB_NAME = "All files";
export const entryParentIdValidator = v.union(v.id("entries"), v.null());

export type EntryKind = "folder" | "file";

export type EntryInput = {
  name: string;
  normalizedName: string;
  kind: EntryKind;
  parentId: Id<"entries"> | null;
  storageId?: Id<"_storage">;
  mimeType?: string;
  size?: number;
};

export function normalizeEntryName(name: string) {
  const trimmedName = name.trim();
  const normalizedName = trimmedName.toLowerCase();

  if (
    !trimmedName ||
    trimmedName.length > MAX_ENTRY_NAME_LENGTH ||
    trimmedName.includes("/") ||
    trimmedName.includes("\\") ||
    trimmedName === "." ||
    trimmedName === ".."
  ) {
    throw new Error("Invalid entry name.");
  }

  return {
    name: trimmedName,
    normalizedName,
  };
}

export async function getRequiredFolder(
  ctx: QueryCtx | MutationCtx,
  folderId: Id<"entries">,
) {
  const folder = await ctx.db.get(folderId);

  if (!folder) {
    throw new Error("Folder not found.");
  }

  if (folder.kind !== "folder") {
    throw new Error("Entry is not a folder.");
  }

  return folder;
}

export async function validateParentFolder(
  ctx: QueryCtx | MutationCtx,
  parentId: Id<"entries"> | null,
) {
  if (parentId === null) {
    return;
  }

  const parent = await ctx.db.get(parentId);

  if (!parent) {
    throw new Error("Parent folder not found.");
  }

  if (parent.kind !== "folder") {
    throw new Error("Parent entry must be a folder.");
  }
}
