import { useSearchParams } from 'react-router-dom';

import {
  createSchema,
  deleteSchema,
  updateSchema,
} from '../../../api/schemas.js';
import { Button, ConfirmModal, Dropdown } from '../../../components/index.js';
import { ButtonVariant } from '../../../constants/index.js';
import { useModal, useSchemas, useSnackbar } from '../../../hooks/index.js';

import styles from './Header.module.css';
import SchemaModal from './modals/SchemaModal.js';

export default function Header() {
  const {
    schemas,
    getActiveSchema,
    addSchema,
    updateSchema: updateStateSchema,
    removeSchema,
  } = useSchemas();
  const { showModal, closeModal } = useModal();
  const { showSnackbar } = useSnackbar();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedType = searchParams.get('type') ?? '';
  const activeSchema = getActiveSchema(selectedType);

  const applyTypeParam = (type: string) => {
    if (!type) {
      setSearchParams({});
      return;
    }

    setSearchParams({ type });
  };

  const handleCreate = () => {
    showModal({
      component: SchemaModal,
      props: {
        title: 'Create schema',
        submitText: 'Create',
        onCancel: closeModal,
        onError: showSnackbar,
        onSubmit: payload => {
          void (async () => {
            try {
              const created = await createSchema(payload);
              addSchema(created);
              applyTypeParam(created.id);
              closeModal();
              showSnackbar('Schema created');
            } catch (error) {
              console.error(error);
              showSnackbar('Create failed');
            }
          })();
        },
      },
    });
  };

  const handleEdit = () => {
    if (!activeSchema) return;

    showModal({
      component: SchemaModal,
      props: {
        title: 'Edit schema',
        submitText: 'Save',
        initialSchema: activeSchema,
        onCancel: closeModal,
        onError: showSnackbar,
        onSubmit: payload => {
          void (async () => {
            try {
              const updated = await updateSchema(activeSchema.id, payload);
              updateStateSchema(updated.id, updated);
              closeModal();
              showSnackbar('Schema updated');
            } catch (error) {
              console.error(error);
              showSnackbar('Schema update failed');
            }
          })();
        },
      },
    });
  };

  const handleDelete = () => {
    if (!activeSchema) return;

    showModal({
      component: ConfirmModal,
      props: {
        title: 'Delete schema',
        message:
          'Delete selected schema? If this schema has notes, all related notes will be deleted.',
        confirmText: 'Delete',
        confirmVariant: ButtonVariant.DANGER,
        onCancel: closeModal,
        onConfirm: () => {
          void (async () => {
            closeModal();
            try {
              await deleteSchema(activeSchema.id);
              const nextSchemas = schemas.filter(
                schema => schema.id !== activeSchema.id
              );
              removeSchema(activeSchema.id);
              applyTypeParam(nextSchemas[0]?.id ?? '');
              showSnackbar('Schema deleted');
            } catch {
              showSnackbar('Delete failed');
            }
          })();
        },
      },
    });
  };

  return (
    <header className={styles.header}>
      <h1>My Notes</h1>
      <div className={styles.controls}>
        <Dropdown
          className={styles.typeSelect}
          value={selectedType}
          options={schemas.map(schema => ({
            value: schema.id,
            label: schema.name,
          }))}
          onChange={event => {
            applyTypeParam(event.target.value);
          }}
          disabled={!schemas.length}
        />
        <Button variant={ButtonVariant.SECONDARY} onClick={handleCreate}>
          New
        </Button>
        <Button
          variant={ButtonVariant.SECONDARY}
          onClick={handleEdit}
          disabled={!activeSchema}
        >
          Edit
        </Button>
        <Button
          variant={ButtonVariant.DANGER}
          onClick={handleDelete}
          disabled={!activeSchema}
        >
          Delete
        </Button>
      </div>
    </header>
  );
}
