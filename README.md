# crossword-grid-converter

Crossword grids get passed around in a pile of incompatible formats: binary
`.puz` files, various JSON dialects, ad-hoc plain text someone typed into a
forum post. If you've ever wanted to hand-edit a grid in a text file and
then feed it to a program, you've hit the gap this fills.

This project converts between:

- **grid text** (`.gtxt`) — a plain text format meant to be typed and read
  by a person, described below
- **crossword JSON** (`.cxj`) — a plain JSON interchange format meant to be
  read by other programs

Right now only grid text → in-memory model is implemented (`parseGridText`
in `src/parser.ts`). JSON serialization and the reverse direction are not
built yet; see Roadmap.

## The grid text format

```
TITLE: Sunday Special
AUTHOR: J. Doe

GRID:
###.###
#.....#
#.###.#
.......
#.###.#
#.....#
###.###

ACROSS:
1. Feline sound (4) = MEOW
5. Opposite of down (2) = UP

DOWN:
1. Aquatic mammal (5) = MANTA
2. Not odd (4) = EVEN
```

Rules:

- `TITLE:` and `AUTHOR:` are optional metadata lines. Everything after the
  colon is taken verbatim as the value.
- `GRID:` starts the grid. Every row after it must be the same length as
  the first row. Each character is `#` for a block, `.` for a blank cell,
  or an uppercase letter `A`-`Z` for a cell with a known solution.
- `ACROSS:` and `DOWN:` start their clue lists. Each clue line looks like
  `<number>. <text> (<length>)`, optionally followed by ` = ANSWER` if
  you want to record the solution. If given, the answer's length must
  match the declared length.
- A blank line ends whatever section you're in.

## Usage

```ts
import { parseGridText } from "./src/parser.js";

const puzzle = parseGridText(`GRID:
###
#.#
###

ACROSS:
2. Middle letter (1) = X

DOWN:
`);

console.log(puzzle.width, puzzle.height); // 3 3
console.log(puzzle.clues.across[0]);      // { number: 2, text: "Middle letter", length: 1, answer: "X" }
```

This repository has no dependencies to install. Compiling `src/` requires
a TypeScript compiler of your own (`tsc`, or a TypeScript-aware runtime);
none is bundled here.

## Getting good errors

The point of the plain text format is that a person types it by hand, so
mistakes are normal and the parser is expected to say exactly where one is.
Every failure is a `ParseError` with a 1-based `line` and `column`, plus a
message that quotes the offending line and points at the character:

```
$ cat bad.gtxt
GRID:
###.###
#.....#
#.##x.#
.......
#.###.#
#.....#
###.###
```

```
ParseError: invalid grid character "x" (use "#" for a block, "." for a blank cell, or a letter A-Z for a known solution) (line 4, column 5)
  #.##x.#
      ^
```

Row-length mismatches, malformed clue lines, duplicate clue numbers, and
answers whose length disagrees with the declared clue length are all
reported the same way, with the pointer landing on the exact column.

## Roadmap

- Serialize the parsed model to crossword JSON (`.cxj`)
- Parse crossword JSON back into the model, with matching JSON-path style
  error locations
- Compute standard crossword numbering from the grid and cross-check it
  against the clue numbers in `ACROSS:`/`DOWN:`
- A small CLI (`gridconv in.gtxt out.cxj`) once both directions exist
- Round-trip tests once a test runner is chosen
