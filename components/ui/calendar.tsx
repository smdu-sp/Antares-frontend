/** @format */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import "dayjs/locale/pt-br";
import TextField from "@mui/material/TextField";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { StaticDatePicker } from "@mui/x-date-pickers/StaticDatePicker";
// Note: avoid hard dependency on the Pro package; implement a simple
// two-panel static range picker using two StaticDatePicker instances.

// Lightweight wrapper around MUI X static date pickers to preserve existing
// call sites that expect an inline calendar component. This accepts a loose
// set of props and forwards value/onChange as `selected`/`onSelect` to keep
// compatibility with current usage in the codebase.

type CalendarProps = {
  mode?: "single" | "range";
  selected?: any;
  onSelect?: (val: any) => void;
  className?: string;
  disabled?: (date: Date) => boolean;
  // accept any other props and forward to underlying picker
  [key: string]: any;
};

function Calendar({
  mode = "single",
  selected,
  onSelect,
  className,
  disabled,
  ...props
}: CalendarProps) {
  // ensure dayjs locale is set and enable custom parse format
  dayjs.locale("pt-br");
  dayjs.extend(customParseFormat);

  const toDayjs = (d: any) => (d ? dayjs(d) : null);
  const toDate = (d: any) => (d ? d.toDate() : null);

  // Controlled text inputs to allow typing dates in DD/MM/YYYY
  const formatDisplay = (d: any) => {
    if (!d) return "";
    try {
      return dayjs(d).format("DD/MM/YYYY");
    } catch {
      return "";
    }
  };

  // single mode input state
  const [inputSingle, setInputSingle] = React.useState<string>(
    formatDisplay(selected)
  );

  React.useEffect(() => {
    setInputSingle(formatDisplay(selected));
  }, [selected]);

  // range inputs state
  const [inputFrom, setInputFrom] = React.useState<string>(
    formatDisplay(selected?.from)
  );
  const [inputTo, setInputTo] = React.useState<string>(
    formatDisplay(selected?.to)
  );

  React.useEffect(() => {
    setInputFrom(formatDisplay(selected?.from));
    setInputTo(formatDisplay(selected?.to));
  }, [selected?.from, selected?.to]);

  const parseStrict = (s: string) => {
    const d = dayjs(s, "DD/MM/YYYY", true);
    return d.isValid() ? d.toDate() : null;
  };

  const handleSingleBlur = () => {
    const parsed = parseStrict(inputSingle);
    if (parsed) onSelect?.(parsed);
    else setInputSingle(formatDisplay(selected));
  };

  const handleFromBlur = () => {
    const parsed = parseStrict(inputFrom);
    if (parsed) onSelect?.({ from: parsed, to: selected?.to ?? null });
    else setInputFrom(formatDisplay(selected?.from));
  };

  const handleToBlur = () => {
    const parsed = parseStrict(inputTo);
    if (parsed) onSelect?.({ from: selected?.from ?? null, to: parsed });
    else setInputTo(formatDisplay(selected?.to));
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className={cn("p-2", className)}>
        {mode === "range" ? (
          <div className="space-y-2">
            <div className="flex gap-2">
              <TextField
                placeholder="DD/MM/AAAA"
                value={inputFrom}
                onChange={(e) => setInputFrom(e.target.value)}
                onBlur={handleFromBlur}
                size="small"
              />
              <TextField
                placeholder="DD/MM/AAAA"
                value={inputTo}
                onChange={(e) => setInputTo(e.target.value)}
                onBlur={handleToBlur}
                size="small"
              />
            </div>
            <div className="flex gap-2">
              <StaticDatePicker
                displayStaticWrapperAs="desktop"
                value={toDayjs(selected?.from ?? null)}
                onChange={(v) =>
                  onSelect?.({ from: toDate(v), to: selected?.to ?? null })
                }
                shouldDisableDate={
                  disabled ? (d: any) => disabled(toDate(d)) : undefined
                }
                {...props}
              />
              <StaticDatePicker
                displayStaticWrapperAs="desktop"
                value={toDayjs(selected?.to ?? null)}
                onChange={(v) =>
                  onSelect?.({ from: selected?.from ?? null, to: toDate(v) })
                }
                shouldDisableDate={
                  disabled ? (d: any) => disabled(toDate(d)) : undefined
                }
                {...props}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <TextField
              placeholder="DD/MM/AAAA"
              value={inputSingle}
              onChange={(e) => setInputSingle(e.target.value)}
              onBlur={handleSingleBlur}
              size="small"
            />
            <StaticDatePicker
              displayStaticWrapperAs="desktop"
              value={toDayjs(selected ?? null)}
              onChange={(v) => onSelect?.(toDate(v))}
              shouldDisableDate={
                disabled ? (d: any) => disabled(toDate(d)) : undefined
              }
              {...props}
            />
          </div>
        )}
      </div>
    </LocalizationProvider>
  );
}

export { Calendar };
