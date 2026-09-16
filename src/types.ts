export interface BlockCell {
  readonly type: "block";
}

export interface LetterCell {
  readonly type: "letter";
  // null means the letter is present in the diagram but its solution is unknown.
  readonly solution: string | null;
}

export type Cell = BlockCell | LetterCell;

export interface Clue {
  readonly number: number;
  readonly text: string;
  readonly length: number;
  readonly answer: string | null;
}

export interface CrosswordPuzzle {
  readonly title: string | null;
  readonly author: string | null;
  readonly width: number;
  readonly height: number;
  readonly cells: ReadonlyArray<ReadonlyArray<Cell>>;
  readonly clues: {
    readonly across: ReadonlyArray<Clue>;
    readonly down: ReadonlyArray<Clue>;
  };
}
