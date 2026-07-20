import { HTTPException } from 'hono/http-exception';
import { importService } from '../services/import-service.js';

export const importController = {
  importStudents: async (c: any) => {
    const contentType = c.req.header('content-type') ?? '';
    if (!contentType.includes('multipart/form-data')) {
      throw new HTTPException(400, { message: 'Expected multipart/form-data with a "file" field' });
    }
    const body = await c.req.parseBody();
    const file = body.file;
    if (!file || typeof file === 'string') {
      throw new HTTPException(400, { message: 'No file uploaded' });
    }
    const XLSX = await import('xlsx');
    const arrayBuffer = await (file as File).arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new HTTPException(400, { message: 'Spreadsheet is empty' });
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName]!);
    const result = await importService.importStudents(rows);
    return c.json(result, 200);
  },
};
