import { useMemo } from 'react';

import { useSearchParams } from 'react-router-dom';

import { copyNote, deleteNote } from '../../../api/notes.js';
import { useNotes, useSchemas, useSnackbar } from '../../../hooks/index.js';
import type { NoteRecord } from '../../../types/index.js';

import NotesTable from './NotesTable.js';

export default function NotesBoard() {
  const { schemas } = useSchemas();
  const { notes, setActiveNote, addNote, removeNote } = useNotes();
  const { showSnackbar } = useSnackbar();
  const [searchParams, setSearchParams] = useSearchParams();

  const handleEdit = (note: NoteRecord) => {
    setActiveNote(note);
  };

  const handleCopy = async (note: NoteRecord) => {
    try {
      const newNote = await copyNote(note);
      showSnackbar('Copied');
      addNote(newNote);
    } catch {
      showSnackbar('Copy failed');
    }
  };

  const handleDelete = async (noteIdValue: string) => {
    if (!window.confirm(`Delete note?`)) {
      return;
    }

    try {
      await deleteNote(noteIdValue);
      removeNote(noteIdValue);
      showSnackbar('Deleted');
    } catch {
      showSnackbar('Delete failed');
    }
  };

  const displayedNotes = useMemo(() => {
    const filtered = searchParams.get('type')
      ? notes.filter(note => note.type === searchParams.get('type'))
      : notes;
    return (filtered ?? []).reduce<Record<string, NoteRecord[]>>(
      (acc, note) => {
        const key = String(note.date);
        acc[key] = acc[key] || [];
        acc[key].push(note);
        return acc;
      },
      {}
    );
  }, [searchParams, notes]);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <h2>Notes</h2>
        <select
          value={searchParams.get('type') ?? ''}
          onChange={event => {
            setSearchParams({ type: event.target.value });
          }}
          style={{
            width: '200px',
            marginLeft: '8px',
            padding: '6px',
            borderRadius: '6px',
            background: 'transparent',
            color: 'inherit',
            border: '1px solid rgba(255, 255, 255, 0.04)',
          }}
        >
          {schemas.map(schema => (
            <option key={schema.type} value={schema.type}>
              {schema.type}
            </option>
          ))}
        </select>
      </div>

      <div id="notes-list">
        {Object.keys(displayedNotes).length === 0 ? (
          <div className="note-meta">No notes yet</div>
        ) : (
          Object.keys(displayedNotes)
            .sort((a, b) => b.localeCompare(a))
            .map(dateKey => (
              <NotesTable
                key={dateKey}
                dateKey={dateKey}
                notesForDate={displayedNotes[dateKey] ?? []}
                selectedType={searchParams.get('type') ?? ''}
                onCopy={handleCopy}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))
        )}
      </div>
    </>
  );
}
