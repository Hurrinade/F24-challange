import { Link } from "react-router";
import { ChevronRight } from "lucide-react";
import type { Id } from "@convex/_generated/dataModel";

type BreadcrumbItem = {
  entryId: Id<"entries"> | null;
  name: string;
};

type FileBrowserBreadcrumbsProps = {
  breadcrumbs: BreadcrumbItem[] | undefined;
};

function getBreadcrumbHref(entryId: Id<"entries"> | null) {
  return entryId == null ? "/" : `/folders/${entryId}`;
}

export default function FileBrowserBreadcrumbs({
  breadcrumbs,
}: FileBrowserBreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
        {breadcrumbs ? (
          breadcrumbs.map((breadcrumb, index) => {
            const isLast = index === breadcrumbs.length - 1;

            return (
              <li
                key={breadcrumb.entryId ?? "root"}
                className="flex min-w-0 items-center gap-1"
              >
                {index > 0 && (
                  <ChevronRight aria-hidden="true" className="size-3.5" />
                )}

                {isLast ? (
                  <span className="truncate font-medium text-foreground">
                    {breadcrumb.name}
                  </span>
                ) : (
                  <Link
                    to={getBreadcrumbHref(breadcrumb.entryId)}
                    className="truncate rounded-sm outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {breadcrumb.name}
                  </Link>
                )}
              </li>
            );
          })
        ) : (
          <li className="flex min-w-0 items-center gap-1">
            <ChevronRight aria-hidden="true" className="size-3.5" />
          </li>
        )}
      </ol>
    </nav>
  );
}
