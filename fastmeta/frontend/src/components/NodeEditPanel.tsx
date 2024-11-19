import React, { useState, useEffect } from 'react';
import { useDatasetVersions } from '../hooks/useDatasetVersions';
import DatasetVersionControl from './DatasetVersionControl';
import type { NodeData } from '../types/index';
import type { DatasetNodeData } from '../types/dataset';
import '../styles/DatasetVersionControl.css';

interface NodeEditPanelProps {
  node: NodeData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (node: NodeData) => void;
}

const NodeEditPanel: React.FC<NodeEditPanelProps> = ({
  node,
  isOpen,
  onClose,
  onSave
}) => {
  const [editedNode, setEditedNode] = useState<NodeData | null>(null);
  const isDatasetNode = node?.type === 'source';

  // データセットバージョン管理フックの初期化
  const {
    versions,
    currentVersion,
    createVersion,
    switchVersion,
    deleteVersion,
    exportVersions,
    importVersions,
    getVersionData
  } = useDatasetVersions(node as DatasetNodeData);

  useEffect(() => {
    if (node) {
      setEditedNode({ ...node });
    }
  }, [node]);

  if (!editedNode) return null;

  const handlePropertyChange = (key: string, value: string) => {
    setEditedNode(prev => {
      if (!prev) return null;
      return {
        ...prev,
        properties: {
          ...prev.properties,
          [key]: value
        }
      };
    });
  };

  const handlePathPropertyChange = (key: string, value: string) => {
    setEditedNode(prev => {
      if (!prev) return null;
      return {
        ...prev,
        pathProperties: {
          ...prev.pathProperties,
          [key]: value
        }
      };
    });
  };

  const handleSave = () => {
    if (editedNode) {
      if (isDatasetNode) {
        // データセットノードの場合、バージョン情報も含めて保存
        onSave({
          ...editedNode,
          ...getVersionData()
        });
      } else {
        onSave(editedNode);
      }
    }
    onClose();
  };

  const handleVersionCreate = (path: string, description: string) => {
    // TODO: ここでメタデータを取得する処理を追加
    const metadata = {
      size: 0,
      rowCount: 0,
      columns: []
    };
    createVersion(path, description, metadata);
  };

  const handleVersionExport = () => {
    const json = exportVersions();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dataset-versions-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleVersionImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          importVersions(content);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: isOpen ? 0 : '-400px',
      width: '400px',
      height: '100vh',
      backgroundColor: 'white',
      boxShadow: '-2px 0 5px rgba(0,0,0,0.1)',
      transition: 'right 0.3s ease',
      overflowY: 'auto',
      padding: '20px',
      zIndex: 1000
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: 0 }}>ノード編集</h3>
        <button 
          onClick={onClose}
          style={{
            border: 'none',
            background: 'none',
            fontSize: '20px',
            cursor: 'pointer'
          }}
        >
          ×
        </button>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>ラベル</label>
        <input
          type="text"
          value={editedNode.label}
          onChange={e => setEditedNode(prev => prev ? { ...prev, label: e.target.value } : null)}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>説明</label>
        <textarea
          value={editedNode.description || ''}
          onChange={e => setEditedNode(prev => prev ? { ...prev, description: e.target.value } : null)}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            minHeight: '100px'
          }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>プロパティ</label>
        {Object.entries(editedNode.properties || {}).map(([key, value]) => (
          <div key={key} style={{ 
            display: 'flex', 
            gap: '10px',
            marginBottom: '5px' 
          }}>
            <input
              type="text"
              value={key}
              disabled
              style={{
                width: '40%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: '#f5f5f5'
              }}
            />
            <input
              type="text"
              value={value}
              onChange={e => handlePropertyChange(key, e.target.value)}
              style={{
                width: '60%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>パスプロパティ</label>
        {Object.entries(editedNode.pathProperties || {}).map(([key, value]) => (
          <div key={key} style={{ 
            display: 'flex', 
            gap: '10px',
            marginBottom: '5px' 
          }}>
            <input
              type="text"
              value={key}
              disabled
              style={{
                width: '40%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: '#f5f5f5'
              }}
            />
            <input
              type="text"
              value={value}
              onChange={e => handlePathPropertyChange(key, e.target.value)}
              style={{
                width: '60%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>
        ))}
      </div>

      {isDatasetNode && (
        <div style={{ marginBottom: '15px' }}>
          <DatasetVersionControl
            versions={versions}
            currentVersion={currentVersion}
            onVersionCreate={handleVersionCreate}
            onVersionSwitch={switchVersion}
            onVersionDelete={deleteVersion}
            onExport={handleVersionExport}
            onImport={handleVersionImport}
          />
        </div>
      )}

      <div style={{
        marginTop: '20px',
        display: 'flex',
        gap: '10px',
        justifyContent: 'flex-end'
      }}>
        <button 
          onClick={handleSave}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          保存
        </button>
        <button 
          onClick={onClose}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f0f0f0',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          キャンセル
        </button>
      </div>
    </div>
  );
};

export default NodeEditPanel;