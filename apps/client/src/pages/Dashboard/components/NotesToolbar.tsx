import { FilterIcon } from '../../../components/icons/index.js';
import { Button } from '../../../components/index.js';
import { ButtonVariant } from '../../../constants/index.js';

import styles from './NotesToolbar.module.css';

type Props = {
  activeFilterCount: number;
  onOpenFilters: () => void;
};

export default function NotesToolbar({
  activeFilterCount,
  onOpenFilters,
}: Props) {
  return (
    <div className={styles.toolbar}>
      <Button
        variant={ButtonVariant.ICON}
        className={styles.filterButton}
        onClick={onOpenFilters}
        aria-label="Open filters"
        title="Open filters"
      >
        <FilterIcon />
        {activeFilterCount > 0 ? (
          <span className={styles.badge}>{activeFilterCount}</span>
        ) : null}
      </Button>
    </div>
  );
}
