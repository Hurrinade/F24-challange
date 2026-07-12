import { v } from "convex/values";
import {
  customCtx,
  customMutation,
} from "convex-helpers/server/customFunctions";
import { mutation as rawMutation } from "../_generated/server";
import { entryTriggers } from "../triggers/entriesTriggers";
import {
  entryParentIdValidator,
  normalizeEntryName,
  validateParentFolder,
  type EntryInput,
} from "../shared/entries";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

const mutation = customMutation(rawMutation, customCtx(entryTriggers.wrapDB));
const acceptedFileMimeTypes = new Set(["application/pdf", "text/plain"]);
const maxFileSizeInBytes = 5 * 1024 * 1024;

async function assertUniqueSiblingName(
  ctx: MutationCtx,
  parentId: Id<"entries"> | null,
  normalizedName: string,
) {
  const existingEntry = await ctx.db
    .query("entries")
    .withIndex("by_parent_normalized_name", (q) =>
      q.eq("parentId", parentId).eq("normalizedName", normalizedName),
    )
    .unique();

  if (existingEntry) {
    throw new Error("An entry with this name already exists in this folder.");
  }
}

async function createEntry(ctx: MutationCtx, input: EntryInput) {
  await validateParentFolder(ctx, input.parentId);
  await assertUniqueSiblingName(ctx, input.parentId, input.normalizedName);

  return await ctx.db.insert("entries", input);
}

export const createFolder = mutation({
  args: {
    parentId: entryParentIdValidator,
    name: v.string(),
  },
  handler: async (ctx, args) => {
    return await createEntry(ctx, {
      ...normalizeEntryName(args.name),
      kind: "folder",
      parentId: args.parentId,
    });
  },
});

export const createFile = mutation({
  args: {
    parentId: entryParentIdValidator,
    name: v.string(),
    storageId: v.id("_storage"),
    mimeType: v.string(),
    size: v.number(),
  },
  handler: async (ctx, args) => {
    let didCreateEntry = false;

    try {
      if (!acceptedFileMimeTypes.has(args.mimeType)) {
        throw new Error("Only PDF and text files are supported.");
      }

      if (args.size < 0) {
        throw new Error("File size is invalid.");
      }

      if (args.size > maxFileSizeInBytes) {
        throw new Error("Files must be 5 MB or smaller.");
      }

      const entryId = await createEntry(ctx, {
        ...normalizeEntryName(args.name),
        kind: "file",
        parentId: args.parentId,
        storageId: args.storageId,
        mimeType: args.mimeType,
        size: args.size,
      });

      didCreateEntry = true;

      return entryId;
    } finally {
      // Safety delete in case the entry was not created successfully. This prevents orphaned storage objects.
      if (!didCreateEntry) {
        await ctx.storage.delete(args.storageId);
      }
    }
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const deleteEntry = mutation({
  args: {
    entryId: v.id("entries"),
  },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.entryId);

    if (!entry) {
      throw new Error("Entry not found.");
    }

    await ctx.db.delete(args.entryId);
  },
});
