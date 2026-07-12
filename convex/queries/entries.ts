import { v } from "convex/values";
import { query } from "../_generated/server";
import {
  entryParentIdValidator,
  getRequiredFolder,
  ROOT_BREADCRUMB_NAME,
  validateParentFolder,
  type EntryKind,
} from "../shared/entries";
import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

async function listEntriesByKind(
  ctx: QueryCtx,
  parentId: Id<"entries"> | null,
  kind: EntryKind,
) {
  return await ctx.db
    .query("entries")
    .withIndex("by_parent_kind_normalized_name", (q) =>
      q.eq("parentId", parentId).eq("kind", kind),
    )
    .order("asc")
    .collect();
}

export const listChildren = query({
  args: {
    parentId: entryParentIdValidator,
  },
  handler: async (ctx, args) => {
    await validateParentFolder(ctx, args.parentId);

    const folders = await listEntriesByKind(ctx, args.parentId, "folder");
    const files = await listEntriesByKind(ctx, args.parentId, "file");

    return [...folders, ...files];
  },
});

export const listFolders = query({
  args: {
    parentId: entryParentIdValidator,
  },
  handler: async (ctx, args) => {
    await validateParentFolder(ctx, args.parentId);

    return await listEntriesByKind(ctx, args.parentId, "folder");
  },
});

export const getFolder = query({
  args: {
    folderId: v.id("entries"),
  },
  handler: async (ctx, args) => {
    return await getRequiredFolder(ctx, args.folderId);
  },
});

export const getBreadcrumbs = query({
  args: {
    folderId: entryParentIdValidator,
  },
  handler: async (ctx, args) => {
    const folders: Doc<"entries">[] = [];
    let currentFolderId = args.folderId;

    while (currentFolderId !== null) {
      const folder = await getRequiredFolder(ctx, currentFolderId);

      folders.push(folder);
      currentFolderId = folder.parentId;
    }

    return [
      {
        entryId: null,
        name: ROOT_BREADCRUMB_NAME,
      },
      ...folders.reverse().map((folder) => ({
        entryId: folder._id,
        name: folder.name,
      })),
    ];
  },
});
