"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { searchPlacesAction, type PlaceOption } from "@/app/dashboard/places-search-action";

export function PlaceSearchInput({
  initialPlace,
}: {
  initialPlace?: { name: string };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(initialPlace?.name ?? "");
  const [options, setOptions] = useState<PlaceOption[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = query.trim();
    if (!trimmed) {
      setOptions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchPlacesAction(trimmed);
        setOptions(results);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start gap-2 font-normal"
          />
        }
      >
        <SearchIcon className="size-4 shrink-0 opacity-50" />
        <span className={cn(!query && "text-muted-foreground")}>
          {query || "Search by place..."}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-(--anchor-width) p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search places..." value={query} onValueChange={setQuery} />
          <CommandList>
            {searching && (
              <div className="py-6 text-center text-sm text-muted-foreground">Searching...</div>
            )}
            {!searching && query.trim().length === 0 && (
              <CommandEmpty>Start typing a place name.</CommandEmpty>
            )}
            {!searching && query.trim().length > 0 && options.length === 0 && (
              <CommandEmpty>No matching places.</CommandEmpty>
            )}
            {!searching && options.length > 0 && (
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.id}
                    value={option.id}
                    onSelect={() => {
                      setQuery(option.name);
                      setOpen(false);
                      router.push(`/dashboard/search?placeId=${option.id}`);
                    }}
                  >
                    {option.name}
                    {option.isState && (
                      <span className="ml-auto text-xs text-muted-foreground">State</span>
                    )}
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
