export type StorageType = 'local';  // s3を削除

export interface PathCheckRequest {
  path: string;
  type: StorageType;
}

export interface PathCheckResponse {
  exists: boolean;
  error?: string;
}