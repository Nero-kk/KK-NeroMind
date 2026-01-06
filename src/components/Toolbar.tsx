import React from 'react';
import {
  FilePlus,
  Save,
  FolderOpen,
  LayoutGrid,
  Download,
} from 'lucide-react';
import { ToolbarButton } from './ToolbarButton';

interface ToolbarProps {
  onNewDocument: () => void;
  onSave: () => void;
  onOpen: () => void;
  onAutoArrange: () => void;
  onExport: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onNewDocument,
  onSave,
  onOpen,
  onAutoArrange,
  onExport,
}) => {
  return (
    <div className="nm-flex nm-items-center nm-gap-1 nm-px-3 nm-py-2 nm-border-b nm-border-nero-border-light dark:nm-border-nero-border-dark nm-bg-nero-surface-light dark:nm-bg-nero-surface-dark">
      {/* Left group */}
      <div className="nm-flex nm-items-center nm-gap-1">
        <ToolbarButton
          icon={<FilePlus size={18} />}
          tooltip="New Document"
          onClick={onNewDocument}
        />
        <ToolbarButton
          icon={<FolderOpen size={18} />}
          tooltip="Open"
          onClick={onOpen}
        />
        <ToolbarButton
          icon={<Save size={18} />}
          tooltip="Save"
          onClick={onSave}
        />
      </div>

      {/* Divider */}
      <div className="nm-w-px nm-h-6 nm-bg-nero-border-light dark:nm-bg-nero-border-dark nm-mx-2" />

      {/* Middle group */}
      <div className="nm-flex nm-items-center nm-gap-1">
        <ToolbarButton
          icon={<LayoutGrid size={18} />}
          tooltip="Auto Arrange"
          onClick={onAutoArrange}
        />
      </div>

      {/* Spacer */}
      <div className="nm-flex-1" />

      {/* Right group */}
      <div className="nm-flex nm-items-center nm-gap-1">
        <ToolbarButton
          icon={<Download size={18} />}
          tooltip="Export"
          onClick={onExport}
        />
      </div>
    </div>
  );
};
