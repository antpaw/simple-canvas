import Cell from "./Cell";
import { DrawableOptions } from "./Drawable";
import Group from "./Group";

export default class Grid extends Group {
  constructor(cells: Cell[], options: DrawableOptions) {
    super(cells, options);
    this.realign(cells);
    // this.IS_DEBUG = true;
  }

  realign(cells: Cell[]): void {
    const maxRowY: number[] = [];
    const maxColX: number[] = [];

    cells.forEach((cell) => {
      const row = cell.getRow();
      const column = cell.getColumn();
      const { width, height } = cell.getDimensionsWithPosition();

      maxRowY[row] = Math.max(height, maxRowY[row] || 0);
      maxColX[column] = Math.max(width, maxColX[column] || 0);

      const x = maxColX.reduce(
        (accumulator: number, currentValue: number, loopColumn: number) => {
          if (loopColumn < column) {
            return accumulator + currentValue;
          }
          return accumulator;
        },
        0
      );
      const y = maxRowY.reduce(
        (accumulator: number, currentValue: number, loopRow: number) => {
          if (loopRow < row) {
            return accumulator + currentValue;
          }
          return accumulator;
        },
        0
      );
      cell.setPosition({ x, y });
    });
  }
}
