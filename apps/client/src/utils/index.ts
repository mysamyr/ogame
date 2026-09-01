export function classNames(
  ...classes: (string | boolean | undefined)[]
): string {
  return classes.filter(Boolean).join(' ');
}

export * from './date.js';
export * from './string.js';
