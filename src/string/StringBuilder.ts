export interface StringBuilder {
  append(arg: string): void;

  build(): string;
}

export const createStringBuilder = (): StringBuilder => {
  let buffer = '';

  return {
    append: arg => {
      buffer += arg;
    },

    build: () => buffer,
  };
};
