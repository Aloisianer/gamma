"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import * as Icon from "react-feather";
import { usePageContext } from "@/components/context/page";

export function NavigationControls({ className = "" }) {
  const { goBack, goForward } = usePageContext();

  return (
    <div className={`fixed z-20 bottom-4 right-4 flex gap-2 ${className}`}>
      <Button variant="outline" size="icon" aria-label="Back" onClick={goBack}>
        <Icon.ChevronLeft size={18} />
      </Button>
      <Button variant="outline" size="icon" aria-label="Forward" onClick={goForward}>
        <Icon.ChevronRight size={18} />
      </Button>
    </div>
  );
}
