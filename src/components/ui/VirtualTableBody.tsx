"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

const DEFAULT_ROW_HEIGHT = 44;
const DEFAULT_MAX_HEIGHT = 520;
const DEFAULT_THRESHOLD = 80;
const OVERSCAN = 6;

interface VirtualWindow {
  useVirtual: boolean;
  start: number;
  end: number;
  topPad: number;
  bottomPad: number;
}

export function useVirtualWindow(
  itemCount: number,
  options?: {
    rowHeight?: number;
    maxHeight?: number;
    threshold?: number;
  },
): VirtualWindow & {
  scrollTop: number;
  onScroll: (event: React.UIEvent<HTMLDivElement>) => void;
  maxHeight: number;
} {
  const rowHeight = options?.rowHeight ?? DEFAULT_ROW_HEIGHT;
  const maxHeight = options?.maxHeight ?? DEFAULT_MAX_HEIGHT;
  const threshold = options?.threshold ?? DEFAULT_THRESHOLD;
  const [scrollTop, setScrollTop] = useState(0);

  const onScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  const useVirtual = itemCount > threshold;

  const windowState = useMemo(() => {
    if (!useVirtual) {
      return { start: 0, end: itemCount, topPad: 0, bottomPad: 0 };
    }

    const start = Math.max(0, Math.floor(scrollTop / rowHeight) - OVERSCAN);
    const visibleCount = Math.ceil(maxHeight / rowHeight) + OVERSCAN * 2;
    const end = Math.min(itemCount, start + visibleCount);

    return {
      start,
      end,
      topPad: start * rowHeight,
      bottomPad: Math.max(0, (itemCount - end) * rowHeight),
    };
  }, [itemCount, maxHeight, rowHeight, scrollTop, useVirtual]);

  return {
    useVirtual,
    scrollTop,
    onScroll,
    maxHeight,
    ...windowState,
  };
}

interface VirtualTableBodyProps<T> {
  items: T[];
  colSpan: number;
  window: VirtualWindow;
  getKey: (item: T, index: number) => string;
  renderCells: (item: T, index: number) => ReactNode;
}

export function VirtualTableBody<T>({
  items,
  colSpan,
  window,
  getKey,
  renderCells,
}: VirtualTableBodyProps<T>) {
  const visibleItems = useMemo(
    () => items.slice(window.start, window.end),
    [items, window.end, window.start],
  );

  if (!window.useVirtual) {
    return (
      <>
        {items.map((item, index) => (
          <tr key={getKey(item, index)}>{renderCells(item, index)}</tr>
        ))}
      </>
    );
  }

  return (
    <>
      {window.topPad > 0 ? (
        <tr aria-hidden="true">
          <td colSpan={colSpan} style={{ height: window.topPad, padding: 0, border: "none" }} />
        </tr>
      ) : null}
      {visibleItems.map((item, offset) => {
        const index = window.start + offset;
        return <tr key={getKey(item, index)}>{renderCells(item, index)}</tr>;
      })}
      {window.bottomPad > 0 ? (
        <tr aria-hidden="true">
          <td colSpan={colSpan} style={{ height: window.bottomPad, padding: 0, border: "none" }} />
        </tr>
      ) : null}
    </>
  );
}

interface VirtualTableWrapProps {
  enabled: boolean;
  maxHeight: number;
  onScroll: (event: React.UIEvent<HTMLDivElement>) => void;
  children: ReactNode;
}

export function VirtualTableWrap({
  enabled,
  maxHeight,
  onScroll,
  children,
}: VirtualTableWrapProps) {
  if (!enabled) {
    return <div className="tbl-wrap">{children}</div>;
  }

  return (
    <div
      className="tbl-wrap virtual-tbl-scroll"
      style={{ maxHeight, overflow: "auto" }}
      onScroll={onScroll}
    >
      {children}
    </div>
  );
}
