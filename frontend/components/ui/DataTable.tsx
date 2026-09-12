"use client";

import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  render: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onSortChange?: (key: string) => void;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function DataTable<T>({
  columns,
  rows,
  keyExtractor,
  onRowClick,
  sortBy,
  sortDir,
  onSortChange,
  page,
  pageSize,
  total,
  onPageChange
}: DataTableProps<T>) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="overflow-hidden rounded-md border border-border bg-surface">
      <div className="max-h-[65vh] overflow-auto">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-elevated">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "border-b border-border px-3 py-2 text-left text-xs font-semibold text-text-secondary",
                    col.sortable && "cursor-pointer select-none hover:text-text-primary",
                    col.className
                  )}
                  onClick={() => col.sortable && onSortChange?.(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortBy === col.key ? (
                      sortDir === "asc" ? (
                        <ChevronUp size={12} />
                      ) : (
                        <ChevronDown size={12} />
                      )
                    ) : null}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={keyExtractor(row)}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  "border-b border-border last:border-b-0",
                  onRowClick && "cursor-pointer hover:bg-elevated"
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn("px-3 py-2 align-middle text-text-primary", col.className)}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-10 text-center text-sm text-text-secondary">
                  No rows match the current filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-border px-3 py-2 text-xs text-text-secondary">
        <span>
          {total === 0 ? "0 results" : `Showing ${start}–${end} of ${total}`}
        </span>
        <div className="flex items-center gap-2">
          <button
            className="flex h-6 w-6 items-center justify-center rounded border border-border disabled:opacity-40"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="font-mono-tabular">
            {page} / {totalPages}
          </span>
          <button
            className="flex h-6 w-6 items-center justify-center rounded border border-border disabled:opacity-40"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
