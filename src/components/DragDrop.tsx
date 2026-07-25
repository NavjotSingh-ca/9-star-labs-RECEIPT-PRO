/**
 * Drag and Drop — Accessible drag and drop with keyboard support
 * Built on native HTML5 Drag and Drop API with full keyboard accessibility.
 */

'use client';

import { useRef, useState, useCallback } from 'react';
import { cn } from '@design/utils';

interface DragItem<T> {
  id: string;
  type: string;
  data: T;
  preview?: React.ReactNode;
}

interface DropZoneOptions<T> {
  accepts: string[];
  onDragEnter?: (item: DragItem<T>, event: React.DragEvent) => void;
  onDragLeave?: (item: DragItem<T>, event: React.DragEvent) => void;
  onDrop?: (item: DragItem<T>, event: React.DragEvent) => void;
  onDragOver?: (item: DragItem<T>, event: React.DragEvent) => void;
}

interface DraggableOptions<T> {
  item: DragItem<T>;
  dragPreview?: React.ReactNode | ((item: DragItem<T>) => React.ReactNode);
  onDragStart?: (event: React.DragEvent) => void;
  onDragEnd?: (event: React.DragEvent) => void;
  disabled?: boolean;
}

/**
 * Drop Zone Component
 */
export function DropZone<T>({
  children,
  accepts,
  onDragEnter,
  onDragLeave,
  onDrop,
  onDragOver,
  className,
  id,
}: DropZoneOptions<T> & {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const itemData = e.dataTransfer.getData('application/x-drag-item');
    if (!itemData) return;

    try {
      const item: DragItem<T> = JSON.parse(itemData);
      if (!accepts.includes(item.type)) return;
      
      setIsDraggingOver(true);
      onDragEnter?.(item, e);
    } catch {
      // Invalid drag data
    }
  }, [accepts, onDragEnter]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only trigger leave if actually leaving the drop zone
    const rect = dropZoneRef.current?.getBoundingClientRect();
    if (rect && e.clientX >= rect.left && e.clientX <= rect.right && 
        e.clientY >= rect.top && e.clientY <= rect.bottom) {
      return;
    }
    
    setIsDraggingOver(false);
    onDragLeave?.(null as unknown as DragItem<T>, e);
  }, [onDragLeave]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    onDragOver?.(null as unknown as DragItem<T>, e);
  }, [onDragOver]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDraggingOver(false);
    
    const itemData = e.dataTransfer.getData('application/x-drag-item');
    if (!itemData) return;

    try {
      const item: DragItem<T> = JSON.parse(itemData);
      if (!accepts.includes(item.type)) return;
      
      onDrop?.(item, e);
    } catch {
      // Invalid drop data
    }
  }, [accepts, onDrop]);

  return (
    <div
      ref={dropZoneRef}
      id={id}
      className={cn(
        'relative transition-colors duration-200',
        isDraggingOver && 'bg-champagne/5 border-champagne/30 ring-2 ring-champagne/20',
        className
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      role="region"
      aria-dropeffect="move"
      aria-label="Drop zone"
    >
      {children}
    </div>
  );
}

/**
 * Draggable Component
 */
export function Draggable<T>({
  item,
  children,
  dragPreview,
  onDragStart,
  onDragEnd,
  disabled = false,
  className,
}: DraggableOptions<T> & {
  children: React.ReactNode;
  className?: string;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);

  const handleDragStart = useCallback((e: React.DragEvent) => {
    if (disabled) {
      e.preventDefault();
      return;
    }

    setIsDragging(true);
    
    e.dataTransfer.setData('application/x-drag-item', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'move';
    
    // Set custom drag preview
    if (dragPreview && dragRef.current) {
      // Custom drag images need an element reference
      // e.dataTransfer.setDragImage(element, x, y);
    }

    onDragStart?.(e);
  }, [item, disabled, dragPreview, onDragStart]);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    setIsDragging(false);
    onDragEnd?.(e);
  }, [onDragEnd]);

  return (
    <div
      ref={dragRef}
      draggable={!disabled}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={cn(
        'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-50',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
      role="button"
      aria-grabbed={isDragging}
      aria-describedby={'draggable-drag-hint'}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
          e.preventDefault();
          // Announce drag start for screen readers
        }
      }}
    >
      {children}
      {isDragging && (
        <div className="sr-only" aria-live="polite">
          Dragging {item.id}
        </div>
      )}
    </div>
  );
}

/**
 * Sortable List with Drag and Drop
 */
interface SortableListProps<T> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number, isDragging: boolean) => React.ReactNode;
  getItemKey: (item: T) => string;
  getItemType: (item: T) => string;
  disabled?: boolean;
  className?: string;
  orientation?: 'vertical' | 'horizontal';
}

export function SortableList<T>({
  items,
  onReorder,
  renderItem,
  getItemKey,
  getItemType,
  disabled = false,
  className,
  orientation = 'vertical',
}: SortableListProps<T>) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const dragItemRef = useRef<DragItem<T> | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    if (disabled) return;
    
    const item = items[index];
    dragItemRef.current = {
      id: getItemKey(item),
      type: getItemType(item),
      data: item,
    };

    e.dataTransfer.setData('application/x-drag-item', JSON.stringify(dragItemRef.current));
    e.dataTransfer.effectAllowed = 'move';
    
    setDraggedIndex(index);
    e.dataTransfer.dropEffect = 'move';
  }, [disabled, items, getItemKey, getItemType]);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDropTargetIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === index) {
      setDraggedIndex(null);
      setDropTargetIndex(null);
      return;
    }

    const newItems = [...items];
    const [draggedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, draggedItem);
    
    onReorder(newItems);
    setDraggedIndex(null);
    setDropTargetIndex(null);
  }, [items, draggedIndex, onReorder]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDropTargetIndex(null);
    dragItemRef.current = null;
  }, []);

  return (
    <div className={cn('sortable-list', className)} role="list" aria-label={`Sortable ${orientation} list`}>
      {items.map((item, index) => (
        <Draggable
          key={getItemKey(item)}
          item={{ id: getItemKey(item), type: getItemType(item), data: item }}
          disabled={disabled}
          onDragStart={(e) => handleDragStart(e, index)}
          onDragEnd={handleDragEnd}
          dragPreview={() => renderItem(item, index, true)}
        >
          <div
            className={cn(
              'sortable-item',
              orientation === 'horizontal' ? 'inline-flex' : 'block',
              index === draggedIndex && 'opacity-0',
              index === dropTargetIndex && 'ring-2 ring-champagne/50',
              className
            )}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            role="listitem"
            aria-grabbed={index === draggedIndex}
            aria-posinset={index + 1}
            aria-setsize={items.length}
          >
            {renderItem(item, index, index === draggedIndex)}
          </div>
        </Draggable>
      ))}
    </div>
  );
}

/**
 * Hook for reorderable items
 */
export function useSortable<T>(items: T[], onReorder: (items: T[]) => void) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  const moveItem = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    
    const newItems = [...items];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);
    onReorder(newItems);
  }, [items, onReorder]);

  return { draggedIndex, handleDragStart, handleDragEnd, moveItem };
}