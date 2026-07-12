import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  entries: defineTable({
    name: v.string(),
    normalizedName: v.string(), // Stored for indexing
    kind: v.union(v.literal("folder"), v.literal("file")),
    parentId: v.union(v.id("entries"), v.null()),
    storageId: v.optional(v.id("_storage")),
    mimeType: v.optional(v.string()),
    size: v.optional(v.number()),
  })
    .index("by_parent_normalized_name", ["parentId", "normalizedName"])
    .index("by_parent_kind_normalized_name", [
      "parentId",
      "kind",
      "normalizedName",
    ])
    .index("by_kind_normalized_name", ["kind", "normalizedName"])
    .index("by_parent", ["parentId"]),
});
