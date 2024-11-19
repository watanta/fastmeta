import React from 'react';
import type { DatasetVersion } from '../types/dataset';

interface DatasetVersionControlProps {
  versions: DatasetVersion[];
  currentVersion?: string;
  onVersionCreate: (path: string, description: string) => void;
  onVersionSwitch: (versionId: string) => void;
  onVersionDelete: (versionId: string) => void;
  onExport: () => void;
  onImport: () => void;
}

const DatasetVersionControl: React.FC<DatasetVersionControlProps> = ({
  versions,
  currentVersion,
  onVersionCreate,
  onVersionSwitch,
  onVersionDelete,
  onExport,
  onImport
}) => {
  const handleCreateVersion = () => {
    const path = prompt('データセットのパスを入力してください：');
    if (!path) return;

    const description = prompt('バージョンの説明を入力してください：');
    if (!description) return;

    onVersionCreate(path, description);
  };

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '15px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '15px'
      }}>
        <h4 style={{ margin: 0 }}>データセットバージョン</h4>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleCreateVersion}
            style={{
              padding: '6px 12px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            新規バージョン
          </button>
          <button
            onClick={onExport}
            style={{
              padding: '6px 12px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            エクスポート
          </button>
          <button
            onClick={onImport}
            style={{
              padding: '6px 12px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            インポート
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {versions.length === 0 ? (
          <div style={{ 
            padding: '15px', 
            textAlign: 'center', 
            color: '#666',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px',
            fontStyle: 'italic'
          }}>
            バージョン履歴がありません
          </div>
        ) : (
          versions.map(version => (
            <div 
              key={version.id}
              style={{
                padding: '12px',
                backgroundColor: version.id === currentVersion ? '#e8f5e9' : '#f8f9fa',
                border: `1px solid ${version.id === currentVersion ? '#4CAF50' : '#e9ecef'}`,
                borderRadius: '4px',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <span style={{ 
                  fontSize: '0.85rem',
                  color: '#666',
                  fontFamily: 'monospace'
                }}>
                  {new Date(version.timestamp).toLocaleString()}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => onVersionSwitch(version.id)}
                    disabled={version.id === currentVersion}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: version.id === currentVersion ? '#ccc' : '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: version.id === currentVersion ? 'not-allowed' : 'pointer',
                      fontSize: '0.8rem'
                    }}
                  >
                    切り替え
                  </button>
                  <button
                    onClick={() => onVersionDelete(version.id)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                  >
                    削除
                  </button>
                </div>
              </div>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                color: '#0066cc',
                marginBottom: '6px',
                wordBreak: 'break-all'
              }}>
                {version.path}
              </div>
              <div style={{
                fontSize: '0.9rem',
                color: '#333',
                lineHeight: '1.4'
              }}>
                {version.description}
              </div>
              {version.metadata && (
                <div style={{
                  display: 'flex',
                  gap: '15px',
                  marginTop: '8px',
                  fontSize: '0.85rem',
                  color: '#666'
                }}>
                  {version.metadata.rowCount && (
                    <span>行数: {version.metadata.rowCount}</span>
                  )}
                  {version.metadata.size && (
                    <span>サイズ: {(version.metadata.size / 1024 / 1024).toFixed(2)} MB</span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DatasetVersionControl;