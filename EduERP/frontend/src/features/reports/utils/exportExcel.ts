import * as XLSX from 'xlsx';

/**
 * Exports an array of objects to an Excel (.xlsx) file and triggers a browser download.
 * @param data     Array of row objects (keys become column headers)
 * @param filename Download filename WITHOUT extension (e.g. "attendance_report")
 * @param sheetName Optional worksheet tab name (default "Report")
 */
export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  sheetName = 'Report',
): void {
  const worksheet  = XLSX.utils.json_to_sheet(data);
  const workbook   = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
