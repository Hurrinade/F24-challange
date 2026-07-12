import { Link } from "react-router";
import { Button } from "@/components/ui/button";

export default function Root() {
  return (
    <main className="flex h-full w-full items-center justify-center overflow-y-auto p-6">
      <div className="flex max-w-2xl flex-col gap-6 rounded-3xl border border-border bg-card p-8 text-card-foreground shadow-sm">
        <div className="space-y-3">
          <span className="inline-flex w-fit rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            React Vite Template
          </span>
          <h1 className="text-3xl font-semibold tracking-tight">
            Root page example for future projects
          </h1>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link to="/home">Open authenticated home</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/settings">Open settings</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/public">Open public route example</Link>
          </Button>

          <Button variant="ghost" asChild>
            <Link to="/public">Open public route example</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
