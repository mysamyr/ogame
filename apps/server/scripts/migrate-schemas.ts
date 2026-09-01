import { ensureStoreExists } from '../src/services/db.js';
import { upsertSchema } from '../src/stores/schema.js';

const schemas = [
  {
    name: 'I planets gang',
    fields: [
      { name: 'time', type: 'time', required: true },
      { name: 'attacked', type: 'boolean', required: true },
      { name: 'total_resources', type: 'number', required: false },
    ],
  },
  {
    name: 'Test',
    fields: [
      { name: 'string_required', type: 'string', required: true },
      { name: 'string_optional', type: 'string', required: false },
      { name: 'number_required', type: 'number', required: true },
      { name: 'number_optional', type: 'number', required: false },
      { name: 'boolean', type: 'boolean', required: true },
      { name: 'date_required', type: 'date', required: true },
      { name: 'date_optional', type: 'date', required: false },
      { name: 'time_required', type: 'time', required: true },
      { name: 'time_optional', type: 'time', required: false },
    ],
  },
];

await ensureStoreExists();
for (const schema of schemas) {
  await upsertSchema(schema);
  console.log(`Seeded schema: ${schema.name}`);
}
console.log('Done.');
