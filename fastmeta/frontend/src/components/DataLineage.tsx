import { useEffect, useState, useRef } from 'react';
import { Network } from 'vis-network/standalone';
import { DataSet } from 'vis-data';
import { Options } from 'vis-network/declarations/network/Network';
import NodeEditPanel from './NodeEditPanel';
import SearchPanel from './SearchPanel';

// ノードタイプの定義
const NODE_TYPES = [
  { value: 'source', label: 'データソース' },
  { value: 'transform', label: '変換' },
  { value: 'output', label: '出力' }
] as const;

type NodeType = typeof NODE_TYPES[number]['value'];

interface NodeData {
  id: number;
  label: string;
  description?: string;
  type?: NodeType;
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

function DataLineage() {
  const [network, setNetwork] = useState<Network | null>(null);
  const [nodesDataSet, setNodesDataSet] = useState<DataSet<NodeData> | null>(null);
  const [edgesDataSet, setEdgesDataSet] = useState<DataSet<Edge> | null>(null);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const networkContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (networkContainer.current) {
      const nodes = new DataSet<NodeData>([]);
      const edges = new DataSet<Edge>([]);

      const options: Options = {
        nodes: {
          shape: 'box',
          margin: 10,
          widthConstraint: {
            minimum: 100,
            maximum: 200,
          },
        },
        edges: {
          arrows: 'to',
        },
        manipulation: {
          enabled: true,
          addNode: (nodeData: any, callback: Function) => {
            const nodeType = prompt(
              'ノードタイプを選択してください（source/transform/output）:',
              'transform'
            ) as NodeType;

            if (!['source', 'transform', 'output'].includes(nodeType)) {
              alert('無効なノードタイプです');
              callback(null);
              return;
            }

            const label = prompt('ノードのラベルを入力してください:');
            if (!label) {
              callback(null);
              return;
            }

            const newNode: NodeData = {
              ...nodeData,
              id: Date.now(),
              label: label,
              type: nodeType,
              properties: {},
              pathProperties: {}
            };

            callback(newNode);
            setSelectedNode(newNode);
            setIsModalOpen(true);
          },
          addEdge: true,
          editEdge: true,
          deleteNode: true,
          deleteEdge: true,
        },
        physics: {
          enabled: false,
        },
      };

      const network = new Network(networkContainer.current, { nodes, edges }, options);

      network.on('doubleClick', (params) => {
        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0];
          const node = nodes.get(nodeId);
          if (node) {
            setSelectedNode(node);
            setIsModalOpen(true);
          }
        }
      });

      setNetwork(network);
      setNodesDataSet(nodes);
      setEdgesDataSet(edges);

      return () => {
        network.destroy();
      };
    }
  }, []);

  const handleSaveNode = (updatedNode: NodeData) => {
    if (nodesDataSet && updatedNode) {
      nodesDataSet.update(updatedNode);
    }
  };

  const handleHighlight = (nodeId: number) => {
    if (network) {
      network.selectNodes([nodeId]);
      const position = network.getPosition(nodeId);
      network.moveTo({
        position: position,
        scale: 1.0,
        animation: true
      });
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
      <div style={{ 
        flexShrink: 0,
        borderBottom: '1px solid #ddd' 
      }}>
        <SearchPanel 
          nodesDataSet={nodesDataSet}
          onHighlight={handleHighlight}
        />
      </div>

      <div id="network" ref={networkContainer} style={{ 
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