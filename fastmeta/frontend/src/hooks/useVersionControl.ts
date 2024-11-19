import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Version, VersionHistory } from '../types/version';
import type { NodeData, Edge } from '../types/index';

export const useVersionControl = () => {
  const [versionHistory, setVersionHistory] = useState<VersionHistory>({
    versions: [],
    currentVersion: ''
  });

  // 新しいバージョンを作成
  const createVersion = (
    nodes: NodeData[], 
    edges: Edge[], 
    description: string
  ) => {
    const newVersion: Version = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      description,
      data: { nodes, edges },
      author: 'Current User'  // TODO: 後でユーザー管理と連携
    };

    setVersionHistory(prev => ({
      versions: [...prev.versions, newVersion],
      currentVersion: newVersion.id
    }));

    return newVersion.id;
  };

  // 特定のバージョンに切り替え
  const switchVersion = (versionId: string) => {
    const version = versionHistory.versions.find(v => v.id === versionId);
    if (!version) return null;

    setVersionHistory(prev => ({
      ...prev,
      currentVersion: versionId
    }));

    return version;
  };

  // バージョン履歴のエクスポート
  const exportHistory = () => {
    return JSON.stringify(versionHistory, null, 2);
  };

  // バージョン履歴のインポート
  const importHistory = (jsonString: string) => {
    try {
      const imported = JSON.parse(jsonString) as VersionHistory;
      setVersionHistory(imported);
      return true;
    } catch (error) {
      console.error('Failed to import version history:', error);
      return false;
    }
  };

  return {
    versionHistory,
    createVersion,
    switchVersion,
    exportHistory,
    importHistory
  };
};