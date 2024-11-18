import React, { useState, useEffect } from 'react';
import { DataSet } from 'vis-data';

interface NodeData {
  id: number;
  label: string;
  description?: string;
  type?: 'source' | 'transform' | 'output';
  properties?: {
    [key: string]: string;
  };
}

interface SearchPanelProps {
  nodesDataSet: DataSet<NodeData> | undefined;
  onHighlight: (nodeIds: number[]) => void;
}

type NodeType = 'source' | 'transform' | 'output' | 'all';

function SearchPanel({ nodesDataSet, onHighlight }: SearchPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<NodeType>('all');
  const [propertyFilters, setPropertyFilters] = useState<{ key: string; value: string }[]>([]);
  const [availableProperties, setAvailableProperties] = useState<string[]>([]);

  const updateAvailableProperties = (filters: { key: string; value: string }[]) => {
    if (!nodesDataSet) return;

    const allNodes = nodesDataSet.get();
    const properties = new Set<string>();
    
    // ノードが持つ全てのプロパティを収集
    allNodes.forEach(node => {
      if (node.properties) {
        Object.keys(node.properties).forEach(key => properties.add(key));
      }
    });

    // 現在のフィルターのキーも追加
    filters.forEach(filter => {
      if (filter.key) {
        properties.add(filter.key);
      }
    });

    const sortedProperties = Array.from(properties).sort();
    console.log('Updated available properties:', sortedProperties);
    setAvailableProperties(sortedProperties);
  };

  useEffect(() => {
    console.log('Effect triggered:', {
      hasNodesDataSet: !!nodesDataSet,
      propertyFilters
    });
    updateAvailableProperties(propertyFilters);
  }, [nodesDataSet, propertyFilters]);

  const handleSearch = () => {
    if (!nodesDataSet) return;

    console.log('Current search criteria:', {
      searchTerm,
      selectedType,
      propertyFilters
    });

    const allNodes = nodesDataSet.get();
    const filteredNodes = allNodes.filter(node => {
      // テキスト検索
      const matchesText = searchTerm === '' || 
        node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (node.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());

      // タイプフィルター
      const matchesType = selectedType === 'all' || node.type === selectedType;

      // プロパティフィルター
      const matchesProperties = propertyFilters.every(filter => {
        if (!filter.key || !filter.value) return true;
        return (node.properties?.[filter.key]?.toLowerCase() || '').includes(filter.value.toLowerCase());
      });

      console.log(`Evaluating node "${node.label}":`, {
        nodeType: node.type,
        currentSelectedType: selectedType,
        matchesType,
        matchesText,
        properties: node.properties,
        matchesProperties
      });

      return matchesText && matchesType && matchesProperties;
    });

    console.log('Filtered results:', {
      totalNodes: allNodes.length,
      filteredNodes: filteredNodes.map(n => ({
        id: n.id,
        label: n.label,
        type: n.type
      }))
    });

    onHighlight(filteredNodes.map(node => node.id));
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as NodeType;
    console.log('Type selection changed:', {
      previousType: selectedType,
      newType: newType
    });
    setSelectedType(newType);
  };

  const addPropertyFilter = () => {
    console.log('Adding new property filter');
    const newFilters = [...propertyFilters, { key: '', value: '' }];
    setPropertyFilters(newFilters);
  };

  const removePropertyFilter = (index: number) => {
    console.log('Removing property filter at index:', index);
    const newFilters = propertyFilters.filter((_, i) => i !== index);
    setPropertyFilters(newFilters);
  };

  const handlePropertyKeyChange = (index: number, newKey: string) => {
    console.log('Property key changed:', { index, newKey });
    const newFilters = [...propertyFilters];
    newFilters[index].key = newKey;
    setPropertyFilters(newFilters);
  };

  const handlePropertyValueChange = (index: number, newValue: string) => {
    const newFilters = [...propertyFilters];
    newFilters[index].value = newValue;
    setPropertyFilters(newFilters);
  };

  const handleReset = () => {
    setSearchTerm('');
    setSelectedType('all');
    setPropertyFilters([]);
    onHighlight([]);
  };

  return (
    <div style={{
      padding: '10px',
      backgroundColor: '#f5f5f5',
      borderBottom: '1px solid #ddd',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <div style={{ marginBottom: '10px' }}>
        <input
          type="text"
          placeholder="ノード名または説明を検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ 
            width: '100%',
            padding: '5px',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <select
          value={selectedType}
          onChange={handleTypeChange}
          style={{ 
            width: '100%', 
            padding: '5px',
            boxSizing: 'border-box'
          }}
        >
          <option value="all">全てのタイプ</option>
          <option value="source">データソース</option>
          <option value="transform">データ変換</option>
          <option value="output">出力</option>
        </select>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label>プロパティフィルター</label>
          <button onClick={addPropertyFilter} style={{ padding: '2px 5px' }}>+</button>
        </div>
        {propertyFilters.map((filter, index) => (
          <div key={index} style={{ 
            display: 'flex', 
            gap: '5px', 
            marginTop: '5px',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <select
              value={filter.key}
              onChange={(e) => handlePropertyKeyChange(index, e.target.value)}
              style={{ 
                flex: 1,
                boxSizing: 'border-box'
              }}
            >
              <option value="">プロパティを選択</option>
              {availableProperties.map(prop => (
                <option key={prop} value={prop}>{prop}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="値"
              value={filter.value}
              onChange={(e) => handlePropertyValueChange(index, e.target.value)}
              style={{ 
                flex: 1,
                boxSizing: 'border-box'
              }}
            />
            <button onClick={() => removePropertyFilter(index)}>×</button>
          </div>
        ))}
      </div>

      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        justifyContent: 'flex-end',
        marginTop: '10px'
      }}>
        <button
          onClick={handleReset}
          style={{
            padding: '5px 15px',
            backgroundColor: '#f0f0f0',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          リセット
        </button>
        <button
          onClick={handleSearch}
          style={{
            padding: '5px 15px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          検索
        </button>
      </div>
    </div>
  );
}

export default SearchPanel;