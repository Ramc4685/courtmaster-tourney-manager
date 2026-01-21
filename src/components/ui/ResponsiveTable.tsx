import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FixedSizeList as VirtualList } from 'react-window';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';

export interface ResponsiveTableColumn<T = any> {
  key: string;
  label: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  width?: string | number;
  minWidth?: string | number;
  sortable?: boolean;
  hideOnMobile?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
  className?: string;
}

export interface ResponsiveTableProps<T = any> {
  data: T[];
  columns: ResponsiveTableColumn<T>[];
  keyField: keyof T;
  className?: string;
  onRowClick?: (item: T) => void;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string, direction: 'asc' | 'desc') => void;
  loading?: boolean;
  emptyMessage?: string;
  enableVirtualization?: boolean;
  virtualizationThreshold?: number;
  rowHeight?: number;
  cardMode?: boolean;
  expandableRows?: boolean;
  renderExpandedContent?: (item: T) => React.ReactNode;
}

export const ResponsiveTable = <T extends Record<string, any>>({
  data,
  columns,
  keyField,
  className,
  onRowClick,
  sortField,
  sortDirection = 'asc',
  onSort,
  loading = false,
  emptyMessage = 'No data available',
  enableVirtualization = true,
  virtualizationThreshold,
  rowHeight = 60,
  cardMode,
  expandableRows = false,
  renderExpandedContent,
}: ResponsiveTableProps<T>) => {
  const { isMobile, shouldUseVirtualization, getRecommendedTouchTargetSize } = useMobileOptimization();
  const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set());

  // Determine layout mode
  const useCardLayout = cardMode ?? isMobile;
  const useVirtualization = enableVirtualization &&
    shouldUseVirtualization(virtualizationThreshold ?? data.length);

  // Touch target size for buttons
  const touchTargetSize = getRecommendedTouchTargetSize();

  // Filter columns for mobile
  const visibleColumns = useMemo(() => {
    if (!useCardLayout) return columns;
    return columns.filter(col => !col.hideOnMobile);
  }, [columns, useCardLayout]);

  // Handle row expansion
  const toggleRowExpansion = useCallback((rowKey: string | number) => {
    if (!expandableRows) return;

    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowKey)) {
        newSet.delete(rowKey);
      } else {
        newSet.add(rowKey);
      }
      return newSet;
    });
  }, [expandableRows]);

  // Handle sorting
  const handleSort = useCallback((columnKey: string) => {
    if (!onSort) return;

    const newDirection = sortField === columnKey && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(columnKey, newDirection);
  }, [onSort, sortField, sortDirection]);

  // Get cell value
  const getCellValue = useCallback((item: T, column: ResponsiveTableColumn<T>) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(item);
    }
    return item[column.accessor];
  }, []);

  // Render cell content
  const renderCellContent = useCallback((item: T, column: ResponsiveTableColumn<T>) => {
    const value = getCellValue(item, column);
    return column.render ? column.render(value, item) : value;
  }, [getCellValue]);

  // Card component for mobile layout
  const TableCard = ({ item, index }: { item: T; index: number }) => {
    const rowKey = item[keyField];
    const isExpanded = expandedRows.has(rowKey);
    const hasExpandableContent = expandableRows && renderExpandedContent;

    return (
      <Card
        className={cn(
          "cursor-pointer hover:shadow-md transition-shadow",
          onRowClick && "cursor-pointer"
        )}
        onClick={() => onRowClick?.(item)}
      >
        <CardContent className="p-4">
          <div className="space-y-2">
            {visibleColumns.map((column) => (
              <div key={column.key} className="flex justify-between items-start">
                <span className="text-sm font-medium text-muted-foreground min-w-[100px]">
                  {column.label}:
                </span>
                <span className="text-sm text-right flex-1">
                  {renderCellContent(item, column)}
                </span>
              </div>
            ))}
          </div>

          {hasExpandableContent && (
            <>
              <div className="flex justify-center mt-3 pt-3 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleRowExpansion(rowKey);
                  }}
                  style={{ minHeight: touchTargetSize }}
                  className="flex items-center gap-2"
                >
                  {isExpanded ? 'Show Less' : 'Show More'}
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {isExpanded && (
                <div className="mt-3 pt-3 border-t">
                  {renderExpandedContent(item)}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  // Table row component
  const TableRow = ({ item, index }: { item: T; index: number }) => {
    const rowKey = item[keyField];
    const isExpanded = expandedRows.has(rowKey);

    return (
      <>
        <tr
          className={cn(
            "border-b hover:bg-muted/50 transition-colors",
            onRowClick && "cursor-pointer"
          )}
          onClick={() => onRowClick?.(item)}
        >
          {columns.map((column) => (
            <td key={column.key} className={cn("px-4 py-3", column.className)}>
              {renderCellContent(item, column)}
            </td>
          ))}
          {expandableRows && (
            <td className="px-4 py-3 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleRowExpansion(rowKey);
                }}
                style={{ minHeight: touchTargetSize }}
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </td>
          )}
        </tr>
        {expandableRows && isExpanded && renderExpandedContent && (
          <tr>
            <td colSpan={columns.length + 1} className="px-4 py-3 bg-muted/30">
              {renderExpandedContent(item)}
            </td>
          </tr>
        )}
      </>
    );
  };

  // Virtualized list renderer
  const VirtualizedCardList = ({ height = 600 }: { height?: number }) => (
    <VirtualList
      height={height}
      itemCount={data.length}
      itemSize={rowHeight}
      itemData={data}
    >
      {({ index, style }) => (
        <div style={style} className="px-2 py-1">
          <TableCard item={data[index]} index={index} />
        </div>
      )}
    </VirtualList>
  );

  const VirtualizedTableList = ({ height = 600 }: { height?: number }) => (
    <VirtualList
      height={height}
      itemCount={data.length}
      itemSize={rowHeight}
      itemData={data}
    >
      {({ index, style }) => (
        <div style={style}>
          <table className="w-full">
            <tbody>
              <TableRow item={data[index]} index={index} />
            </tbody>
          </table>
        </div>
      )}
    </VirtualList>
  );

  // Loading state
  if (loading) {
    return (
      <div className={cn("w-full", className)}>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className={cn("w-full", className)}>
        <div className="text-center p-8 text-muted-foreground">
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  // Card layout (mobile)
  if (useCardLayout) {
    return (
      <div className={cn("w-full space-y-3", className)}>
        {useVirtualization ? (
          <VirtualizedCardList />
        ) : (
          data.map((item, index) => (
            <TableCard key={item[keyField]} item={item} index={index} />
          ))
        )}
      </div>
    );
  }

  // Table layout (desktop)
  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      {useVirtualization ? (
        <VirtualizedTableList />
      ) : (
        <table className="w-full">
          <thead className="border-b">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-4 py-3 text-left text-sm font-medium text-muted-foreground",
                    column.sortable && onSort && "cursor-pointer hover:text-foreground",
                    column.className
                  )}
                  style={{
                    width: column.width,
                    minWidth: column.minWidth
                  }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {column.sortable && sortField === column.key && (
                      sortDirection === 'asc' ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )
                    )}
                  </div>
                </th>
              ))}
              {expandableRows && (
                <th className="px-4 py-3 w-16"></th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <TableRow key={item[keyField]} item={item} index={index} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ResponsiveTable;