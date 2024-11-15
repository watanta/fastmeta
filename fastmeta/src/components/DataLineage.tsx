import { useEffect, useState, useRef } from 'react';
import { Network } from 'vis-network/standalone';
import { DataSet } from 'vis-data';
import { Options } from 'vis-network/declarations/network/Network';
import NodeEditPanel from './NodeEditPanel';  // インポート名を変更

interface NodeData {
  id: number;
  label: string;
  description?: string;
  type?: 'source' | 'transform' | 'output';
  properties?: {
    [key: string]: string;
  };
}

interface Edge {
  id?: string | number;
  from: number;
  to: number;
}

interface GraphData {
  nodes: NodeData[];
  edges: Edge[];
}

function DataLineage() {
  const [nodesDataSet, setNodesDataSet] = useState<DataSet<NodeData>>();
  const [edgesDataSet, setEdgesDataSet] = useState<DataSet<Edge>>();
  const networkRef = useRef<Network | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // サンプルデータの定義
    const nodes = new DataSet<NodeData>([
      { id: 1, label: 'データソース1', type: 'source' },
      { id: 2, label: 'データ変換', type: 'transform' },
      { id: 3, label: '最終出力', type: 'output' }
    ]);

    const edges = new DataSet<Edge>([
      { from: 1, to: 2 },
      { from: 2, to: 3 }
    ]);

    setNodesDataSet(nodes);
    setEdgesDataSet(edges);

    // 描画オプション
    const options: Options = {
      nodes: {
        shape: 'box',
        margin: {
          top: 10,
          right: 10,
          bottom: 10,
          left: 10
        },
        borderWidth: 1,
        color: {
          background: '#ffffff',
          border: '#2B7CE9'
        }
      },
      edges: {
        arrows: 'to'
      },
      manipulation: {
        enabled: false,
        initiallyActive: false,
        addNode: true,
        addEdge: true,
        deleteNode: true,
        deleteEdge: true
      },
      interaction: {
        multiselect: true,
        selectConnectedEdges: true,
        hover: true
      }
    };

    // ネットワークの描画
    const container = document.getElementById('network');
    if (container) {
      networkRef.current = new Network(container, { nodes, edges }, options);
    }

    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
      }
    };
  }, []);

  // イベントリスナーの設定
  useEffect(() => {
    if (networkRef.current && nodesDataSet) {
      networkRef.current.on('doubleClick', (params) => {
        console.log('Double click detected:', params);
        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0];
          const node = nodesDataSet.get(nodeId);
          console.log('Selected node:', node);
          if (node) {
            setSelectedNode(node as NodeData);
            setIsModalOpen(true);
            console.log('Panel should open now');
          }
        }
      });
    }
  }, [networkRef.current, nodesDataSet]);

  const handleToggleEdit = () => {
    if (networkRef.current) {
      setIsEditMode(!isEditMode);
      networkRef.current.setOptions({
        manipulation: {
          enabled: !isEditMode
        }
      });
    }
  };

  const handleSaveNode = (updatedNode: NodeData) => {
    if (nodesDataSet) {
      nodesDataSet.update(updatedNode);
    }
  };

  const handleExport = () => {
    if (nodesDataSet && edgesDataSet) {
      const graphData: GraphData = {
        nodes: nodesDataSet.get() as NodeData[],
        edges: edgesDataSet.get() as Edge[]
      };
      
      const jsonString = JSON.stringify(graphData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'graph-data.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const graphData: GraphData = JSON.parse(e.target?.result as string);
          if (nodesDataSet && edgesDataSet) {
            nodesDataSet.clear();
            edgesDataSet.clear();
            nodesDataSet.add(graphData.nodes);
            edgesDataSet.add(graphData.edges);
          }
        } catch (error) {
          console.error('Invalid JSON file:', error);
          alert('無効なJSONファイルです。');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div style={{ position: 'relative', height: '100vh' }}>
      <div className="controls" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button 
          onClick={handleToggleEdit}
          style={{ 
            padding: '5px 10px',
            backgroundColor: isEditMode ? '#4CAF50' : '#f0f0f0'
          }}
        >
          編集モード {isEditMode ? 'ON' : 'OFF'}
        </button>

        <button 
          onClick={handleExport}
          style={{ padding: '5px 10px' }}
        >
          エクスポート
        </button>

        <label style={{ 
          padding: '5px 10px',
          backgroundColor: '#f0f0f0',
          cursor: 'pointer',
          border: '1px solid #ccc',
          borderRadius: '4px'
        }}>
          インポート
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      <div id="network" style={{ 
        height: 'calc(100% - 60px)', 
        border: '1px solid #ddd',
        marginRight: isModalOpen ? '400px' : '0',
        transition: 'margin-right 0.3s ease'
      }} />
      
      <NodeEditPanel
        node={selectedNode}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedNode(null);
        }}
        onSave={handleSaveNode}
      />
    </div>
  );
}

export default DataLineage;