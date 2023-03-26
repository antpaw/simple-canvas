import { EventName } from "./Eventable";
import Renderable, { RenderableOptions, PositionVector } from "./Renderable";

type InteractiveArea = {
  position: PositionVector;
  dimensions: DrawableDimensions;
};

type DrawableOption = {
  dimensions?: DrawableDimensions;
  padding?: number;
  interactiveArea?: InteractiveArea;
  style?: DrawableStyleOption;
};

export type DrawableDimensions = {
  width: number;
  height: number;
};

type DrawableStyleOption = {
  fill?: string;
  stroke?: string;
  lineWidth?: number;
  borderRadius?: number;
};
type DrawableStyle = {
  fill: string;
  stroke: string;
  lineWidth: number;
  borderRadius: number;
};

export type DrawableOptions = RenderableOptions & DrawableOption;

export default abstract class Drawable extends Renderable {
  public dimensions: DrawableDimensions = { width: 0, height: 0 };
  public style: DrawableStyle = Drawable.GetDefaultStyle();

  private interactableArea: Path2D | undefined;
  private interactiveArea: InteractiveArea | undefined;
  private padding: number;

  IS_DEBUG: boolean = false;

  constructor(options: DrawableOptions) {
    super(options);
    this.padding = options.padding || 0;
    this.interactiveArea = options.interactiveArea;
    this.resetStyle(options.style || this.style);
    this.setDimensions(options.dimensions || this.dimensions);
    this.setPosition(options.position || this.position);
    // this.IS_DEBUG = true;
  }

  resetStyle(style: DrawableStyleOption): void {
    this.style = Object.assign(Drawable.GetDefaultStyle(), style);
  }

  getDimensions(): DrawableDimensions {
    return this.dimensions;
  }

  setDimensions(dimensions: DrawableDimensions): void {
    if (this.padding) {
      const p = this.padding * 2;
      this.dimensions = {
        width: dimensions.width + p,
        height: dimensions.height + p,
      };
    } else {
      this.dimensions = dimensions;
    }
  }

  setPosition(position: PositionVector): void {
    if (this.padding) {
      this.position = {
        x: position.x - this.padding,
        y: position.y - this.padding,
      };
    } else {
      this.position = position;
    }
  }

  setPositionWorldFromOffset(
    parentDimensions: DrawableDimensions,
    offset: PositionVector
  ): PositionVector {
    this.cacheOffset = offset;
    const { width: pWidth, height: pHeight } = parentDimensions;
    const { width, height } = this.dimensions;
    let finalX = this.position.x;
    if (this.origin.x === "right") {
      finalX = pWidth - this.position.x - width;
    } else if (this.origin.x === "center") {
      finalX = pWidth / 2 + this.position.x - width / 2;
    }
    let finalY = this.position.y;
    if (this.origin.y === "bottom") {
      finalY = pHeight - this.position.y - height;
    } else if (this.origin.y === "center") {
      finalY = pHeight / 2 + this.position.y - height / 2;
    }

    this.positionWorld = Renderable.addRenderVectors(
      { x: finalX, y: finalY },
      offset
    );
    return this.positionWorld;
  }

  abstract render(
    context: CanvasRenderingContext2D,
    parentDimensions: DrawableDimensions,
    offset: PositionVector
  ): void;

  static drawDebug(
    context: CanvasRenderingContext2D,
    dimensions: DrawableDimensions,
    position: PositionVector,
    debugName: string = "",
    fillStyle: string = "rgba(100, 100, 100, 0.4)"
  ) {
    const { x, y } = position;
    const { width, height } = dimensions;
    context.fillStyle = fillStyle;
    context.fillRect(x, y, width, height);
    if (debugName) {
      context.fillStyle = "black";
      context.font = "12px sans-serif";
      context.textAlign = "left";

      context.fillText(debugName, x + 2, y + 12);
    }
  }
  updateInteractable(
    context: CanvasRenderingContext2D,
    positionWorld: PositionVector
  ): void {
    if (this.isInteractable()) {
      const interactableArea = new Path2D();
      let x, y, width, height;
      if (this.interactiveArea) {
        x = this.interactiveArea.position.x + positionWorld.x;
        y = this.interactiveArea.position.y + positionWorld.y;
        width = this.interactiveArea.dimensions.width;
        height = this.interactiveArea.dimensions.height;
      } else {
        x = positionWorld.x;
        y = positionWorld.y;
        width = this.dimensions.width;
        height = this.dimensions.height;
      }
      interactableArea.rect(x, y, width, height);
      this.interactableArea = interactableArea;
      if (this.IS_DEBUG) {
        Drawable.drawDebug(
          context,
          { width, height },
          { x, y },
          this.debugName +
            "-interactable" +
            (this.interactiveArea ? "-custom" : "")
        );
      }
    } else {
      this.interactableArea = undefined;
    }
  }

  findPointInDimensions(
    eventName: EventName,
    context: CanvasRenderingContext2D,
    x: number,
    y: number
  ): Renderable | undefined {
    if (this.isPointInDimensions(eventName, context, x, y)) {
      return this;
    }
  }

  isPointInDimensions(
    eventName: EventName,
    context: CanvasRenderingContext2D,
    x: number,
    y: number
  ): boolean {
    if (this.interactableArea && this.hasEvent(eventName)) {
      return context.isPointInPath(this.interactableArea, x, y);
    }
    return false;
  }

  setFill(color: string): void {
    this.style.fill = color;
  }
  setStroke(stroke: string): void {
    this.style.stroke = stroke;
  }
  setLineWidth(lineWidth: number): void {
    this.style.lineWidth = lineWidth;
  }
  setBorderRadius(borderRadius: number): void {
    this.style.borderRadius = borderRadius;
  }

  static addDrawableDimension(
    a: DrawableDimensions,
    b?: PositionVector
  ): DrawableDimensions {
    if (b) {
      // it is important to return a new object
      // to avoid adding offset over and over again
      return {
        width: a.width + b.x,
        height: a.height + b.y,
      };
    }
    return a;
  }

  static addRenderVectorAndRenderVector(
    a: DrawableDimensions,
    b?: PositionVector
  ): DrawableDimensions {
    if (b) {
      // it is important to return a new object
      // to avoid adding offset over and over again
      return {
        width: a.width + b.x,
        height: a.height + b.y,
      };
    }
    return a;
  }

  static buildMinMaxDimensions(
    drawables: DrawableDimensions[]
  ): DrawableDimensions {
    return drawables.reduce(
      (p, c) => {
        // TODO why `??`
        p.height = c.height > p.height ? c.height : p.height ?? c.height;
        p.width = c.width > p.width ? c.width : p.width ?? c.width;
        return p;
      },
      { width: 0, height: 0 }
    );
  }

  static maxDimensions(
    a: DrawableDimensions,
    b: DrawableDimensions
  ): DrawableDimensions {
    if (a.width > b.width && a.height > b.height) {
      return a;
    }
    if (b.width > a.width && b.height > a.height) {
      return b;
    }
    return {
      width: Math.max(b.width, a.width),
      height: Math.max(b.height, a.height),
    };
  }

  static GetDefaultStyle(): DrawableStyle {
    return {
      fill: "#000",
      stroke: "#000",
      lineWidth: 0,
      borderRadius: 0,
    };
  }
}
