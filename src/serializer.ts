import type { Cell, Clue, CrosswordPuzzle } from "./types.js";

// The JSON form of a clue. Kept structurally identical to Clue so that
// serializing and re-parsing don't need a translation step beyond JSON
// itself.
export interface ClueJson {
  readonly number: number;
  readonly text: string;
  readonly length: number;
  readonly answer: string | null;
}

export interface CrosswordJson {
  readonly title: string | null;
  readonly author: string | null;
  readonly width: number;
  readonly height: number;
  // Each row is encoded exactly like a GRID: row in the text format ("#"
  // for a block, "." for a blank cell, A-Z for a known solution), so the
  // two formats agree on how a grid looks and neither needs its own
  // separate mental model.
  readonly grid: ReadonlyArray<string>;
  readonly clues: {
    readonly across: ReadonlyArray<ClueJson>;
    readonly down: ReadonlyArray<ClueJson>;
  };
}

/**
 * Converts a parsed puzzle to the crossword JSON interchange format
 * (see README.md). This is a pure data transformation; it doesn't
 * revalidate anything the parser already checked.
 */
export function toCrosswordJson(puzzle: CrosswordPuzzle): CrosswordJson {
  return {
    title: puzzle.title,
    author: puzzle.author,
    width: puzzle.width,
    height: puzzle.height,
    grid: puzzle.cells.map(rowToGridLine),
    clues: {
      across: puzzle.clues.across.map(clueToJson),
      down: puzzle.clues.down.map(clueToJson),
    },
  };
}

/**
 * Convenience wrapper around toCrosswordJson that returns the serialized
 * text directly, since writing a .cxj file is the common case.
 */
export function serializeToJson(puzzle: CrosswordPuzzle, space = 2): string {
  return JSON.stringify(toCrosswordJson(puzzle), null, space);
}

function rowToGridLine(row: ReadonlyArray<Cell>): string {
  return row.map(cellToChar).join("");
}

function cellToChar(cell: Cell): string {
  if (cell.type === "block") {
    return "#";
  }
  return cell.solution ?? ".";
}

function clueToJson(clue: Clue): ClueJson {
  return {
    number: clue.number,
    text: clue.text,
    length: clue.length,
    answer: clue.answer,
  };
}
