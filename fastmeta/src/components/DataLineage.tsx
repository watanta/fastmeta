import { useEffect, useState, useRef } from 'react';
import { Network } from 'vis-network/standalone';
import { DataSet } from 'vis-data';
import { Options } from 'vis-network/declarations/network/Network';

interface Node {
  id: number;
  label: string;
}

interface Edge {
  id?: string | number;
  from: number;
  to: number;
}

function DataLineage() {
  const [nodesDataSet, setNodesDataSet] = useState<DataSet<Node>>();
  const [edgesDataSet, setEdgesDataSet] = useState<DataSet<Edge>>();
  const networkRef = useRef<Network | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    // サンプルデータの定義
    const nodes = new DataSet<Node>([
      { id: 1, label: 'データソース1' },
      { id: 2, label: 'データ変換' },
      { id: 3, label: '最終出力' }
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
        editNode: function(nodeData: any, callback: any) {
          const newLabel = prompt('ノード名を入力してください:', nodeData.label);
          if (newLabel !== null) {
            nodeData.label = newLabel;
            callback(nodeData);
          } else {
            callback(null);
          }
        },
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

  return (
    <div>
      <div className="controls" style={{ marginBottom: '20px' }}>
        <button 
          onClick={handleToggleEdit}
          style={{ 
            padding: '5px 10px',
            backgroundColor: isEditMode ? '#4CAF50' : '#f0f0f0'
          }}
        >
          編集モード {isEditMode ? 'ON' : 'OFF'}
        </button>
      </div>
      <div id="network" style={{ height: '500px', border: '1px solid #ddd' }} />
    </div>
  );
}

export default DataLineage;