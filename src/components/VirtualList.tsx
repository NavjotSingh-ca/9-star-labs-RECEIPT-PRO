/**
 * Virtualized List — High-performance list rendering
 * Renders only visible items for large datasets.
 */

'use client';

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { cn } from '@design/utils';

interface VirtualListOptions<T> {
  items: T[];
  itemHeight: number | ((item: T, index: number) => number);
  overscan?: number;
  containerHeight: number;
  itemWidth?: number | '100%';
  renderItem: (item: T, index: number, isVisible: boolean) => React.ReactNode;
  keyExtractor: (item: T) => string;
  onScroll?: (scrollTop: number) => void;
  className?: string;
  itemClassName?: string;
}

interface VirtualListItem<T> {
  index: number;
  top: number;
  height: number;
  item: T;
}

export function VirtualList<T>({
  items,
  itemHeight,
  overscan = 5,
  containerHeight,
  itemWidth = '100%',
  renderItem,
  keyExtractor,
  onScroll,
  className,
  itemClassName,
}: VirtualListOptions<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [clientHeight, setClientHeight] = useState(containerHeight);

  // Calculate item heights and positions
  const itemMetrics = useMemo(() => {
    const metrics: VirtualListItem<T>[] = [];
    let currentTop = 0;
    
    items.forEach((item, index) => {
      const height = typeof itemHeight === 'function' ? itemHeight(item, index) : itemHeight;
      metrics.push({
        index,
        top: currentTop,
        height,
        item,
      });
      currentTop += height;
    });
    
    return { metrics, totalHeight: currentTop };
  }, [items, itemHeight]);

  // Determine visible range
  const visibleRange = useMemo(() => {
    const { metrics, totalHeight } = itemMetrics;
    if (metrics.length === 0) return { start: 0, end: 0, visibleItems: [] };

    // Find first visible item
    let start = 0;
    while (start < metrics.length && metrics[start].top + metrics[start].height < scrollTop) {
      start++;
    }

    // Find last visible item
    let end = start;
    const viewportBottom = scrollTop + clientHeight;
    while (end < metrics.length && metrics[end].top < viewportBottom) {
      end++;
    }

    // Add overscan
    const overscanStart = Math.max(0, start - overscan);
    const overscanEnd = Math.min(metrics.length - 1, end + overscan);

    return {
      start: overscanStart,
      end: overscanEnd,
      visibleItems: metrics.slice(overscanStart, overscanEnd + 1),
      totalHeight,
    };
  }, [itemMetrics, scrollTop, clientHeight, overscan]);

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  }, [onScroll]);

  // Handle resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setClientHeight(entry.contentRect.height);
      }
    });

    observer.observe(container);
    setClientHeight(container.clientHeight);

    return () => observer.disconnect();
  }, []);

  const itemStyle = useMemo(() => {
    let width: string;
    if (itemWidth === '100%') {
      width = '100%';
    } else if (typeof itemWidth === 'number') {
      width = `${itemWidth}px`;
    } else {
      width = itemWidth;
    }
    return {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      width,
    };
  }, [itemWidth]);

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-auto', className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
      tabIndex={0}
      role="list"
      aria-label="Virtualized list"
    >
      <div
        style={{ 
          height: itemMetrics.totalHeight,
          position: 'relative',
          width: '100%',
        }}
        role="list"
      >
        {visibleRange.visibleItems.map(({ index, top, height, item }) => (
          <div
            key={keyExtractor(item)}
            style={{
              ...itemStyle,
              top,
              height,
            }}
            className={cn('virtual-list-item', itemClassName)}
            role="listitem"
            data-index={index}
            data-virtual="true"
          >
            {renderItem(item, index, true)}
          </div>
        ))}
      </div>
    </div>
  );
}

// Hook for virtual scrolling with dynamic heights
export function useVirtualScroll<T>({
  items,
  estimateItemHeight = 50,
  overscan = 5,
  containerHeight,
  getItemKey: _getItemKey,
  getItemHeight,
}: {
  items: T[];
  estimateItemHeight?: number;
  overscan?: number;
  containerHeight: number;
  getItemKey: (_item: T) => string;
  getItemHeight?: (item: T, index: number) => number;
}) {
  const [scrollTop, setScrollTop] = useState(0);

  const itemHeights = useMemo(() => {
    if (!getItemHeight) return items.map(() => estimateItemHeight);
    return items.map((item, index) => getItemHeight(item, index));
  }, [items, getItemHeight, estimateItemHeight]);

  const [offsets, totalHeight] = useMemo(() => {
    const offsets: number[] = [];
    let offset = 0;
    itemHeights.forEach(height => {
      offsets.push(offset);
      offset += height;
    });
    return [offsets, offset];
  }, [itemHeights]);

  const visibleRange = useMemo(() => {
    if (items.length === 0) return { start: 0, end: 0 };
    
    let start = 0;
    while (start < offsets.length && offsets[start] + itemHeights[start] < scrollTop) {
      start++;
    }
    start = Math.max(0, start - overscan);

    let end = start;
    const viewportBottom = scrollTop + containerHeight;
    while (end < items.length && offsets[end] < viewportBottom) {
      end++;
    }
    end = Math.min(items.length - 1, end + overscan);

    return { start, end };
  }, [offsets, itemHeights, scrollTop, containerHeight, overscan, items.length]);

  return {
    scrollTop,
    setScrollTop,
    visibleRange,
    totalHeight,
    offsets,
  };
}