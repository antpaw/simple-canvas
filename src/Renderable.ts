import Eventable, { EventableOptions, EventName } from "./Eventable";

type RenderableOption = {
  position?: PositionVector;
  origin?: OriginVector;
  zIndex?: number;
  addDraggableClass?: boolean;
  debugName?: string;
  bounds?: Bounds;
};

type OriginX = "left" | "right" | "center";
type OriginY = "top" | "bottom" | "center";

export type OriginVector = {
  x: OriginX;
  y: OriginY;
};
export type PositionVector = {
  x: number;
  y: number;
};

export type Bounds = {
  min: PositionVector;
  max: PositionVector;
};

export type RenderableOptions = RenderableOption & EventableOptions;

export default abstract class Renderable extends Eventable {
  position: PositionVector = { x: 0, y: 0 };
  origin: OriginVector = { x: "left", y: "top" };
  positionWorld: PositionVector = { x: 0, y: 0 };
  debugName: string;
  private zIndex: number;
  private cachePositionWorldOffset: PositionVector = { x: 0, y: 0 };
  private addDraggableClass: boolean = false;
  cacheOffset: PositionVector | undefined;
  private bounds: Bounds | undefined;

  constructor(options: RenderableOptions) {
    super(options);
    this.setBounds(options.bounds);
    this.addDraggableClass = options.addDraggableClass ?? true;
    this.debugName = options.debugName || "unnamed";
    if (options.zIndex || options.zIndex === 0) {
      this.zIndex = options.zIndex;
    } else {
      this.zIndex = 0;
    }
    this.setOrigin(options.origin || this.origin);
  }

  onDragStart(mousePosition: PositionVector): void {
    this.stashMouseEnterAndOut(false);
    this.setFromWorldPositionOffset(mousePosition);
    this.fire("dragstart");
  }
  onDrag(mousePosition: PositionVector): void {
    this.setFromWorldPosition(mousePosition);
    this.fire("drag");
  }
  onDragEnd(mousePosition: PositionVector): void {
    this.stashMouseEnterAndOut(true);
    this.setFromWorldPosition(mousePosition);
    this.fire("dragend");
  }

  setBounds(bounds: Bounds | undefined) {
    this.bounds = bounds;
  }

  setOrigin(origin: OriginVector): void {
    this.origin = origin;
  }

  getPosition(): PositionVector {
    return this.position;
  }

  isShowDraggable(): boolean {
    return this.addDraggableClass;
  }

  abstract setPosition(position: PositionVector): void;

  setFromWorldPositionOffset(offset: PositionVector): void {
    this.setOrigin({ x: "left", y: "top" });
    this.cachePositionWorldOffset = Renderable.subtractRenderVectors(
      this.positionWorld,
      offset
    );
  }

  setFromWorldPosition(positionWorld: PositionVector): void {
    let newPosition = Renderable.subtractRenderVectors(
      Renderable.addRenderVectors(positionWorld, this.cachePositionWorldOffset),
      this.cacheOffset
    );
    if (this.bounds) {
      newPosition = Renderable.minRenderVectors(
        this.bounds.min,
        Renderable.maxRenderVectors(this.bounds.max, newPosition)
      );
    }
    this.setPosition(newPosition);
  }

  getZIndex(): number {
    return this.zIndex;
  }

  setZIndexIfUnset(zIndex: number): number {
    if (!this.zIndex && this.zIndex !== 0) {
      this.zIndex = zIndex;
    }
    return this.zIndex;
  }

  static addRenderVectors(
    a: PositionVector,
    b?: PositionVector
  ): PositionVector {
    if (b) {
      // it is important to return a new object
      // to avoid adding offset over and over again
      return {
        x: a.x + b.x,
        y: a.y + b.y,
      };
    }
    return a;
  }

  static subtractRenderVectors(
    a: PositionVector,
    b?: PositionVector
  ): PositionVector {
    if (b) {
      // it is important to return a new object
      // to avoid adding offset over and over again
      return {
        x: a.x - b.x,
        y: a.y - b.y,
      };
    }
    return a;
  }

  static maxRenderVectors(
    a: PositionVector,
    b: PositionVector
  ): PositionVector {
    if (a.x > b.x && a.y > b.y) {
      return a;
    }
    if (b.x > a.x && b.y > a.y) {
      return b;
    }
    return {
      x: Math.max(b.x, a.x),
      y: Math.max(b.y, a.y),
    };
  }

  static minRenderVectors(
    a: PositionVector,
    b: PositionVector
  ): PositionVector {
    if (a.x < b.x && a.y < b.y) {
      return a;
    }
    if (b.x < a.x && b.y < a.y) {
      return b;
    }
    return {
      x: Math.min(b.x, a.x),
      y: Math.min(b.y, a.y),
    };
  }

  abstract findPointInDimensions(
    eventName: EventName,
    context: CanvasRenderingContext2D,
    x: number,
    y: number
  ): Renderable | undefined;

  abstract isPointInDimensions(
    eventName: EventName,
    context: CanvasRenderingContext2D,
    x: number,
    y: number
  ): boolean;
}
