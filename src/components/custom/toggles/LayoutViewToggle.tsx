"use client";

import { Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettingsStore } from "@/lib/store/settings.store";

export function LayoutViewToggle() {
  const { layoutViewMode, setLayoutViewMode } = useSettingsStore();

  const cycleLayoutViewMode = () => {
    const modes = ["standard", "wide"] as const;
    const currentIndex = modes.indexOf(layoutViewMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setLayoutViewMode(modes[nextIndex]);
  };

  const getIcon = () => {
    switch (layoutViewMode) {
      case "standard":
        return <Maximize2 className="h-[1.2rem] w-[1.2rem]" />;
      case "wide":
        return <Minimize2 className="h-[1.2rem] w-[1.2rem]" />;
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleLayoutViewMode}
      className="h-9 w-9"
    >
      {getIcon()}
      <span className="sr-only">Toggle view mode</span>
    </Button>
  );
}
