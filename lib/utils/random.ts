export const pickRandom = <T>(items: T[]): T => {
  if (!items.length) {
    throw new Error("No items to pick");
  }
  const idx = Math.floor(Math.random() * items.length);
  return items[idx]!;
};

export const shuffle = <T>(items: T[]): T[] => {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
};
