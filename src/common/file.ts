import fs from 'fs';
import path from 'path';

interface fileParams {
  data: any;
  status: string;
  code: number | null;
  endPoint: string;
  message: string;
}

/** Appends request outcomes to logs/<success|failure>/<date>.txt in the project root. */
class FS {
  static formatDate = () => new Date().toISOString().slice(0, 10);

  static writeText(data: fileParams) {
    const status = data?.status === 'success' ? 'success' : 'failure';
    const dir = path.resolve(process.cwd(), 'logs', status);
    try {
      fs.mkdirSync(dir, { recursive: true });
      const entry = JSON.stringify({ ...data, at: new Date().toISOString() }) + '\n';
      fs.appendFile(path.join(dir, `${FS.formatDate()}.txt`), entry, (err) => {
        if (err) console.error('Failed to write log:', err.message);
      });
    } catch (err: any) {
      console.error('Failed to write log:', err.message);
    }
  }
}

export default FS;
