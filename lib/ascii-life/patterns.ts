/** Small Life patterns to drop onto the board, drawn with `O` for a live cell. */
export interface Pattern {
  width: number;
  height: number;
  cells: [number, number][];
}

function parse(rows: string[]): Pattern {
  const cells: [number, number][] = [];
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) if (row[x] === "O") cells.push([x, y]);
  });
  return { width: Math.max(...rows.map((r) => r.length)), height: rows.length, cells };
}

export const PATTERNS: Pattern[] = [
  // Glider
  parse([".O.", "..O", "OOO"]),
  // Lightweight spaceship
  parse([".O..O", "O....", "O...O", "OOOO."]),
  // Middleweight spaceship
  parse(["...O..", ".O...O", "O.....", "O....O", "OOOOO."]),
  // R-pentomino: a long-lived methuselah
  parse([".OO", "OO.", ".O."]),
  // Acorn
  parse([".O.....", "...O...", "OO..OOO"]),
  // Pi-heptomino
  parse(["OOO", "O.O", "O.O"]),
  // B-heptomino
  parse(["O.OO", "OOO.", ".O.."]),
  // Rabbits
  parse(["O...OOO", "OOO..O.", ".O....."]),
];
