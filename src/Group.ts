import Drawable, { DrawableDimensions, DrawableOptions } from "./Drawable";
import { EventName } from "./Eventable";
import Renderable, { PositionVector } from "./Renderable";

type GroupOption = {
  background?: Drawable;
  doRecalculateDimensions?: boolean;
};

export type GroupOptions = GroupOption & DrawableOptions;

export default class Group extends Drawable {
  renderables: Drawable[] = [];
  sortedRenderables: Drawable[] = [];
  interactableRenderables: Renderable[] = [];

  private background?: Drawable;
  doRecalculateDimensions: boolean = true;

  constructor(renderables: Drawable[], options: GroupOptions) {
    super(options);
    this.background = options.background;
    this.doRecalculateDimensions = options.doRecalculateDimensions ?? true;

    this.set(renderables);
    // this.IS_DEBUG = true;
  }

  set(renderables: Drawable[]) {
    if (renderables.length === 0) {
      this.renderables = [];
      this.sortedRenderables = [];
      this.interactableRenderables = [];
      return;
    }
    this.renderables = renderables;
    this.setZIndexRenderables(this.renderables);
    this.sortedRenderables = this.renderables.sort(
      (a, b) => a.getZIndex() - b.getZIndex()
    );
    this.interactableRenderables = this.renderables
      .filter((a) => a.hasInteractableOrChildren())
      .reverse();

    this.recalculateDimensions();
  }

  private recalculateDimensions() {
    if (!this.doRecalculateDimensions) {
      return;
    }
    let totalWidth = 0;
    let totalHeight = 0;
    this.sortedRenderables.forEach((o) => {
      const { width: oWidth, height: oHeight } = o.dimensions;
      const oCalWidth = o.origin.x === "center" ? oWidth / 2 : oWidth;
      const oCalHeight = o.origin.y === "center" ? oHeight / 2 : oHeight;
      totalWidth = Math.max(oCalWidth + o.position.x, totalWidth);
      totalHeight = Math.max(oCalHeight + o.position.y, totalHeight);
    });
    const d = { width: totalWidth, height: totalHeight };
    this.setDimensions(d);
    this.background?.setDimensions(d);
  }

  private setZIndexRenderables(renderables: Renderable[]): void {
    renderables.forEach((r, i) => r.setZIndexIfUnset(i));
  }

  hasInteractableOrChildren(): boolean {
    return (
      this.isInteractable() ||
      this.sortedRenderables.find((r) => r.hasInteractableOrChildren()) !== null
    );
  }

  render(
    context: CanvasRenderingContext2D,
    parentDimensions: DrawableDimensions,
    offset: PositionVector
  ): void {
    // TODO mark dirty an recalculate somewhere else
    this.recalculateDimensions();

    this.setPositionWorldFromOffset(parentDimensions, offset);

    this.background?.render(context, this.dimensions, this.positionWorld);

    this.sortedRenderables.forEach((o) => {
      o.render(context, this.dimensions, this.positionWorld);
    });

    // totalWidth -= minX;
    // totalHeight -= minY;
    if (this.IS_DEBUG) {
      Drawable.drawDebug(
        context,
        this.dimensions,
        this.positionWorld,
        this.debugName,
        "rgba(10, 100, 130, 0.4)"
      );
    }
    this.updateInteractable(context, this.positionWorld);
  }

  findPointInDimensions(
    eventName: EventName,
    context: CanvasRenderingContext2D,
    x: number,
    y: number
  ): Renderable | undefined {
    const size = this.interactableRenderables.length;
    for (let i = 0; i < size; i++) {
      const element = this.interactableRenderables[i];
      const found = element.findPointInDimensions(eventName, context, x, y);
      if (found) {
        return found;
      }
    }

    if (this.isPointInDimensions(eventName, context, x, y)) {
      return this;
    }
  }
}
