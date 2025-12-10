/** @format */

"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

type DateInputProps = {
  value?: Date | null;
  onChange?: (d: Date | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  // forwarded to Calendar
  calendarProps?: any;
  // mode: 'single' | 'range' (range not supported by this input field, only single)
};

export default function DateInput({
  value,
  onChange,
  placeholder = "DD/MM/AAAA",
  disabled,
  className,
  calendarProps,
}: DateInputProps) {
  const formatDisplay = (d?: Date | null) =>
    d ? dayjs(d).format("DD/MM/YYYY") : "";

  const [text, setText] = React.useState<string>(formatDisplay(value));

  React.useEffect(() => {
    setText(formatDisplay(value));
  }, [value]);

  const parseStrict = (s: string) => {
    const d = dayjs(s, "DD/MM/YYYY", true);
    return d.isValid() ? d.toDate() : null;
  };

  // Basic mask: keep only digits and insert slashes as DD/MM/YYYY while typing
  const applyMask = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 8); // max 8 digits
    const parts = [] as string[];
    if (digits.length <= 2) return digits;
    parts.push(digits.slice(0, 2));
    if (digits.length <= 4) return `${parts[0]}/${digits.slice(2)}`;
    parts.push(digits.slice(2, 4));
    if (digits.length <= 8) return `${parts[0]}/${parts[1]}/${digits.slice(4)}`;
    return `${parts[0]}/${parts[1]}/${digits.slice(4, 8)}`;
  };

  const handleBlur = () => {
    const parsed = parseStrict(text);
    if (parsed) onChange?.(parsed);
    else setText(formatDisplay(value));
  };

  return (
    <Popover>
      <div className="relative">
        <Input
          value={text}
          onChange={(e) => setText(applyMask(e.target.value))}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`${className ?? ""} pr-10`}
          disabled={disabled}
        />
        <PopoverTrigger asChild>
          <Button
            aria-label="Abrir calendário"
            variant="ghost"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
            disabled={disabled}
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
      </div>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(d: Date) => onChange?.(d)}
          {...calendarProps}
        />
      </PopoverContent>
    </Popover>
  );
}
