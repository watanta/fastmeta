export interface DatasetVersion {
    id: string;           // バージョンの一意識別子
    timestamp: string;    // バージョンの作成日時
    path: string;         // データセットファイルのパス
    description: string;  // バージョンの説明
    metadata?: {          // オプションのメタデータ
      size?: number;      // ファイルサイズ
      rowCount?: number;  // レコード数
      columns?: string[]; // カラム名
      [key: string]: any; // その他のメタデータ
    };
  }
  
  // NodeDataの型を拡張
  export interface DatasetNodeData extends NodeData {
    type: 'source';
    datasetVersions?: DatasetVersion[];
    currentVersion?: string;  // 現在選択中のバージョンID
  }