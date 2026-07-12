import { useRef, useState, type SubmitEvent } from "react";
import { Search, X } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks";
import type { Id } from "@convex/_generated/dataModel";
import type { FileSearchSuggestion, SearchScope } from "@/types";

const SUGGESTION_DEBOUNCE_MS = 200;

type FileBrowserSearchProps = {
  currentFolderId: Id<"entries"> | null;
  searchValue: string;
  searchScope: SearchScope;
  isSearchActive: boolean;
  onSearchValueChange: (value: string) => void;
  onSearchScopeChange: (scope: SearchScope) => void;
  onSearchSubmit: (value: string) => void;
  onSearchClear: () => void;
  onSelectFile: (file: FileSearchSuggestion) => void;
};

export default function FileBrowserSearch({
  currentFolderId,
  searchValue,
  searchScope,
  isSearchActive,
  onSearchValueChange,
  onSearchScopeChange,
  onSearchSubmit,
  onSearchClear,
  onSelectFile,
}: FileBrowserSearchProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const normalizedSearchValue = searchValue.trim();
  const canSearch = searchValue.trim().length > 0;
  const shouldShowSuggestions = canSearch && isSuggestionsOpen;
  const debouncedSearchPrefix = useDebounce(
    shouldShowSuggestions ? normalizedSearchValue : "",
    SUGGESTION_DEBOUNCE_MS,
  );
  const shouldQuerySuggestions =
    shouldShowSuggestions &&
    debouncedSearchPrefix.length > 0 &&
    debouncedSearchPrefix === normalizedSearchValue;
  const suggestions = useQuery(
    api.queries.entries.suggestFilesByPrefix,
    shouldQuerySuggestions
      ? {
          scope: searchScope,
          parentId: currentFolderId,
          prefix: debouncedSearchPrefix,
        }
      : "skip",
  );

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSuggestionsOpen(false);
    onSearchSubmit(searchValue);
  };

  return (
    <Popover open={shouldShowSuggestions} onOpenChange={setIsSuggestionsOpen}>
      <PopoverAnchor asChild>
        <form
          ref={formRef}
          className="flex min-w-80 items-center gap-2"
          onSubmit={handleSubmit}
        >
          <div className="relative min-w-0 flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="text"
              value={searchValue}
              placeholder="Search files..."
              className="pr-8 pl-8"
              onFocus={() => {
                if (canSearch) {
                  setIsSuggestionsOpen(true);
                }
              }}
              onChange={(event) => {
                const nextSearchValue = event.target.value;

                onSearchValueChange(nextSearchValue);
                setIsSuggestionsOpen(nextSearchValue.trim().length > 0);
              }}
            />
            {(canSearch || isSearchActive) && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute top-1/2 right-0.5 -translate-y-1/2 text-muted-foreground"
                onClick={() => {
                  setIsSuggestionsOpen(false);
                  onSearchClear();
                }}
                aria-label="Clear search"
              >
                <X aria-hidden="true" className="size-4" />
              </Button>
            )}
          </div>

          <Select
            value={searchScope}
            onValueChange={(value) => {
              onSearchScopeChange(value as SearchScope);
              setIsSuggestionsOpen(canSearch);
            }}
          >
            <SelectTrigger size="sm" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="folder">This folder</SelectItem>
              <SelectItem value="all">All files</SelectItem>
            </SelectContent>
          </Select>

          <Button type="submit" variant="outline" disabled={!canSearch}>
            Search
          </Button>
        </form>
      </PopoverAnchor>

      <PopoverContent
        align="start"
        className="w-[min(32rem,calc(100vw-3rem))] p-0"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
        }}
        onInteractOutside={(event) => {
          const target = event.target;

          if (target instanceof Node && formRef.current?.contains(target)) {
            event.preventDefault();
          }
        }}
      >
        <Command shouldFilter={false}>
          <CommandList>
            {suggestions === undefined ? (
              <CommandEmpty>Searching...</CommandEmpty>
            ) : suggestions.length === 0 ? (
              <CommandEmpty>No files found.</CommandEmpty>
            ) : (
              <CommandGroup heading="Suggestions">
                {suggestions.map((suggestion) => (
                  <CommandItem
                    key={suggestion._id}
                    value={`${suggestion.name}-${suggestion._id}`}
                    onSelect={() => {
                      setIsSuggestionsOpen(false);
                      onSelectFile(suggestion);
                    }}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm">{suggestion.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {suggestion.breadcrumb}
                      </p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
