import Papa from 'papaparse';
import { ImportFormat, FileParseResult, ImportValidationResult, ImportTemplate, ImportTemplateType, RawTeamImportData, TeamImportData } from '@/types/import-export';
import { Division } from '@/types/tournament-enums';
import { TeamEntity, PlayerEntity } from '@/utils/adapters/teamAdapter';

/**
 * Parse a CSV file into an array of objects
 * @param file The CSV file to parse
 * @returns A promise resolving to the parse result
 */
export async function parseCSVFile(file: File): Promise<FileParseResult<any>> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Normalize column headers to lowercase and trim spaces
        const normalizedData = results.data.map((row: any) => {
          const normalizedRow: Record<string, any> = {};
          Object.keys(row).forEach((key) => {
            const normalizedKey = key.toLowerCase().trim().replace(/\s+/g, '_');
            normalizedRow[normalizedKey] = row[key];
          });
          return normalizedRow;
        });
        
        resolve({
          success: true,
          data: normalizedData,
          rawData: results.data,
          meta: {
            filename: file.name,
            type: file.type,
            size: file.size,
            headers: results.meta.fields
          }
        });
      },
      error: (error) => {
        resolve({
          success: false,
          error: error.message,
          meta: {
            filename: file.name,
            type: file.type,
            size: file.size
          }
        });
      }
    });
  });
}

/**
 * Parse an Excel file into an array of objects
 * @param file The Excel file to parse
 * @returns A promise resolving to the parse result
 */
export async function parseExcelFile(file: File): Promise<FileParseResult<any>> {
  try {
    // Dynamic import to handle browser/Node differences
    const ExcelJS = await import('exceljs');
    const WorkbookClass = ExcelJS.default?.Workbook || ExcelJS.Workbook;

    const arrayBuffer = await file.arrayBuffer();
    const workbook = new WorkbookClass();
    await workbook.xlsx.load(arrayBuffer);
    
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return {
        success: false,
        error: 'No worksheet found in Excel file',
        meta: {
          filename: file.name,
          type: file.type,
          size: file.size
        }
      };
    }
    
    const headers: string[] = [];
    const rows: any[] = [];
    
    // Extract headers from the first row
    worksheet.getRow(1).eachCell((cell, colNumber) => {
      headers[colNumber - 1] = cell.value?.toString().toLowerCase().trim().replace(/\s+/g, '_') || `column_${colNumber}`;
    });
    
    // Extract data rows
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header row
      
      const rowData: Record<string, any> = {};
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1];
        rowData[header] = cell.value;
      });
      
      rows.push(rowData);
    });
    
    return {
      success: true,
      data: rows,
      rawData: rows,
      meta: {
        filename: file.name,
        type: file.type,
        size: file.size,
        headers
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      meta: {
        filename: file.name,
        type: file.type,
        size: file.size
      }
    };
  }
}

/**
 * Validate team import data against expected structure
 * @param data Raw data from import file
 * @returns Validation result with valid and invalid items
 */
export function validateTeamData(data: RawTeamImportData[]): ImportValidationResult<TeamImportData> {
  const validItems: TeamImportData[] = [];
  const invalidItems: Array<{ row: number; data: any; errors: string[] }> = [];
  
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const errors: string[] = [];
    
    // Get team name from either 'team_name' or 'name' fields
    const teamName = item.team_name || item.name;
    if (!teamName) {
      errors.push('Team name is required');
    }
    
    // Check division if provided
    const division = item.division;
    if (division && !Object.values(Division).includes(division as Division)) {
      errors.push(`Invalid division: ${division}`);
    }
    
    // Extract players - handle different formats
    const players: { name: string; email?: string; phone?: string }[] = [];
    
    // Format 1: player1_name, player2_name, etc.
    if (item.player1_name || item.player_1_name) {
      const player1Name = item.player1_name || item.player_1_name;
      if (player1Name) {
        players.push({
          name: player1Name,
          email: item.player1_email || item.player_1_email,
          phone: item.player1_phone || item.player_1_phone
        });
      }
      
      const player2Name = item.player2_name || item.player_2_name;
      if (player2Name) {
        players.push({
          name: player2Name,
          email: item.player2_email || item.player_2_email,
          phone: item.player2_phone || item.player_2_phone
        });
      }
    }
    // Format 2: player_name, player_email, player_phone
    else if (item.player_name) {
      players.push({
        name: item.player_name,
        email: item.player_email,
        phone: item.player_phone
      });
    }
    // Format 3: players as JSON string
    else if (typeof item.players === 'string') {
      try {
        const parsedPlayers = JSON.parse(item.players);
        if (Array.isArray(parsedPlayers)) {
          parsedPlayers.forEach((player: any) => {
            if (player.name) {
              players.push({
                name: player.name,
                email: player.email,
                phone: player.phone
              });
            }
          });
        }
      } catch (e) {
        errors.push('Invalid players data format');
      }
    }
    // Format 4: players already as array
    else if (Array.isArray(item.players)) {
      item.players.forEach((player: any) => {
        if (player.name) {
          players.push({
            name: player.name,
            email: player.email,
            phone: player.phone
          });
        }
      });
    }
    
    if (players.length === 0) {
      errors.push('At least one player is required');
    }
    
    if (errors.length > 0) {
      invalidItems.push({
        row: i + 2, // +2 because of 1-based indexing and header row
        data: item,
        errors
      });
    } else {
      validItems.push({
        name: teamName,
        division: division as string,
        players
      });
    }
  }
  
  return {
    isValid: invalidItems.length === 0,
    validItems,
    invalidItems,
    summary: {
      total: data.length,
      valid: validItems.length,
      invalid: invalidItems.length
    }
  };
}

