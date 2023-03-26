import Drawable, { DrawableDimensions, DrawableOptions } from "./Drawable";
import Group from "./Group";
import { PositionVector } from "./Renderable";

export type CellOptions = { column: number; row: number } & DrawableOptions;
export default class Cell extends Group {
  private column: number;
  private row: number;

  constructor(renderables: Drawable[], options: CellOptions) {
    super(renderables, options);
    this.column = options.column;
    this.row = options.row;
    this.debugName = `cell_${this.row}-${this.column}`;
    // this.IS_DEBUG = true;
  }

  getDimensionsWithPosition(): DrawableDimensions {
    return Drawable.buildMinMaxDimensions(
      this.renderables.map((r) =>
        Drawable.addRenderVectorAndRenderVector(
          r.getDimensions(),
          r.getPosition()
        )
      )
    );
  }

  getPosition(): PositionVector {
    return this.renderables.map((r) => r.getPosition())[0];
  }

  getColumn(): number {
    return this.column;
  }
  getRow(): number {
    return this.row;
  }
}
