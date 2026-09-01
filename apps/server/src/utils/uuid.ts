export function uuid() {
  return `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}
