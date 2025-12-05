export const normalizeWord = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

export const shortId = () =>
  crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);
