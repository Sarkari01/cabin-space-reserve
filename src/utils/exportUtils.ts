import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';
import { format } from 'date-fns';

export type ExportFormat = 'csv' | 'excel' | 'pdf';

export interface ExportColumn {
  key: string;
  title: string;
  format?: (value: any) => string;
}

export interface ExportData {
  [key: string]: any;
}

// Format currency values
export const formatCurrency = (value: number | string): string => {
  if (value === null || value === undefined) return '₹0.00';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '₹0.00';
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
};

// Format date values
export const formatDate = (value: string | Date): string => {
  const date = typeof value === 'string' ? new Date(value) : value;
  return format(date, 'dd/MM/yyyy');
};

// Format datetime values
export const formatDateTime = (value: string | Date): string => {
  const date = typeof value === 'string' ? new Date(value) : value;
  return format(date, 'dd/MM/yyyy HH:mm');
};

// Generate filename with timestamp
export const generateFilename = (baseName: string, exportFormat: ExportFormat): string => {
  const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
  const extension = exportFormat === 'excel' ? 'xlsx' : exportFormat;
  return `${baseName}_${timestamp}.${extension}`;
};

// Transform data based on columns configuration
export const transformDataForExport = (data: ExportData[], columns: ExportColumn[]): any[] => {
  return data.map(row => {
    const transformedRow: any = {};
    columns.forEach(col => {
      const value = row[col.key];
      transformedRow[col.title] = col.format ? col.format(value) : value || '';
    });
    return transformedRow;
  });
};

// Export to CSV
export const exportToCSV = (data: ExportData[], columns: ExportColumn[], filename: string): void => {
  try {
    const transformedData = transformDataForExport(data, columns);
    const csv = Papa.unparse(transformedData);
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', generateFilename(filename, 'csv'));
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    throw new Error('Failed to export CSV file');
  }
};

// Export to Excel
export const exportToExcel = (data: ExportData[], columns: ExportColumn[], filename: string): void => {
  try {
    const transformedData = transformDataForExport(data, columns);
    
    const worksheet = XLSX.utils.json_to_sheet(transformedData);
    const workbook = XLSX.utils.book_new();
    
    // Set column widths
    const colWidths = columns.map(() => ({ wch: 20 }));
    worksheet['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    XLSX.writeFile(workbook, generateFilename(filename, 'excel'));
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error('Failed to export Excel file');
  }
};

// Export to PDF
export const exportToPDF = (data: ExportData[], columns: ExportColumn[], filename: string, title?: string): void => {
  try {
    const doc = new jsPDF();
    
    // Add title if provided
    if (title) {
      doc.setFontSize(16);
      doc.text(title, 20, 20);
    }
    
    // Prepare data for PDF table
    const transformedData = transformDataForExport(data, columns);
    const headers = columns.map(col => col.title);
    const rows = transformedData.map(row => columns.map(col => row[col.title] || ''));
    
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: title ? 30 : 20,
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [71, 85, 105], // slate-600
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252], // slate-50
      },
      margin: { top: 20, right: 15, bottom: 20, left: 15 },
    });
    
    doc.save(generateFilename(filename, 'pdf'));
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw new Error('Failed to export PDF file');
  }
};

// Main export function
export const exportData = async (
  data: ExportData[],
  columns: ExportColumn[],
  format: ExportFormat,
  filename: string,
  title?: string
): Promise<void> => {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  switch (format) {
    case 'csv':
      exportToCSV(data, columns, filename);
      break;
    case 'excel':
      exportToExcel(data, columns, filename);
      break;
    case 'pdf':
      exportToPDF(data, columns, filename, title);
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
};