const MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  '\'': '&#039;',
};

const replacer = (
  (match: keyof typeof MAP): string => MAP[match]
) as ((match: string) => string);

export const htmlspecialchars = (value: any) => {
  return `${value}`.replace(/[&<>"']/g, replacer);
};
