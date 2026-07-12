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

function getPrefixEnd(prefix: string) {
  return `${prefix}\uffff`;
}

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

async function getBreadcrumbItems(
  ctx: QueryCtx,
  folderId: Id<"entries"> | null,
) {
  const folders: Doc<"entries">[] = [];
  let currentFolderId = folderId;

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
}

function formatBreadcrumb(
  breadcrumbs: Awaited<ReturnType<typeof getBreadcrumbItems>>,
) {
  return breadcrumbs.map((breadcrumb) => breadcrumb.name).join(" / ");
}

async function withBreadcrumb(ctx: QueryCtx, entries: Doc<"entries">[]) {
  return await Promise.all(
    entries.map(async (entry) => ({
      ...entry,
      breadcrumb: formatBreadcrumb(
        await getBreadcrumbItems(ctx, entry.parentId),
      ),
    })),
  );
}

async function searchFilesByNormalizedPrefix(
  ctx: QueryCtx,
  scope: "folder" | "all",
  parentId: Id<"entries"> | null,
  normalizedPrefix: string,
  limit?: number,
) {
  if (scope === "folder") {
    await validateParentFolder(ctx, parentId);

    const query = ctx.db
      .query("entries")
      .withIndex("by_parent_kind_normalized_name", (q) =>
        q
          .eq("parentId", parentId)
          .eq("kind", "file")
          .gte("normalizedName", normalizedPrefix)
          .lt("normalizedName", getPrefixEnd(normalizedPrefix)),
      )
      .order("asc");

    return limit === undefined
      ? await query.collect()
      : await query.take(limit);
  }

  const query = ctx.db
    .query("entries")
    .withIndex("by_kind_normalized_name", (q) =>
      q
        .eq("kind", "file")
        .gte("normalizedName", normalizedPrefix)
        .lt("normalizedName", getPrefixEnd(normalizedPrefix)),
    )
    .order("asc");

  return limit === undefined ? await query.collect() : await query.take(limit);
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
    return await getBreadcrumbItems(ctx, args.folderId);
  },
});

// Get file url from convex file storage
export const getFileUrl = query({
  args: {
    entryId: v.id("entries"),
  },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.entryId);

    if (!entry) {
      throw new Error("File not found.");
    }

    if (entry.kind !== "file") {
      throw new Error("Entry is not a file.");
    }

    if (!entry.storageId) {
      throw new Error("File has no uploaded content.");
    }

    return await ctx.storage.getUrl(entry.storageId);
  },
});

export const searchFilesByPrefix = query({
  args: {
    scope: v.union(v.literal("folder"), v.literal("all")),
    parentId: entryParentIdValidator,
    prefix: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const normalizedPrefix = args.prefix.trim().toLowerCase();

    if (!normalizedPrefix) {
      return [];
    }

    const files = await searchFilesByNormalizedPrefix(
      ctx,
      args.scope,
      args.parentId,
      normalizedPrefix,
      args.limit,
    );

    return await withBreadcrumb(ctx, files);
  },
});
