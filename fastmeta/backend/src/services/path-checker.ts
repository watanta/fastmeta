import fs from 'fs/promises';
import path from 'path';
import { StorageType } from '../types';

export class PathChecker {
  async checkPath(filePath: string, type: StorageType): Promise<boolean> {
    try {
      if (!path.isAbsolute(filePath)) {
        throw new Error('Absolute path is required. Example: /home/user/file.txt or C:\\Users\\user\\file.txt');
      }

      console.log('Checking path:', {
        path: filePath,
        exists: await fs.access(filePath).then(() => true).catch(() => false)
      });

      await fs.access(filePath);
      return true;
    } catch (error) {
      console.error('Path check failed:', {
        path: filePath,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }
}