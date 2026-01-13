/** @format */

"use client";

import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Table2, Grid3x3 } from "lucide-react";
import { useCallback } from "react";

export function ViewToggle() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const view = searchParams.get("view") || "table";

  const toggleView = useCallback(
    (newView: "table" | "spreadsheet") => {
      const params = new URLSearchParams(searchParams);
      params.set("view", newView);
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, searchParams, router]
  );

  return (
    <div className="flex gap-1 bg-muted p-1 rounded-lg">
      <Button
        size="sm"
        variant={view === "table" ? "default" : "ghost"}
        onClick={() => toggleView("table")}
        className="px-3"
      >
        <Table2 className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant={view === "spreadsheet" ? "default" : "ghost"}
        onClick={() => toggleView("spreadsheet")}
        className="px-3"
      >
        <Grid3x3 className="h-4 w-4" />
      </Button>
    </div>
  );
}
