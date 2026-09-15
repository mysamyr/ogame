import {
  DeleteIcon,
  ExportIcon,
  FilterIcon,
  ImportIcon,
} from '../../../components/icons/index.js';
import { Button } from '../../../components/index.js';
import { ButtonVariant } from '../../../constants/index.js';

import styles from './NotesToolbar.module.css';

type Props = {
  activeFilterCount: number;
  selectedCount?: number;
  onDeleteSelected?: () => void;
  onExport?: () => void;
  onImport: () => void;
  onOpenFilters?: () => void;
};

export default function NotesToolbar({
  activeFilterCount,
  selectedCount = 0,
  onDeleteSelected,
  onExport,
  onImport,
  onOpenFilters,
}: Props) {
  return (
    <div className={styles.toolbar}>
      {selectedCount > 0 && onDeleteSelected ? (
        <Button
          variant={ButtonVariant.ICON}
          className={styles.badgeButton}
          onClick={onDeleteSelected}
          aria-label={`Delete selected (${selectedCount})`}
          title="Delete selected"
        >
          <DeleteIcon />
          <span className={styles.badgeDanger}>{selectedCount}</span>
        </Button>
      ) : null}
      <Button
        variant={ButtonVariant.ICON}
        onClick={onImport}
        aria-label="Import schema"
        title="Import schema"
      >
        <ImportIcon />
      </Button>
      {onExport ? (
        <Button
          variant={ButtonVariant.ICON}
          onClick={onExport}
          aria-label="Export schema"
          title="Export schema"
        >
          <ExportIcon />
        </Button>
      ) : null}
      {onOpenFilters ? (
        <Button
          variant={ButtonVariant.ICON}
          className={styles.badgeButton}
          onClick={onOpenFilters}
          aria-label="Open filters"
          title="Open filters"
        >
          <FilterIcon />
          {activeFilterCount > 0 ? (
            <span className={styles.badge}>{activeFilterCount}</span>
          ) : null}
        </Button>
      ) : null}
    </div>
  );
}
