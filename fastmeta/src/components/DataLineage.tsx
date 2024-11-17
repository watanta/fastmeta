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
  pathProperties?: {
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

  const getNodeStyle = (type: string = 'transform') => {
    switch (type) {
      case 'source':
        return {
          shape: 'diamond',
          color: {
            background: '#D5E8D4',  // 薄緑
            border: '#82B366'       // 濃緑
          }
        };
      case 'transform':
        return {
          shape: 'box',
          color: {
            background: '#DAE8FC',  // 薄青
            border: '#6C8EBF'       // 濃青
          }
        };
      case 'output':
        return {
          shape: 'circle',
          color: {
            background: '#FFE6CC',  // 薄橙
            border: '#D79B00'       // 濃橙
          }
        };
      default:
        return {
          shape: 'box',
          color: {
            background: '#DAE8FC',
            border: '#6C8EBF'
          }
        };
    }
  };

  useEffect(() => {
    // サンプルデータの定義
// サンプルデータの定義
    const initialNodes = [
      { 
        id: 1, 
        label: 'データソース1', 
        type: 'source',
        description: 'ソースの説明',
        properties: { 'データ形式': 'CSV', '更新頻度': '日次' },
        pathProperties: {
          'configFile': '/home/watanabe/fastmeta/fastmeta/backend/package.json',  // 実在するパス
          'dataPath': '/home/watanabe/fastmeta/fastmeta/backend/not_exists.csv'   // 存在しないパス
        }
      },
      { 
        id: 2, 
        label: 'データ変換', 
        type: 'transform',
        description: '変換処理の説明',
        properties: { '処理タイプ': '集計', '出力形式': 'JSON' },
        pathProperties: {
          'scriptDir': '/home/watanabe/fastmeta/fastmeta/src',           // 実在するパス
          'logFile': '/home/watanabe/fastmeta/fastmeta/not_exist_src'   // 存在しないパス
        }
      },
      { 
        id: 3, 
        label: '最終出力', 
        type: 'output',
        description: '出力の説明',
        properties: { '保存先': 'S3', 'フォーマット': 'Parquet' },
        pathProperties: {
          'readmeFile': '/home/watanabe/fastmeta/fastmeta/README.md',         // 実在するパス
          'outputPath': '/home/watanabe/fastmeta/fastmeta/not_exits_README.md' // 存在しないパス
        }
      }
    ];

    // 各ノードにスタイルを適用
    const nodesWithStyles = initialNodes.map(node => ({
      ...node,
      ...getNodeStyle(node.type)
    }));

    const nodes = new DataSet<NodeData>(nodesWithStyles);
    const edges = new DataSet<Edge>([
      { from: 1, to: 2 },
      { from: 2, to: 3 }
    ]);

    setNodesDataSet(nodes);
    setEdgesDataSet(edges);

    // 描画オプション
    const options: Options = {
      nodes: {
        borderWidth: 2,
        margin: 10,
        size: 30,        // ノードのサイズ
        font: {
          size: 14,
          color: '#333333',
          face: 'arial'
        }
      },
      edges: {
        arrows: 'to',
        smooth: {
          type: 'cubicBezier',
          forceDirection: 'horizontal',
          roundness: 0.4
        },
        color: {
          color: '#999999',
          highlight: '#666666'
        }
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
      const nodeStyle = getNodeStyle(updatedNode.type);
      nodesDataSet.update({
        ...updatedNode,
        ...nodeStyle
      });
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
          
          const validatedNodes = graphData.nodes.map(node => {
            const nodeStyle = getNodeStyle(node.type);
            return {
              ...node,
              description: node.description || '',
              type: node.type || 'transform',
              properties: node.properties || {},
              ...nodeStyle
            };
          });

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
      
      allNodes.forEach(node => {
        const baseStyle = getNodeStyle(node.type);
        
        if (nodeIds.length === 0) {
          // 検索結果がない場合は元のスタイルに戻す
          nodesDataSet.update({
            id: node.id,
            ...baseStyle,
            opacity: undefined
          });
        } else if (nodeIds.includes(node.id)) {
          // 検索にマッチしたノード
          nodesDataSet.update({
            id: node.id,
            ...baseStyle,
            opacity: 1
          });
        } else {
          // マッチしなかったノード
          nodesDataSet.update({
            id: node.id,
            ...baseStyle,
            opacity: 0.3
          });
        }
      });

      if (nodeIds.length > 0) {
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
      overflow: 'hidden'
    }}>
      <div className="controls" style={{ 
        padding: '10px', 
        display: 'flex', 
        gap: '10px', 
        borderBottom: '1px solid #ddd',
        flexShrink: 0
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
        flexShrink: 0,
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
        overflow: 'hidden'
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
