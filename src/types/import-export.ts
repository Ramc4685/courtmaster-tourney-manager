import { Team, Player } from './tournament.d';

/**
 * Supported file formats for import and export operations
 */
export enum ImportFormat {
  CSV = 'csv',
  EXCEL = 'excel',
  JSON = 'json'
}

/**
 * Base structure for team import data
 */
export interface TeamImportData {
  name: string;
  division: string;
  players: {
    name: string;
    email?: string;
    phone?: string;
  }[];
}

/**
 * Extended team import data with optional fields for validation
 */
export interface RawTeamImportData {
  name: string;
  division?: string;
  players?: string | any[];
  player1Name?: string;
  player2Name?: string;
  player1Email?: string;
  player2Email?: string;
  player1Phone?: string;
  player2Phone?: string;
  [key: string]: any;
}

/**
 * Result of validation on imported data
 */
export interface ImportValidationResult<T> {
  /**
   * Whether the data passes validation
   */
  isValid: boolean;
  /**
   * Validated data items
   */
  validItems: T[];
  /**
   * Invalid data items with error information
   */
  invalidItems: Array<{
    row: number;
    data: any;
    errors: string[];
  }>;
  /**
   * Summary of validation results
   */
  summary: {
    total: number;
    valid: number;
    invalid: number;
  };
}

/**
 * Configuration options for exports
 */
export interface ExportOptions {
  /**
   * Format to export in
   */
  format: ImportFormat;
  /**
   * Filter by division ID
   */
  divisionId?: string;
  /**
   * Include specific fields
   */
  includeFields?: string[];
  /**
   * Header field mapping (display name to field name)
   */
  headerMap?: Record<string, string>;
  /**
   * Only export selected items
   */
  selectedOnly?: boolean;
  /**
   * IDs of items to export when selectedOnly is true
   */
  selectedIds?: string[];
}

/**
 * Status information for ongoing import operations
 */
export interface ImportProgress {
  /**
   * Current status of the import
   */
  status: 'idle' | 'parsing' | 'validating' | 'importing' | 'completed' | 'error';
  /**
   * Total number of items to process
   */
  total: number;
  /**
   * Number of items processed so far
   */
  processed: number;
  /**
   * Number of items successfully processed
   */
  success: number;
  /**
   * Number of items that failed processing
   */
  failed: number;
  /**
   * Optional error message
   */
  error?: string;
}

/**
 * Status information for ongoing export operations
 */
export interface ExportProgress {
  /**
   * Current status of the export
   */
  status: 'idle' | 'preparing' | 'exporting' | 'completed' | 'error';
  /**
   * Total number of items to process
   */
  total: number;
  /**
   * Number of items processed so far
   */
  processed: number;
  /**
   * Optional error message
   */
  error?: string;
}

/**
 * Result of file parsing operation
 */
export interface FileParseResult<T> {
  /**
   * Whether the parsing was successful
   */
  success: boolean;
  /**
   * Parsed data
   */
  data?: T[];
  /**
   * Original raw data (used for debugging)
   */
  rawData?: any[];
  /**
   * Error message if parsing failed
   */
  error?: string;
  /**
   * File metadata
   */
  meta?: {
    /**
     * Original filename
     */
    filename: string;
    /**
     * File type
     */
    type: string;
    /**
     * File size in bytes
     */
    size: number;
    /**
     * Headers detected from the file
     */
    headers?: string[];
  };
}

/**
 * Structured error information for import errors
 */
export interface ImportError {
  /**
   * Error type identifier
   */
  type: 'parse' | 'validation' | 'import' | 'unknown';
  /**
   * Error message
   */
  message: string;
  /**
   * Row number where error occurred
   */
  row?: number;
  /**
   * Column name or index where error occurred
   */
  column?: string | number;
  /**
   * Raw data that caused the error
   */
  data?: any;
}

/**
 * Template for CSV/Excel import
 */
export interface ImportTemplate {
  /**
   * Headers for the template
   */
  headers: string[];
  /**
   * Example data rows
   */
  exampleData?: any[][];
  /**
   * Header descriptions for documentation
   */
  headerDescriptions?: Record<string, string>;
  /**
   * Indicates if the header is required
   */
  requiredFields: string[];
}

/**
 * CSV template formats
 */
export enum ImportTemplateType {
  TEAMS = 'teams',
  PLAYERS = 'players',
  MATCHES = 'matches',
  COURTS = 'courts',
  DIVISIONS = 'divisions'
}
