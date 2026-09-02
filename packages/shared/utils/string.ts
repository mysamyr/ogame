export function toSnake(str: string): string {
  return str
    .replace(/\s+/g, '')
    .replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
    .replace(/^_/, '');
}

export const toCapital = (value: string): string =>
  value
    .split(/[\s_]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
