import { useEffect } from 'react';

import { useSearchParams } from 'react-router-dom';

import { fetchNotes } from '../../api/notes.js';
import { fetchSchemas } from '../../api/schemas.js';
import { useSchemas, useNotes, useSnackbar } from '../../hooks/index.js';

import Header from './components/Header.js';
import NoteForm from './components/NoteForm.js';
import NotesBoard from './components/NotesBoard.js';

import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { schemas, setSchemas } = useSchemas();
  const { setNotes } = useNotes();
  const { showSnackbar } = useSnackbar();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const fetch = async () => {
      try {
        const notes = await fetchNotes();
        const schemas = await fetchSchemas();
        setNotes(notes);
        setSchemas(schemas);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        showSnackbar('Failed to fetch data');
      }
    };

    void fetch();
  }, []);

  useEffect(() => {
    const selected = searchParams.get('type');
    if (!schemas.length) return;

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
    <div className={styles.dashboard}>
      <Header />

      <main className={styles.main}>
        <section className={styles.card}>
          <NoteForm />
        </section>

        <section className={styles.card}>
          <NotesBoard />
        </section>
      </main>
    </div>
  );
}
