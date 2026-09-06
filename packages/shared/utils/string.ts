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

export function createPatternFromConfig(patternValue: string): RegExp {
  const trimmed = patternValue.trim();
  const wrappedMatch = trimmed.match(/^\/(.+)\/([a-z]*)$/i);
  if (wrappedMatch !== null) {
    const [, source, flags] = wrappedMatch;
    return new RegExp(source!, flags);
  }
  return new RegExp(trimmed);
}
