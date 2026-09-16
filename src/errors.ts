// Line and column are 1-based, matching how editors report position, since
// that's what a reader will type into a "go to line" prompt.
export class ParseError extends Error {
  readonly line: number;
  readonly column: number;

  constructor(message: string, line: number, column: number, sourceLine: string) {
    const location = `line ${line}, column ${column}`;
    const pointer = " ".repeat(Math.max(column - 1, 0)) + "^";
    super(`${message} (${location})\n  ${sourceLine}\n  ${pointer}`);
    this.name = "ParseError";
    this.line = line;
    this.column = column;
  }
}
