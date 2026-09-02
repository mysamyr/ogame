import { useSearchParams } from 'react-router-dom';

import {
  createSchema,
  deleteSchema,
  fetchSchemaById,
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
    addSchema,
    updateSchema: updateStateSchema,
    removeSchema,
  } = useSchemas();
  const { showModal, closeModal } = useModal();
  const { showSnackbar } = useSnackbar();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSchemaId = searchParams.get('type') ?? '';

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
    if (!selectedSchemaId) return;

    void (async () => {
      try {
        const schema = await fetchSchemaById(selectedSchemaId);
        showModal({
          component: SchemaModal,
          props: {
            title: 'Edit schema',
            submitText: 'Save',
            initialSchema: schema,
            onCancel: closeModal,
            onSubmit: payload => {
              void (async () => {
                try {
                  const updated = await updateSchema(selectedSchemaId, payload);
                  updateStateSchema(updated.id, updated);
                  closeModal();
                  showSnackbar('Schema updated');
                } catch {
                  showSnackbar('Update failed');
                }
              })();
            },
          },
        });
      } catch {
        showSnackbar('Load failed');
      }
    })();
  };

  const handleDelete = () => {
    if (!selectedSchemaId) return;

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
              await deleteSchema(selectedSchemaId);
              const nextSchemas = schemas.filter(
                schema => schema.id !== selectedSchemaId
              );
              removeSchema(selectedSchemaId);
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
      <h1>OGame Notes</h1>
      <div className={styles.controls}>
        <Dropdown
          className={styles.typeSelect}
          value={selectedSchemaId}
          options={schemas.map(schema => ({
            value: schema.id,
            label: schema.name,
          }))}
          onChange={event => {
            applyTypeParam(event.target.value);
          }}
        />
        <Button variant={ButtonVariant.SECONDARY} onClick={handleCreate}>
          New
        </Button>
        <Button
          variant={ButtonVariant.SECONDARY}
          onClick={handleEdit}
          disabled={!selectedSchemaId}
        >
          Edit
        </Button>
        <Button
          variant={ButtonVariant.DANGER}
          onClick={handleDelete}
          disabled={!selectedSchemaId}
        >
          Delete
        </Button>
      </div>
    </header>
  );
}
