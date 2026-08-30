import { useEffect } from 'react';

import { useSearchParams } from 'react-router-dom';

import { fetchNotes } from '../../api/notes.js';
import { fetchSchemas } from '../../api/schemas.js';
import { useSchemas, useNotes } from '../../hooks/index.js';

import ActiveForm from './components/ActiveForm.js';
import NotesBoard from './components/NotesBoard.js';

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
    if (!schemas.length) return;

    setSearchParams({
      type: searchParams.get('type') ?? schemas[0]?.type ?? '',
    });
  }, [schemas]);

  return (
    <>
      <header>
        <h1>OGame Notes — MVP</h1>
      </header>

      <main>
        <section className="card">
          <h2>{activeNote ? 'Edit Note' : 'Create Note'}</h2>
          <ActiveForm />
        </section>

        <section className="card">
          <NotesBoard />
        </section>
      </main>
    </>
  );
}
