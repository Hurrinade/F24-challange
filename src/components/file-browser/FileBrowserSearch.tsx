import {
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type SubmitEvent,
} from "react";
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
import { cn } from "@/lib/utils";
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
  onOpenFile: (file: FileSearchSuggestion) => void;
  className?: string;
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
  onOpenFile,
  className,
}: FileBrowserSearchProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const suggestionListId = useId();
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
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
    api.queries.entries.searchFilesByPrefix,
    shouldQuerySuggestions
      ? {
          scope: searchScope,
          parentId: currentFolderId,
          prefix: debouncedSearchPrefix,
          limit: 10,
        }
      : "skip",
  );
  const activeSuggestion = suggestions?.[activeSuggestionIndex];

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSuggestionsOpen(false);
    onSearchSubmit(searchValue);
  };

  const closeSuggestions = () => {
    setIsSuggestionsOpen(false);
    setActiveSuggestionIndex(-1);
  };

  const openSuggestion = (suggestion: FileSearchSuggestion) => {
    closeSuggestions();
    onOpenFile(suggestion);
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!shouldShowSuggestions || !suggestions?.length) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggestionIndex((currentIndex) =>
        currentIndex >= suggestions.length - 1 ? 0 : currentIndex + 1,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestionIndex((currentIndex) =>
        currentIndex <= 0 ? suggestions.length - 1 : currentIndex - 1,
      );
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const suggestion = suggestions[activeSuggestionIndex] ?? suggestions[0];

      openSuggestion(suggestion);
    }
  };

  return (
    <Popover
      open={shouldShowSuggestions}
      onOpenChange={(open) => {
        setIsSuggestionsOpen(open);

        if (!open) {
          setActiveSuggestionIndex(-1);
        }
      }}
    >
      <PopoverAnchor asChild>
        <form
          ref={formRef}
          className={cn("flex min-w-0 flex-1 items-center gap-2", className)}
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
              role="combobox"
              aria-autocomplete="list"
              aria-controls={suggestionListId}
              aria-expanded={shouldShowSuggestions}
              aria-activedescendant={
                activeSuggestion
                  ? `${suggestionListId}-${activeSuggestion._id}`
                  : undefined
              }
              onFocus={() => {
                if (canSearch) {
                  setIsSuggestionsOpen(true);
                }
              }}
              onKeyDown={handleSearchKeyDown}
              onChange={(event) => {
                const nextSearchValue = event.target.value;

                onSearchValueChange(nextSearchValue);
                setIsSuggestionsOpen(nextSearchValue.trim().length > 0);
                setActiveSuggestionIndex(-1);
              }}
            />
            {(canSearch || isSearchActive) && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute top-1/2 right-0.5 -translate-y-1/2 text-muted-foreground"
                onClick={() => {
                  closeSuggestions();
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
              setActiveSuggestionIndex(-1);
            }}
          >
            <SelectTrigger size="sm" className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="folder">This folder</SelectItem>
              <SelectItem value="all">All files</SelectItem>
            </SelectContent>
          </Select>
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
        <Command
          shouldFilter={false}
          value={activeSuggestion?._id ?? ""}
          onValueChange={(value) => {
            setActiveSuggestionIndex(
              suggestions?.findIndex(
                (suggestion) => suggestion._id === value,
              ) ?? -1,
            );
          }}
        >
          <CommandList id={suggestionListId}>
            {suggestions === undefined ? (
              <CommandEmpty>Searching...</CommandEmpty>
            ) : suggestions.length === 0 ? (
              <CommandEmpty>No files found.</CommandEmpty>
            ) : (
              <CommandGroup heading="Suggestions">
                {suggestions.map((suggestion) => (
                  <CommandItem
                    key={suggestion._id}
                    id={`${suggestionListId}-${suggestion._id}`}
                    value={suggestion._id}
                    onSelect={() => {
                      openSuggestion(suggestion);
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
