import { useEffect } from 'react';

import { useSearchParams } from 'react-router-dom';

import { fetchNotes } from '../../api/notes.js';
import { fetchSchemas } from '../../api/schemas.js';
import { useSchemas, useNotes } from '../../hooks/index.js';

import ActiveForm from './components/ActiveForm.js';
import Header from './components/Header.js';
import NotesBoard from './components/NotesBoard.js';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { schemas, setSchemas } = useSchemas();
  const { setNotes, activeNote } = useNotes();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const fetch = async () => {
      const notes = await fetchNotes();
      const schemas = await fetchSchemas();
      setNotes(notes);
      setSchemas(schemas);
    };

    void fetch();
  }, []);

  useEffect(() => {
    const selected = searchParams.get('type');
    if (!schemas.length) {
      if (selected) {
        setSearchParams({});
      }
      return;
    }

    const exists = selected
      ? schemas.some(schema => schema.id === selected)
      : false;
    if (!selected || !exists) {
      setSearchParams({
        type: schemas[0]?.id ?? '',
      });
    }
  }, [schemas]);

  return (
    <>
      <Header />

      <main className={styles.main}>
        <section className={styles.card}>
          <h2 className={styles.header}>
            {activeNote ? 'Edit Note' : 'Create Note'}
          </h2>

          {schemas.length ? (
            <ActiveForm />
          ) : (
            <p className={styles.placeholder}>No schema available</p>
          )}
        </section>

        <section className={styles.card}>
          <h2 className={styles.header}>Notes</h2>

          {schemas.length ? (
            <NotesBoard />
          ) : (
            <p className={styles.placeholder}>No schema available</p>
          )}
        </section>
      </main>
    </>
  );
}
