export function toSnake(str: string): string {
  return str
    .replace(/\s+/g, '')
    .replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
    .replace(/^_/, '');
}
