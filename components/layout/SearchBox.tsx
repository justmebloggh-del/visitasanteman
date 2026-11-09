import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

/** Plain GET form: works without JavaScript and lands on the /search results page. */
export function SearchBox({ className, defaultValue }: { className?: string; defaultValue?: string }) {
  return (
    <form action="/search" role="search" className={cn("flex gap-2 rounded-full bg-white p-1.5 shadow-lg", className)}>
      <label htmlFor="site-search" className="sr-only">Search attractions, places to stay, food and events</label>
      <input
        id="site-search" name="q" type="search" defaultValue={defaultValue} placeholder="Search attractions, stays, food, events"
        className="min-w-0 flex-1 rounded-full bg-transparent px-4 text-sm text-ink placeholder:text-muted/70 focus:outline-none"
      />
      <button type="submit" className="inline-flex h-11 items-center gap-2 rounded-full bg-forest px-5 text-sm font-medium text-white hover:bg-forest-dark">
        <Search className="size-4" aria-hidden />Search
      </button>
    </form>
  );
}
