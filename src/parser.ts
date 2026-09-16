import { ParseError } from "./errors.js";
import type { Cell, Clue, CrosswordPuzzle } from "./types.js";

interface SourceLine {
  readonly text: string;
  readonly lineNumber: number;
}

type Section = "none" | "grid" | "across" | "down";

const CLUE_LINE = /^(\d+)\.\s+(.+?)\s+\((\d+)\)(?:\s*=\s*([A-Z]+))?\s*$/;

/**
 * Parses the plain-text grid format (see README.md) into a CrosswordPuzzle.
 * Every failure throws a ParseError carrying a 1-based line and column so
 * the caller can point straight at the offending character.
 */
export function parseGridText(source: string): CrosswordPuzzle {
  const rawLines = source.split(/\r\n|\r|\n/);

  let title: string | null = null;
  let author: string | null = null;
  let section: Section = "none";
  let sawGrid = false;

  const gridLines: SourceLine[] = [];
  const acrossLines: SourceLine[] = [];
  const downLines: SourceLine[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i] as string;
    const lineNumber = i + 1;

    if (line.trim() === "") {
      section = "none";
      continue;
    }

    if (line.startsWith("TITLE:")) {
      title = line.slice("TITLE:".length).trim();
      section = "none";
      continue;
    }

    if (line.startsWith("AUTHOR:")) {
      author = line.slice("AUTHOR:".length).trim();
      section = "none";
      continue;
    }

    if (line === "GRID:") {
      section = "grid";
      sawGrid = true;
      continue;
    }

    if (line === "ACROSS:") {
      section = "across";
      continue;
    }

    if (line === "DOWN:") {
      section = "down";
      continue;
    }

    if (section === "none") {
      throw new ParseError(
        `line does not belong to any section (expected a "GRID:", "ACROSS:" or "DOWN:" header above it)`,
        lineNumber,
        1,
        line,
      );
    }

    if (section === "grid") {
      gridLines.push({ text: line, lineNumber });
    } else if (section === "across") {
      acrossLines.push({ text: line, lineNumber });
    } else {
      downLines.push({ text: line, lineNumber });
    }
  }

  if (!sawGrid) {
    throw new ParseError("missing a \"GRID:\" section", 1, 1, rawLines[0] ?? "");
  }

  const cells = parseGrid(gridLines);
  const across = parseClues(acrossLines, "across");
  const down = parseClues(downLines, "down");

  return {
    title,
    author,
    width: cells[0]?.length ?? 0,
    height: cells.length,
    cells,
    clues: { across, down },
  };
}

function parseGrid(lines: SourceLine[]): Cell[][] {
  if (lines.length === 0) {
    throw new ParseError('"GRID:" section has no rows', 1, 1, "");
  }

  const width = lines[0]!.text.length;
  const rows: Cell[][] = [];

  for (const { text, lineNumber } of lines) {
    if (text.length !== width) {
      const column = Math.min(text.length, width) + 1;
      throw new ParseError(
        `row has ${text.length} column${text.length === 1 ? "" : "s"}, but row 1 set the grid width to ${width}`,
        lineNumber,
        column,
        text,
      );
    }

    const row: Cell[] = [];
    for (let col = 0; col < text.length; col++) {
      const ch = text[col] as string;
      if (ch === "#") {
        row.push({ type: "block" });
      } else if (ch === ".") {
        row.push({ type: "letter", solution: null });
      } else if (/^[A-Z]$/.test(ch)) {
        row.push({ type: "letter", solution: ch });
      } else {
        throw new ParseError(
          `invalid grid character ${JSON.stringify(ch)} (use "#" for a block, "." for a blank cell, or a letter A-Z for a known solution)`,
          lineNumber,
          col + 1,
          text,
        );
      }
    }
    rows.push(row);
  }

  return rows;
}

function parseClues(lines: SourceLine[], direction: "across" | "down"): Clue[] {
  const seenNumbers = new Map<number, number>();
  const clues: Clue[] = [];

  for (const { text, lineNumber } of lines) {
    const match = CLUE_LINE.exec(text);
    if (!match) {
      throw new ParseError(
        `malformed ${direction} clue, expected "<number>. <clue text> (<length>)" with an optional " = ANSWER" suffix`,
        lineNumber,
        1,
        text,
      );
    }

    const [, numberText, clueText, lengthText, answer] = match as unknown as [
      string,
      string,
      string,
      string,
      string | undefined,
    ];
    const number = Number.parseInt(numberText, 10);
    const length = Number.parseInt(lengthText, 10);

    const firstSeenOn = seenNumbers.get(number);
    if (firstSeenOn !== undefined) {
      throw new ParseError(
        `duplicate ${direction} clue number ${number} (first used on line ${firstSeenOn})`,
        lineNumber,
        1,
        text,
      );
    }
    seenNumbers.set(number, lineNumber);

    if (answer !== undefined && answer.length !== length) {
      const answerColumn = text.lastIndexOf(answer) + 1;
      throw new ParseError(
        `answer "${answer}" is ${answer.length} letters long, but the clue declares a length of ${length}`,
        lineNumber,
        answerColumn,
        text,
      );
    }

    clues.push({ number, text: clueText, length, answer: answer ?? null });
  }

  return clues;
}
