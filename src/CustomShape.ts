import Drawable, { DrawableDimensions, DrawableOptions } from './Drawable';
import { PositionVector } from './Renderable';

type DrawableCallback = (context: CanvasRenderingContext2D, position: PositionVector, dimensions: DrawableDimensions) => PositionVector;

export default class CustomShape extends Drawable {
  shapeRender: DrawableCallback;

  constructor(
    options: DrawableOptions & {
      shapeRender: DrawableCallback;
    }
  ) {
    super(options);
    this.shapeRender = options.shapeRender;
  }

  render(context: CanvasRenderingContext2D, parentDimensions: DrawableDimensions, offset: PositionVector) {
    const position = this.setPositionWorldFromOffset(parentDimensions, offset);

    context.fillStyle = this.style.fill;

    this.positionWorld = this.shapeRender(context, position, this.dimensions);

    this.updateInteractable(context, this.positionWorld);
  }
}
