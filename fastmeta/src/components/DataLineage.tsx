import { useEffect, useState, useRef } from 'react';
import { Network } from 'vis-network/standalone';
import { DataSet } from 'vis-data';
import { Options } from 'vis-network/declarations/network/Network';
import NodeEditPanel from './NodeEditPanel';
import SearchPanel from './SearchPanel';

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
      { 
        id: 1, 
        label: 'データソース1', 
        type: 'source',
        description: 'ソースの説明',
        properties: { 'データ形式': 'CSV', '更新頻度': '日次' }
      },
      { 
        id: 2, 
        label: 'データ変換', 
        type: 'transform',
        description: '変換処理の説明',
        properties: { '処理タイプ': '集計', '出力形式': 'JSON' }
      },
      { 
        id: 3, 
        label: '最終出力', 
        type: 'output',
        description: '出力の説明',
        properties: { '保存先': 'S3', 'フォーマット': 'Parquet' }
      }
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
        },
        font: {
          size: 14
        }
      },
      edges: {
        arrows: 'to'
      },
      manipulation: {
        enabled: false
      },
      interaction: {
        multiselect: true,
        selectConnectedEdges: true,
        hover: true
      },
      physics: {
        enabled: true,
        solver: 'hierarchicalRepulsion',
        hierarchicalRepulsion: {
          nodeDistance: 150
        }
      }
    };

    // ネットワークの描画
    const container = document.getElementById('network');
    if (container && !networkRef.current) {
      networkRef.current = new Network(container, { nodes, edges }, options);

      // ダブルクリックイベントの設定
      networkRef.current.on('doubleClick', (params) => {
        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0];
          const node = nodes.get(nodeId);
          if (node) {
            setSelectedNode(node as NodeData);
            setIsModalOpen(true);
          }
        }
      });
    }

    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, []);

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
      const nodes = nodesDataSet.get() as NodeData[];
      const edges = edgesDataSet.get() as Edge[];
      
      const graphData: GraphData = {
        nodes: nodes.map(node => ({
          id: node.id,
          label: node.label,
          description: node.description || '',
          type: node.type || 'transform',
          properties: node.properties || {}
        })),
        edges: edges
      };
      
      const jsonString = JSON.stringify(graphData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      const date = new Date().toISOString().split('T')[0];
      link.download = `graph-data-${date}.json`;
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
          
          const validatedNodes = graphData.nodes.map(node => ({
            ...node,
            description: node.description || '',
            type: node.type || 'transform',
            properties: node.properties || {}
          }));

          if (nodesDataSet && edgesDataSet) {
            nodesDataSet.clear();
            edgesDataSet.clear();
            nodesDataSet.add(validatedNodes);
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

  const handleHighlight = (nodeIds: number[]) => {
    if (nodesDataSet && networkRef.current) {
      const allNodes = nodesDataSet.get();
      
      if (nodeIds.length === 0) {
        // 検索結果がない場合は全てのノードを通常表示
        allNodes.forEach(node => {
          nodesDataSet.update({
            id: node.id,
            color: undefined,  // デフォルトの色に戻す
            opacity: undefined // デフォルトの透明度に戻す
          });
        });
      } else {
        // 検索結果に応じてノードの表示を更新
        allNodes.forEach(node => {
          if (nodeIds.includes(node.id)) {
            // 検索にマッチしたノード
            nodesDataSet.update({
              id: node.id,
              color: {
                background: '#ffff99',
                border: '#ffa500'
              },
              opacity: 1
            });
          } else {
            // マッチしなかったノード
            nodesDataSet.update({
              id: node.id,
              color: {
                background: '#ffffff',
                border: '#2B7CE9'
              },
              opacity: 0.3
            });
          }
        });

        // マッチしたノードにフォーカス
        networkRef.current.focus(nodeIds[0], {
          scale: 1,
          animation: {
            duration: 500,
            easingFunction: 'easeInOutQuad'
          }
        });
      }
    }
  };

  return (
    <div style={{ 
      position: 'relative', 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden'  // これを追加
    }}>
      <div className="controls" style={{ 
        padding: '10px', 
        display: 'flex', 
        gap: '10px', 
        borderBottom: '1px solid #ddd',
        flexShrink: 0  // これを追加
      }}>
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

      <div style={{ 
        flexShrink: 0,  // これを追加
        borderBottom: '1px solid #ddd' 
      }}>
        <SearchPanel 
          nodesDataSet={nodesDataSet}
          onHighlight={handleHighlight}
        />
      </div>

      <div id="network" style={{ 
        flex: 1,
        border: '1px solid #ddd',
        marginRight: isModalOpen ? '400px' : '0',
        transition: 'margin-right 0.3s ease',
        overflow: 'hidden'  // これを追加
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