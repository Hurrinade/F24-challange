import { Triggers } from "convex-helpers/server/triggers";
import type { DataModel } from "../_generated/dataModel";

export const entryTriggers = new Triggers<DataModel>();

entryTriggers.register("entries", async (ctx, change) => {
  if (change.operation !== "delete") {
    return;
  }

  const children = await ctx.db
    .query("entries")
    .withIndex("by_parent", (q) => q.eq("parentId", change.id))
    .collect();

  for (const child of children) {
    await ctx.db.delete(child._id);
  }
});
