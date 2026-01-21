import { Court, Match } from './entities';

/**
 * Generic interface for draggable items
 */
export interface DragItem {
  /**
   * Unique identifier for the item
   */
  id: string;
  
  /**
   * Type of the item (court, match, etc.)
   */
  type: DragItemType;
  
  /**
   * Index position in original collection (used for reordering)
   */
  index?: number;
  
  /**
   * Data associated with this drag item
   */
  data?: any;
}

/**
 * Types of items that can be dragged
 */
export enum DragItemType {
  COURT = 'court',
  MATCH = 'match',
  TEAM = 'team',
  DIVISION = 'division',
  CATEGORY = 'category',
  PLAYER = 'player'
}

/**
 * Interface for drop target zones
 */
export interface DropZone {
  /**
   * Unique identifier for the drop zone
   */
  id: string;
  
  /**
   * Type of items this zone accepts
   */
  accepts: DragItemType[];
  
  /**
   * Data associated with this drop zone
   */
  data?: any;
  
  /**
   * Whether the drop zone is currently disabled
   */
  disabled?: boolean;
}

/**
 * Event data structure for when a drag operation ends
 */
export interface DragEndEvent {
  /**
   * The item being dragged
   */
  active: {
    id: string;
    data?: DragItem;
  };
  
  /**
   * The drop target, if any
   */
  over?: {
    id: string;
    data?: DropZone;
  } | null;
}

/**
 * Specialized drag data for court assignments
 */
export interface CourtAssignmentDragData {
  /**
   * The match being assigned
   */
  match: Match;
  
  /**
   * Original court ID if the match was already assigned
   */
  originalCourtId?: string;
  
  /**
   * Time slot information
   */
  timeSlot?: {
    startTime: Date;
    endTime: Date;
  };
}

/**
 * Specialized drag data for match operations
 */
export interface MatchDragData {
  /**
   * The match being dragged
   */
  match: Match;
  
  /**
   * Court ID the match is assigned to
   */
  courtId?: string;
  
  /**
   * Match duration in minutes
   */
  duration?: number;
}

/**
 * Possible states of a drag operation
 */
export enum DragState {
  IDLE = 'idle',
  DRAGGING = 'dragging',
  DROPPING = 'dropping',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  ERROR = 'error'
}

/**
 * Result of a drop operation
 */
export interface DropResult {
  /**
   * Whether the drop was successful
   */
  success: boolean;
  
  /**
   * The dragged item
   */
  item: DragItem;
  
  /**
   * The drop target
   */
  target?: DropZone;
  
  /**
   * Error message if the drop failed
   */
  error?: string;
  
  /**
   * Resulting data after the drop (e.g., updated court with match)
   */
  result?: any;
}

/**
 * Validation rules for drag operations
 */
export interface DragConstraints {
  /**
   * Types of items that can be dragged
   */
  allowedTypes: DragItemType[];
  
  /**
   * Custom validation function
   */
  validator?: (item: DragItem, zone: DropZone) => { valid: boolean; message?: string };
  
  /**
   * Maximum number of items in a drop zone
   */
  maxItems?: number;
  
  /**
   * Whether items can be reordered within a zone
   */
  allowReordering?: boolean;
  
  /**
   * Whether items can be moved between zones
   */
  allowMovingBetweenZones?: boolean;
}

/**
 * Sort strategies for drag-and-drop lists
 */
export enum SortStrategy {
  VERTICAL = 'vertical',
  HORIZONTAL = 'horizontal',
  GRID = 'grid'
}

/**
 * Configuration for draggable court tables
 */
export interface DraggableCourtConfig {
  /**
   * Whether court reordering is enabled
   */
  reorderingEnabled: boolean;
  
  /**
   * Whether match assignment is enabled
   */
  matchAssignmentEnabled: boolean;
  
  /**
   * Function called when courts are reordered
   */
  onCourtReorder?: (courts: Court[]) => void;
  
  /**
   * Function called when a match is assigned to a court
   */
  onMatchAssigned?: (matchId: string, courtId: string) => void;
}

/**
 * Sensor configuration for drag operations
 */
export interface DragSensorConfig {
  /**
   * Whether pointer sensor is enabled
   */
  pointerSensor: boolean;
  
  /**
   * Whether keyboard sensor is enabled
   */
  keyboardSensor: boolean;
  
  /**
   * Activation constraints for sensors
   */
  activationConstraint?: {
    /**
     * Delay in ms before drag starts
     */
    delay?: number;
    
    /**
     * Tolerance in pixels for movement before drag starts
     */
    tolerance?: number;
  };
}
