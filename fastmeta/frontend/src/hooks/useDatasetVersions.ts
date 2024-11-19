import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { DatasetVersion, DatasetNodeData } from '../types/dataset';

export const useDatasetVersions = (initialNode?: DatasetNodeData) => {
  const [versions, setVersions] = useState<DatasetVersion[]>(
    initialNode?.datasetVersions || []
  );
  const [currentVersion, setCurrentVersion] = useState<string | undefined>(
    initialNode?.currentVersion
  );

  // 新しいバージョンを作成
  const createVersion = (path: string, description: string, metadata?: DatasetVersion['metadata']) => {
    const newVersion: DatasetVersion = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      path,
      description,
      metadata
    };

    setVersions(prev => [...prev, newVersion]);
    setCurrentVersion(newVersion.id);

    return newVersion;
  };

  // バージョンを切り替え
  const switchVersion = (versionId: string) => {
    const version = versions.find(v => v.id === versionId);
    if (version) {
      setCurrentVersion(versionId);
      return version;
    }
    return null;
  };

  // バージョンを削除
  const deleteVersion = (versionId: string) => {
    setVersions(prev => prev.filter(v => v.id !== versionId));
    if (currentVersion === versionId) {
      const remaining = versions.filter(v => v.id !== versionId);
      setCurrentVersion(remaining[remaining.length - 1]?.id);
    }
  };

  // バージョン情報をエクスポート
  const exportVersions = () => {
    return JSON.stringify({
      versions,
      currentVersion
    }, null, 2);
  };

  // バージョン情報をインポート
  const importVersions = (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.versions)) {
        setVersions(data.versions);
        setCurrentVersion(data.currentVersion);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import versions:', error);
      return false;
    }
  };

  // ノードデータの更新に使用するバージョン情報
  const getVersionData = () => ({
    datasetVersions: versions,
    currentVersion
  });

  return {
    versions,
    currentVersion,
    createVersion,
    switchVersion,
    deleteVersion,
    exportVersions,
    importVersions,
    getVersionData
  };
};