import React, { useState, useEffect } from 'react';
import { useDatasetVersions } from '../hooks/useDatasetVersions';
import DatasetVersionControl from './DatasetVersionControl';
import type { NodeData } from '../types/index';
import type { DatasetNodeData } from '../types/dataset';
import '../styles/DatasetVersionControl.css';

// ノードタイプの定義
const NODE_TYPES = [
  { value: 'source', label: 'データソース' },
  { value: 'transform', label: '変換' },
  { value: 'output', label: '出力' }
] as const;

type NodeType = typeof NODE_TYPES[number]['value'];

interface NodeEditPanelProps {
  node: NodeData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (node: NodeData) => void;
}

const validatePath = async (path: string): Promise<boolean> => {
  try {
    const response = await fetch('http://localhost:3001/api/check-path', {  // /apiを追加
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: path,
        type: 'local'
      })
    });
    
    if (!response.ok) {
      throw new Error('Path validation failed');
    }
    
    const data = await response.json();
    return data.exists;
  } catch (error) {
    console.error('Path validation error:', error);
    return false;
  }
};

const NodeEditPanel: React.FC<NodeEditPanelProps> = ({
  node,
  isOpen,
  onClose,
  onSave
}) => {
  const [editedNode, setEditedNode] = useState<NodeData | null>(null);
  const [pathValidationStates, setPathValidationStates] = useState<{[key: string]: boolean}>({});
  const isDatasetNode = editedNode?.type === 'source';

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
      // 初期パス検証状態をリセット
      setPathValidationStates({});
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
    // パス入力時は検証状態をリセット
    setPathValidationStates(prev => ({
      ...prev,
      [key]: undefined
    }));
  };

  const handleAddProperty = () => {
    const key = prompt('プロパティ名を入力してください:');
    if (!key) return;

    setEditedNode(prev => {
      if (!prev) return null;
      return {
        ...prev,
        properties: {
          ...prev.properties,
          [key]: ''
        }
      };
    });
  };

  const handleAddPathProperty = () => {
    const key = prompt('パスプロパティ名を入力してください:');
    if (!key) return;

    setEditedNode(prev => {
      if (!prev) return null;
      return {
        ...prev,
        pathProperties: {
          ...prev.pathProperties,
          [key]: ''
        }
      };
    });
    
    // 新しいパスプロパティの検証状態を初期化
    setPathValidationStates(prev => ({
      ...prev,
      [key]: undefined
    }));
  };

  const handleSave = () => {
    if (editedNode) {
      if (isDatasetNode) {
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
        <label style={{ display: 'block', marginBottom: '5px' }}>タイプ</label>
        <select
          value={editedNode.type || 'transform'}
          onChange={e => setEditedNode(prev => prev ? { 
            ...prev, 
            type: e.target.value as NodeType 
          } : null)}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: 'white'
          }}
        >
          {NODE_TYPES.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
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
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '5px' 
        }}>
          <label>プロパティ</label>
          <button
            onClick={handleAddProperty}
            style={{
              padding: '4px 8px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            追加
          </button>
        </div>
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
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '5px' 
        }}>
          <label>パスプロパティ</label>
          <button
            onClick={handleAddPathProperty}
            style={{
              padding: '4px 8px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            追加
          </button>
        </div>
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
            <div style={{ position: 'relative', width: '60%', display: 'flex', gap: '5px' }}>
              <input
                type="text"
                value={value}
                onChange={e => handlePathPropertyChange(key, e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px',
                  paddingRight: '30px',
                  border: `1px solid ${pathValidationStates[key] === false ? '#f44336' : 
                    pathValidationStates[key] === true ? '#4CAF50' : '#ddd'}`,
                  borderRadius: '4px'
                }}
              />
              <button
                onClick={() => validatePath(value).then(isValid => 
                  setPathValidationStates(prev => ({
                    ...prev,
                    [key]: isValid
                  }))
                )}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  whiteSpace: 'nowrap'
                }}
              >
                パスチェック
              </button>
              <div style={{
                position: 'absolute',
                right: '80px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: pathValidationStates[key] === false ? '#f44336' : 
                  pathValidationStates[key] === true ? '#4CAF50' : '#999',
                fontSize: '16px'
              }}>
                {pathValidationStates[key] === false ? '✗' : 
                  pathValidationStates[key] === true ? '✓' : '?'}
              </div>
            </div>
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