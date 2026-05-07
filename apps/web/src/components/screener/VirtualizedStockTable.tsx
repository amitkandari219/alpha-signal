/**
 * Virtualized Stock Table
 *
 * High-performance table using virtual scrolling for large datasets
 * Only renders visible rows, dramatically improving performance
 */

import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useNavigate } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { ScreenerStock } from '../../data/mockScreenerData';

interface VirtualizedStockTableProps {
  data: ScreenerStock[];
  columns: ColumnDef<ScreenerStock>[];
  sorting: SortingState;
  onSortingChange: (sorting: SortingState | ((old: SortingState) => SortingState)) => void;
}

export const VirtualizedStockTable: React.FC<VirtualizedStockTableProps> = ({
  data,
  columns,
  sorting,
  onSortingChange,
}) => {
  const navigate = useNavigate();
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const { rows } = table.getRowModel();

  // Virtual scrolling - only render visible rows
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 48, // Estimated row height in pixels
    overscan: 10, // Render 10 extra rows above/below viewport
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start || 0 : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - (virtualRows[virtualRows.length - 1]?.end || 0)
      : 0;

  return (
    <div className="bg-bg-secondary border border-border-primary rounded-lg overflow-hidden">
      <div
        ref={tableContainerRef}
        className="overflow-auto"
        style={{ height: '600px' }}
      >
        <table className="w-full">
          <thead className="bg-bg-tertiary sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-semibold text-text-muted cursor-pointer hover:text-text-primary transition-colors"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getIsSorted() ? (
                        header.column.getIsSorted() === 'asc' ? (
                          <ArrowUp className="w-3 h-3" />
                        ) : (
                          <ArrowDown className="w-3 h-3" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-30" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {paddingTop > 0 && (
              <tr>
                <td style={{ height: `${paddingTop}px` }} />
              </tr>
            )}
            {virtualRows.map((virtualRow) => {
              const row = rows[virtualRow.index];

              // Safety check: skip if row doesn't exist
              if (!row) return null;

              return (
                <tr
                  key={row.id}
                  data-index={virtualRow.index}
                  onClick={() => navigate(`/stock/${row.original.symbol}`)}
                  className="border-b border-border-default hover:bg-bg-tertiary cursor-pointer transition-colors"
                  style={{
                    height: `${virtualRow.size}px`,
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-sm text-text-primary">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}
            {paddingBottom > 0 && (
              <tr>
                <td style={{ height: `${paddingBottom}px` }} />
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Performance Info */}
      <div className="px-4 py-2 border-t border-border-primary bg-bg-tertiary flex items-center justify-between">
        <span className="text-xs text-text-muted">
          Showing {virtualRows.length} of {rows.length} rows (virtual scrolling enabled)
        </span>
        <span className="text-xs text-text-muted">
          🚀 Click any row to view stock details
        </span>
      </div>
    </div>
  );
};

export default VirtualizedStockTable;
