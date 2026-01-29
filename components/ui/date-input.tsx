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
  const [open, setOpen] = React.useState(false);
  const [isUserTyping, setIsUserTyping] = React.useState(false);

  React.useEffect(() => {
    if (!isUserTyping) {
      setText(formatDisplay(value));
    }
  }, [value, isUserTyping]);

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
    setIsUserTyping(false);
    if (text.trim() === "") {
      onChange?.(null);
      return;
    }
    // Só valida e salva se a data estiver completa (DD/MM/YYYY = 10 caracteres)
    if (text.length === 10) {
      const parsed = parseStrict(text);
      if (parsed) {
        onChange?.(parsed);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const parsed = parseStrict(text);
      if (parsed && text.length === 10) {
        onChange?.(parsed);
        setIsUserTyping(false);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    const masked = applyMask(pasted);
    setText(masked);
    setIsUserTyping(true);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative w-full h-full">
        <Input
          value={text}
          onChange={(e) => {
            setText(applyMask(e.target.value));
            setIsUserTyping(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={placeholder}
          className={`${className ?? ""} pr-10 h-full text-sm`}
          disabled={disabled}
        />
        <PopoverTrigger asChild>
          <Button
            aria-label="Abrir calendário"
            variant="ghost"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
            disabled={disabled}
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
      </div>
      <PopoverContent
        className="w-auto p-0"
        align="start"
        side="bottom"
        sideOffset={4}
      >
        <Calendar
          mode="single"
          selected={value}
          onSelect={(d: Date) => {
            onChange?.(d);
            setOpen(false);
          }}
          {...calendarProps}
        />
      </PopoverContent>
    </Popover>
  );
}
