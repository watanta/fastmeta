import type { NodeData, Edge } from './index';

export interface Version {
  id: string;           // バージョンの一意識別子
  timestamp: string;    // 作成日時
  description: string;  // バージョンの説明
  data: {
    nodes: NodeData[];  // ノードデータ
    edges: Edge[];      // エッジデータ
  };
  author: string;       // 作成者
}

export interface VersionHistory {
  versions: Version[];     // バージョンの配列
  currentVersion: string;  // 現在選択中のバージョンID
}