/**
 * Generate a downloadable CSV template for team imports
 * @param templateType The type of template to generate
 * @returns A Blob containing the CSV template
 */
export function generateCSVTemplate(templateType: ImportTemplateType): Blob {
  const template = getImportTemplate(templateType);
  
  // Create CSV header row
  const csv = [
    template.headers.join(','),
    // Add example data rows if available
    ...(template.exampleData?.map(row => row.join(',')) || [])
  ].join('\n');
  
  return new Blob([csv], { type: 'text/csv' });
}

/**
 * Get template definition for a specific import type
 * @param templateType The type of template
 * @returns Template definition
 */
function getImportTemplate(templateType: ImportTemplateType): ImportTemplate {
  switch (templateType) {
    case ImportTemplateType.TEAMS:
      return {
        headers: [
          'team_name',
          'division',
          'player1_name',
          'player1_email',
          'player1_phone',
          'player2_name',
          'player2_email',
          'player2_phone'
        ],
        exampleData: [
          ['Team Alpha', 'ADVANCED', 'John Doe', 'john@example.com', '555-1234', 'Jane Smith', 'jane@example.com', '555-5678'],
          ['Team Beta', 'INTERMEDIATE', 'Alice Johnson', 'alice@example.com', '555-9876', '', '', '']
        ],
        headerDescriptions: {
          'team_name': 'Name of the team (required)',
          'division': 'Team division (BEGINNER, INTERMEDIATE, ADVANCED, etc.)',
          'player1_name': 'Name of first player (required)',
          'player1_email': 'Email of first player',
          'player1_phone': 'Phone number of first player',
          'player2_name': 'Name of second player',
          'player2_email': 'Email of second player',
          'player2_phone': 'Phone number of second player'
        },
        requiredFields: ['team_name', 'player1_name']
      };
    case ImportTemplateType.PLAYERS:
      return {
        headers: [
          'name',
          'email',
          'phone',
          'team_name'
        ],
        exampleData: [
          ['John Doe', 'john@example.com', '555-1234', 'Team Alpha'],
          ['Jane Smith', 'jane@example.com', '555-5678', 'Team Alpha']
        ],
        headerDescriptions: {
          'name': 'Name of the player (required)',
          'email': 'Email address',
          'phone': 'Phone number',
          'team_name': 'Team name to assign player to'
        },
        requiredFields: ['name']
      };
    default:
      return {
        headers: [],
        exampleData: [],
        requiredFields: []
      };
  }
}

/**
 * Convert teams array to CSV format
 * @param teams Array of teams to export
 * @returns CSV string
 */
export function exportTeamsToCSV(teams: TeamEntity[]): string {
  // Flatten teams and players into rows
  const rows = teams.flatMap(team => {
    // For teams with no players, create a single row
    if (!team.players || team.players.length === 0) {
      return [{
        team_name: team.name,
        division: team.division || '',
        player_name: '',
        player_email: '',
        player_phone: ''
      }];
    }
    
    // For teams with players, create one row per player
    return team.players.map(player => ({
      team_name: team.name,
      division: team.division || '',
      player_name: player.name,
      player_email: player.email || '',
      player_phone: player.phone || ''
    }));
  });
  
  // Generate CSV
  return Papa.unparse(rows);
}

/**
 * Convert teams array to Excel format
 * @param teams Array of teams to export
 * @returns Promise resolving to Excel file as buffer
 */
export async function exportTeamsToExcel(teams: TeamEntity[]): Promise<Blob> {
  // Dynamic import to handle browser/Node differences
  const ExcelJS = await import('exceljs');
  const WorkbookClass = ExcelJS.default?.Workbook || ExcelJS.Workbook;

  const workbook = new WorkbookClass();
  const worksheet = workbook.addWorksheet('Teams');
  
  // Add headers
  worksheet.columns = [
    { header: 'Team Name', key: 'teamName' },
    { header: 'Division', key: 'division' },
    { header: 'Player Name', key: 'playerName' },
    { header: 'Player Email', key: 'playerEmail' },
    { header: 'Player Phone', key: 'playerPhone' }
  ];
  
  // Add rows
  teams.forEach(team => {
    if (!team.players || team.players.length === 0) {
      worksheet.addRow({
        teamName: team.name,
        division: team.division || '',
        playerName: '',
        playerEmail: '',
        playerPhone: ''
      });
    } else {
      team.players.forEach(player => {
        worksheet.addRow({
          teamName: team.name,
          division: team.division || '',
          playerName: player.name,
          playerEmail: player.email || '',
          playerPhone: player.phone || ''
        });
      });
    }
  });
  
  // Style the header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD3D3D3' }
  };
  
  // Auto size columns
  worksheet.columns.forEach(column => {
    let maxLength = 0;
    if (column.values) {
      column.values.forEach((value) => {
        if (value !== null && value !== undefined) {
          const valueLength = value.toString().length;
          if (valueLength > maxLength) {
            maxLength = valueLength;
          }
        }
      });
    }
    column.width = Math.max(maxLength + 2, 12);
  });
  
  // Generate Excel buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Trigger a file download in the browser
 * @param content File content as string or Blob
 * @param filename Name for the downloaded file
 */
export function downloadFile(content: string | Blob, filename: string): void {
  // Create a blob if content is string
  const blob = typeof content === 'string' 
    ? new Blob([content], { type: 'text/csv;charset=utf-8;' }) 
    : content;
  
  // Create download link
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  
  // Append to document, trigger click, then remove
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }, 100);
}
