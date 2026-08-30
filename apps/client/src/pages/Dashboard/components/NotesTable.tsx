import React from 'react';

import { useSchemas } from '../../../hooks/index.js';
import type { NoteRecord } from '../../../types/index.js';

type Props = {
  dateKey: string;
  notesForDate: NoteRecord[];
  selectedType: string;
  onCopy: (note: NoteRecord) => Promise<void>;
  onEdit: (note: NoteRecord) => void;
  onDelete: (id: string) => void | Promise<void>;
};

export default function NotesTable({
  dateKey,
  notesForDate,
  selectedType,
  onCopy,
  onEdit,
  onDelete,
}: Props) {
  const { schemas } = useSchemas();

  const list = [...(notesForDate ?? [])].sort((a, b) => {
    const ai = Number(a.planet);
    const bi = Number(b.planet);
    if (Number.isFinite(ai) && Number.isFinite(bi)) return bi - ai;
    return String(b.planet).localeCompare(String(a.planet));
  });

  const schema = schemas.find(item => item.type === selectedType) || null;
  const fieldList = schema ? schema.fields.map(f => f.name) : [];
  const headerCells = ['Planet', ...fieldList, 'Actions'];

  return (
    <div key={dateKey} className="date-group">
      <div className="group-title">{dateKey}</div>
      <table className="notes-table">
        <thead>
          <tr>
            {headerCells.map(header => (
              <th
                key={header}
                className={header === 'Actions' ? 'note-actions' : ''}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {list.map(note => {
            const dynamicCells = fieldList.map(fieldName => {
              const field = schema?.fields.find(
                item => item.name === fieldName
              );
              const value = note[fieldName] as
                string | number | boolean | undefined;
              if (field?.kind === 'boolean') {
                return (
                  <td key={`${note.id}-${fieldName}`} className="cell-boolean">
                    <input type="checkbox" disabled checked={Boolean(value)} />
                  </td>
                );
              }

              if (field?.kind === 'number') {
                return (
                  <td key={`${note.id}-${fieldName}`}>
                    {value !== undefined
                      ? String(
                          new Intl.NumberFormat('en-US', {
                            maximumFractionDigits: 0,
                          }).format(Number(value))
                        )
                      : ''}
                  </td>
                );
              }

              return (
                <td key={`${note.id}-${fieldName}`}>
                  {value !== undefined ? String(value) : ''}
                </td>
              );
            });

            return (
              <tr key={String(note.id)}>
                <td>{String(note.planet)}</td>
                {dynamicCells}
                <td className="note-actions">
                  <button
                    type="button"
                    data-action="copy"
                    onClick={() => void onCopy(note)}
                  >
                    &#128203;
                  </button>
                  <button
                    type="button"
                    data-action="edit"
                    onClick={() => onEdit(note)}
                  >
                    &#128393;
                  </button>
                  <button
                    type="button"
                    className="del"
                    onClick={() => void onDelete(note.id!)}
                  >
                    &#128465;
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
