"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronsUpDownIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { searchPlacesAction, type PlaceOption } from "@/app/dashboard/places-search-action";

export interface PlaceComboboxValue {
  id?: string;
  name: string;
  isState: boolean;
}

export function PlaceCombobox({
  defaultValue,
}: {
  defaultValue?: PlaceComboboxValue;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(defaultValue?.name ?? "");
  const [options, setOptions] = useState<PlaceOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<PlaceComboboxValue | null>(defaultValue ?? null);
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

  const trimmedQuery = query.trim();
  const hasExactMatch = options.some(
    (option) => option.name.toLowerCase() === trimmedQuery.toLowerCase()
  );

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between font-normal"
            />
          }
        >
          <span className={cn(!selected && "text-muted-foreground")}>
            {selected ? selected.name : "Search or add a place..."}
          </span>
          <ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" />
        </PopoverTrigger>
        <PopoverContent className="w-(--anchor-width) p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search places..."
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              {searching && (
                <div className="py-6 text-center text-sm text-muted-foreground">Searching...</div>
              )}
              {!searching && options.length === 0 && trimmedQuery.length === 0 && (
                <CommandEmpty>Start typing to search places.</CommandEmpty>
              )}
              {!searching && options.length > 0 && (
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      key={option.id}
                      value={option.id}
                      onSelect={() => {
                        setSelected({ id: option.id, name: option.name, isState: option.isState });
                        setQuery(option.name);
                        setOpen(false);
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
              {!searching && trimmedQuery.length >= 2 && !hasExactMatch && (
                <CommandGroup>
                  <CommandItem
                    value={`__add__${trimmedQuery}`}
                    onSelect={() => {
                      setSelected({ name: trimmedQuery, isState: false });
                      setOpen(false);
                    }}
                  >
                    <PlusIcon className="size-4" />
                    Add &quot;{trimmedQuery}&quot; as a new place
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selected && !selected.id && (
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={selected.isState}
            onCheckedChange={(checked) =>
              setSelected((current) => (current ? { ...current, isState: checked } : current))
            }
          />
          This is a state/region
        </label>
      )}

      {selected?.id ? (
        <input type="hidden" name="placeId" value={selected.id} />
      ) : (
        <>
          <input type="hidden" name="placeName" value={selected?.name ?? ""} />
          <input type="hidden" name="placeIsState" value={selected?.isState ? "true" : "false"} />
        </>
      )}
    </div>
  );
}
