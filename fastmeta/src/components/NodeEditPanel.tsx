import React, { useState, useEffect } from 'react';

// window.electron の型定義
declare global {
  interface Window {
    electron: {
      checkPath: (path: string) => Promise<boolean>;
    };
  }
}

interface NodeData {
  id: number;
  label: string;
  description?: string;
  type?: 'source' | 'transform' | 'output';
  properties?: {
    [key: string]: string;
  };
  pathProperties?: {
    [key: string]: string;
  };
}

interface NodeEditPanelProps {
  node: NodeData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (node: NodeData) => void;
}

function NodeEditPanel({ node, isOpen, onClose, onSave }: NodeEditPanelProps) {
  const [editedNode, setEditedNode] = useState<NodeData | null>(null);
  const [properties, setProperties] = useState<{key: string, value: string}[]>([]);
  const [pathProperties, setPathProperties] = useState<{key: string, value: string}[]>([]);
  const [pathValidationStates, setPathValidationStates] = useState<{[key: string]: boolean | null}>({});


  useEffect(() => {
    if (node) {
      setEditedNode(node);
      setProperties(
        Object.entries(node.properties || {}).map(([key, value]) => ({ key, value }))
      );
      setPathProperties(
        Object.entries(node.pathProperties || {}).map(([key, value]) => ({ key, value }))
      );
    }
  }, [node]);

  const handleSave = () => {
    if (editedNode) {
      const updatedNode = {
        ...editedNode,
        properties: properties.reduce((acc, { key, value }) => {
          if (key) acc[key] = value;
          return acc;
        }, {} as {[key: string]: string}),
        pathProperties: pathProperties.reduce((acc, { key, value }) => {
          if (key) acc[key] = value;
          return acc;
        }, {} as {[key: string]: string})
      };
      onSave(updatedNode);
    }
    onClose();
  };

  const handleCheckPath = async (key: string, path: string) => {
    try {
      const exists = await window.electron.checkPath(path);
      setPathValidationStates(prev => ({
        ...prev,
        [key]: exists
      }));
    } catch (error) {
      console.error('Path check failed:', error);
      setPathValidationStates(prev => ({
        ...prev,
        [key]: false
      }));
    }
  };

  const getValidationColor = (key: string): string => {
    const state = pathValidationStates[key];
    if (state === null) return '#808080'; // 未チェック
    return state ? '#4CAF50' : '#f44336'; // 成功は緑、失敗は赤
  };

  if (!isOpen || !editedNode) return null;

  return (
    <div className="side-panel" style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '400px',
      height: '100vh',
      backgroundColor: 'white',
      boxShadow: '-2px 0 5px rgba(0,0,0,0.1)',
      padding: '20px',
      overflowY: 'auto',
      transition: 'transform 0.3s ease',
      transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
      zIndex: 1000
    }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>ノード編集</h2>
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
        <label>ラベル:</label>
        <input
          type="text"
          value={editedNode.label}
          onChange={(e) => setEditedNode({...editedNode, label: e.target.value})}
          style={{ width: '100%', marginTop: '5px', padding: '5px' }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label>タイプ:</label>
        <select
          value={editedNode.type || 'transform'}
          onChange={(e) => setEditedNode({...editedNode, type: e.target.value as NodeData['type']})}
          style={{ width: '100%', marginTop: '5px', padding: '5px' }}
        >
          <option value="source">データソース</option>
          <option value="transform">データ変換</option>
          <option value="output">出力</option>
        </select>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label>説明:</label>
        <textarea
          value={editedNode.description || ''}
          onChange={(e) => setEditedNode({...editedNode, description: e.target.value})}
          style={{ width: '100%', marginTop: '5px', padding: '5px', minHeight: '100px' }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label>プロパティ:</label>
        {properties.map((prop, index) => (
          <div key={index} style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
            <input
              placeholder="キー"
              value={prop.key}
              onChange={(e) => {
                const newProps = [...properties];
                newProps[index].key = e.target.value;
                setProperties(newProps);
              }}
              style={{ flex: 1, padding: '5px' }}
            />
            <input
              placeholder="値"
              value={prop.value}
              onChange={(e) => {
                const newProps = [...properties];
                newProps[index].value = e.target.value;
                setProperties(newProps);
              }}
              style={{ flex: 1, padding: '5px' }}
            />
            <button onClick={() => {
              setProperties(properties.filter((_, i) => i !== index));
            }}>削除</button>
          </div>
        ))}
        <button 
          onClick={() => setProperties([...properties, { key: '', value: '' }])}
          style={{ marginTop: '10px' }}
        >
          プロパティを追加
        </button>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label>パスプロパティ:</label>
        {pathProperties.map((prop, index) => (
          <div key={index} style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
            <input
              placeholder="キー"
              value={prop.key}
              onChange={(e) => {
                const newProps = [...pathProperties];
                newProps[index].key = e.target.value;
                setPathValidationStates(prev => ({
                  ...prev,
                  [prop.key]: null
                }));
                setPathProperties(newProps);
              }}
              style={{ flex: 1, padding: '5px' }}
            />
            <input
              placeholder="パス"
              value={prop.value}
              onChange={(e) => {
                const newProps = [...pathProperties];
                newProps[index].value = e.target.value;
                setPathValidationStates(prev => ({
                  ...prev,
                  [prop.key]: null
                }));
                setPathProperties(newProps);
              }}
              style={{ 
                flex: 1, 
                padding: '5px',
                borderColor: prop.key ? getValidationColor(prop.key) : undefined
              }}
            />
            <button
              onClick={() => handleCheckPath(prop.key, prop.value)}
              disabled={!prop.key || !prop.value}
              style={{
                padding: '5px 10px',
                backgroundColor: '#f0f0f0',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: prop.key && prop.value ? 'pointer' : 'not-allowed'
              }}
            >
              確認
            </button>
            <button onClick={() => {
              setPathProperties(pathProperties.filter((_, i) => i !== index));
              setPathValidationStates(prev => {
                const newState = { ...prev };
                delete newState[prop.key];
                return newState;
              });
            }}>削除</button>
          </div>
        ))}
        <button 
          onClick={() => setPathProperties([...pathProperties, { key: '', value: '' }])}
          style={{ marginTop: '10px' }}
        >
          パスプロパティを追加
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
        <button onClick={onClose}>キャンセル</button>
        <button 
          onClick={handleSave}
          style={{
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            padding: '5px 15px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          保存
        </button>
      </div>
    </div>
  );
}

export default NodeEditPanel;