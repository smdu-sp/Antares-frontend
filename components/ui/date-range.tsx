/** @format */

"use client";

import * as React from "react";
import { addDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
// Using a simple { from?: Date | null; to?: Date | null } shape compatible
// with the project's previous DateRange usage.
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function DatePickerWithRange({
  className,
  value,
  onChange,
  defaultMonth,
  numberOfMonths = 2,
}: React.HTMLAttributes<HTMLDivElement> & {
  value?: { from?: Date | null; to?: Date | null } | undefined;
  onChange?: (v: { from?: Date | null; to?: Date | null } | undefined) => void;
  defaultMonth?: Date | undefined;
  numberOfMonths?: number;
}) {
  const [internal, setInternal] = React.useState<
    { from?: Date | null; to?: Date | null } | undefined
  >({
    from: new Date(2022, 0, 20),
    to: addDays(new Date(2022, 0, 20), 20),
  });

  const selected = value ?? internal;

  const setDate = (v: { from?: Date | null; to?: Date | null } | undefined) => {
    if (onChange) onChange(v);
    else setInternal(v);
  };

  const display = selected?.from
    ? selected.to
      ? `${format(selected.from, "dd/MM/yyyy")} - ${format(
          selected.to,
          "dd/MM/yyyy"
        )}`
      : `${format(selected.from, "dd/MM/yyyy")}`
    : "Escolha uma data";

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <div className="relative w-[300px]">
          <Input value={display} readOnly className="pr-10 w-full" />
          <PopoverTrigger asChild>
            <Button
              aria-label="Abrir calendário"
              variant="ghost"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
        </div>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            locale={ptBR}
            initialFocus
            mode="range"
            defaultMonth={defaultMonth}
            selected={selected}
            onSelect={setDate}
            numberOfMonths={numberOfMonths}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
