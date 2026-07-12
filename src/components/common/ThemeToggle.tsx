import { useState } from "react";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTheme } from "@/hooks";
import type { ThemeOption } from "@/types";

const themeOptions: ThemeOption[] = [
  {
    value: "system",
    label: "System",
    icon: Monitor,
  },
  {
    value: "light",
    label: "Light",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Dark",
    icon: Moon,
  },
];

export default function ThemeToggle() {
  const { preference, setThemePreference } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const selectedThemeOption =
    themeOptions.find((option) => option.value === preference) ??
    themeOptions[0];
  const ActiveIcon = selectedThemeOption.icon;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          aria-label={`Theme: ${selectedThemeOption.label}`}
          size="icon"
          title={`Theme: ${selectedThemeOption.label}`}
          type="button"
          variant="outline"
        >
          <ActiveIcon aria-hidden="true" className="size-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-40 p-1.5">
        <div aria-label="Theme selection" className="flex flex-col gap-1">
          {themeOptions.map(({ value, label, icon: Icon }) => {
            const isSelected = preference === value;

            return (
              <Button
                aria-pressed={isSelected}
                className="h-8 justify-start gap-2 px-2"
                key={value}
                onClick={() => {
                  setThemePreference(value);
                  setIsOpen(false);
                }}
                size="sm"
                type="button"
                variant={isSelected ? "secondary" : "ghost"}
              >
                <Icon aria-hidden="true" className="size-4" />
                <span className="min-w-0 flex-1 text-left">{label}</span>
                {isSelected && (
                  <Check aria-hidden="true" className="size-3.5" />
                )}
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
