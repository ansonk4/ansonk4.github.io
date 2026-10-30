/** Which ASCII animation sits behind the homepage. */
type Background = "sharks" | "life" | "none";

export const settings = {
  showMisc: false,
  showQuote: false,
  background: "life" as Background
} as const;
