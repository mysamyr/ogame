export function uuid() {
  return `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export const planetRegex = /^\d:\d{1,3}:(?:[1-9]|1[0-6])$/;

console.log(planetRegex.test('1:123:10'));
