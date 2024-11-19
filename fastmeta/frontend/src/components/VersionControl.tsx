import React from 'react';
import type { Version } from '../types/version';

interface VersionControlProps {
  versions: Version[];
  currentVersion: string;
  onVersionSwitch: (versionId: string) => void;
  onVersionCreate: () => void;
  onExport: () => void;
  onImport: () => void;
}

const VersionControl: React.FC<VersionControlProps> = ({
  versions,
  currentVersion,
  onVersionSwitch,
  onVersionCreate,
  onExport,
  onImport
}) => {
  return (
    <div className="version-control">
      <div className="version-control-header">
        <h3>バージョン管理</h3>
        <div className="version-control-actions">
          <button onClick={onVersionCreate}>新規バージョン</button>
          <button onClick={onExport}>エクスポート</button>
          <button onClick={onImport}>インポート</button>
        </div>
      </div>
      
      <div className="version-list">
        {versions.length === 0 ? (
          <div className="version-empty">
            バージョン履歴がありません
          </div>
        ) : (
          versions.map(version => (
            <div 
              key={version.id}
              className={`version-item ${version.id === currentVersion ? 'active' : ''}`}
              onClick={() => onVersionSwitch(version.id)}
            >
              <div className="version-header">
                <span className="version-timestamp">
                  {new Date(version.timestamp).toLocaleString()}
                </span>
                <span className="version-author">{version.author}</span>
              </div>
              <div className="version-description">{version.description}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VersionControl;