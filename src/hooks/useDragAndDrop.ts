import { useState, useEffect, useCallback } from 'react';
import { 
  DragItemType, 
  DropZoneType, 
  DragItem, 
  DropZone, 
  DropResult, 
  DragState, 
  DragConstraint
} from '@/types/drag-drop';

interface UseDragAndDropOptions {
  onDragStart?: (item: DragItem) => void;
  onDragOver?: (zone: DropZone) => void;
  onDragEnd?: (result: DropResult) => void;
  constraints?: DragConstraint[];
}

/**
 * Custom hook for implementing drag and drop functionality
 * 
 * @param options Configuration options for drag and drop behavior
 * @returns State and handlers for drag and drop operations
 */
export const useDragAndDrop = (options?: UseDragAndDropOptions) => {
  // Current dragged item
  const [activeDrag, setActiveDrag] = useState<DragItem | null>(null);
  
  // Current drop zone being hovered
  const [activeDropZone, setActiveDropZone] = useState<DropZone | null>(null);
  
  // Current drag state
  const [dragState, setDragState] = useState<DragState>(DragState.IDLE);
  
  // Start a drag operation
  const startDrag = useCallback((item: DragItem) => {
    setActiveDrag(item);
    setDragState(DragState.DRAGGING);
    
    if (options?.onDragStart) {
      options.onDragStart(item);
    }
  }, [options]);
  
  // Handle entering a drop zone
  const enterDropZone = useCallback((zone: DropZone) => {
    if (dragState !== DragState.DRAGGING || !activeDrag) return;
    
    // Check constraints
    if (options?.constraints) {
      for (const constraint of options.constraints) {
        if (!constraint.validate(activeDrag, zone)) {
          setActiveDropZone(null);
          return;
        }
      }
    }
    
    setActiveDropZone(zone);
    setDragState(DragState.OVER_DROPZONE);
    
    if (options?.onDragOver) {
      options.onDragOver(zone);
    }
  }, [activeDrag, dragState, options]);
  
  // Handle leaving a drop zone
  const leaveDropZone = useCallback(() => {
    if (dragState !== DragState.OVER_DROPZONE) return;
    
    setActiveDropZone(null);
    setDragState(DragState.DRAGGING);
  }, [dragState]);
  
  // Complete a drag operation
  const endDrag = useCallback(() => {
    // Only process drop if we have both a dragged item and a drop zone
    if (activeDrag && activeDropZone && dragState === DragState.OVER_DROPZONE) {
      const result: DropResult = {
        item: activeDrag,
        zone: activeDropZone,
        success: true
      };
      
      if (options?.onDragEnd) {
        options.onDragEnd(result);
      }
    } else if (activeDrag) {
      // Handle cancelled drag
      const result: DropResult = {
        item: activeDrag,
        success: false
      };
      
      if (options?.onDragEnd) {
        options.onDragEnd(result);
      }
    }
    
    // Reset state
    setActiveDrag(null);
    setActiveDropZone(null);
    setDragState(DragState.IDLE);
  }, [activeDrag, activeDropZone, dragState, options]);
  
  // Cancel the current drag operation
  const cancelDrag = useCallback(() => {
    setActiveDrag(null);
    setActiveDropZone(null);
    setDragState(DragState.IDLE);
  }, []);

  // Clean up by listening for escape key press to cancel drag
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dragState !== DragState.IDLE) {
        cancelDrag();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dragState, cancelDrag]);
  
  // Check if an item can be dropped in a specific zone
  const canDrop = useCallback((item: DragItem, zone: DropZone): boolean => {
    if (!options?.constraints) return true;
    
    return options.constraints.every(constraint => 
      constraint.validate(item, zone)
    );
  }, [options?.constraints]);
  
  return {
    activeDrag,
    activeDropZone,
    dragState,
    startDrag,
    enterDropZone,
    leaveDropZone,
    endDrag,
    cancelDrag,
    canDrop
  };
};

/**
 * Creates a constraint that only allows specific item types to be dropped on specific zone types
 * 
 * @param allowedMappings Map of item types to allowed drop zone types
 * @returns A DragConstraint object
 */
export const createTypeConstraint = (
  allowedMappings: Record<DragItemType, DropZoneType[]>
): DragConstraint => {
  return {
    validate: (item: DragItem, zone: DropZone): boolean => {
      const allowedZoneTypes = allowedMappings[item.type];
      return allowedZoneTypes?.includes(zone.type) || false;
    }
  };
};

/**
 * Creates a constraint that validates drops based on a custom function
 * 
 * @param validateFn Function that validates if an item can be dropped on a zone
 * @returns A DragConstraint object
 */
export const createCustomConstraint = (
  validateFn: (item: DragItem, zone: DropZone) => boolean
): DragConstraint => {
  return {
    validate: validateFn
  };
};

export default useDragAndDrop;
