import React, { useState, useEffect } from 'react';

interface NodeData {
  id: number;
  label: string;
  description?: string;
  type?: 'source' | 'transform' | 'output';
  properties?: {
    [key: string]: string;
  };
}

interface NodeEditModalProps {
  node: NodeData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (node: NodeData) => void;
}

function NodeEditModal({ node, isOpen, onClose, onSave }: NodeEditModalProps) {
  const [editedNode, setEditedNode] = useState<NodeData | null>(null);
  const [properties, setProperties] = useState<{key: string, value: string}[]>([]);

  useEffect(() => {
    if (node) {
      setEditedNode(node);
      setProperties(
        Object.entries(node.properties || {}).map(([key, value]) => ({ key, value }))
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
        }, {} as {[key: string]: string})
      };
      onSave(updatedNode);
    }
    onClose();
  };

  if (!isOpen || !editedNode) return null;

  return (
    <div className="modal" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div className="modal-content" style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '5px',
        minWidth: '400px'
      }}>
        <h2>ノード編集</h2>
        
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
          <button onClick={() => setProperties([...properties, { key: '', value: '' }])}
            style={{ marginTop: '10px' }}
          >
            プロパティを追加
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onClose}>キャンセル</button>
          <button onClick={handleSave}>保存</button>
        </div>
      </div>
    </div>
  );
}

export default NodeEditModal;