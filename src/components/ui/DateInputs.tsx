"use client";

import type { InputHTMLAttributes } from "react";
import { capDateToToday, capMonthToCurrent, currentMonth, today } from "@/lib/format";

type DateInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "max"> & {
  max?: string;
};

type MonthInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "max"> & {
  max?: string;
};

export function DateInput({ max, onChange, ...props }: DateInputProps) {
  return (
    <input
      type="date"
      max={max ?? today()}
      {...props}
      onChange={(e) => {
        const capped = capDateToToday(e.target.value);
        if (capped !== e.target.value) {
          e.target.value = capped;
        }
        onChange?.(e);
      }}
    />
  );
}

export function MonthInput({ max, onChange, ...props }: MonthInputProps) {
  return (
    <input
      type="month"
      max={max ?? currentMonth()}
      {...props}
      onChange={(e) => {
        const capped = capMonthToCurrent(e.target.value);
        if (capped !== e.target.value) {
          e.target.value = capped;
        }
        onChange?.(e);
      }}
    />
  );
}
