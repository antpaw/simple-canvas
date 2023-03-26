import Drawable, { DrawableDimensions, DrawableOptions } from './Drawable';
import { PositionVector } from './Renderable';

export default class Circle extends Drawable {
  constructor(
    options: DrawableOptions & {
      radius: number;
    }
  ) {
    super(options);
    this.setDimensions({
      width: options.radius * 2,
      height: options.radius * 2,
    });
  }

  render(context: CanvasRenderingContext2D, parentDimensions: DrawableDimensions, offset: PositionVector) {
    let { x, y } = this.setPositionWorldFromOffset(parentDimensions, offset);
    const { width } = this.dimensions;

    const radius = width / 2;
    const centerX = x + radius;
    // const centerY = y + height / 2;
    const centerY = y + radius;

    context.beginPath();
    context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);

    context.fillStyle = this.style.fill;
    context.fill();

    if (this.style.lineWidth) {
      context.lineWidth = this.style.lineWidth;
      context.strokeStyle = this.style.stroke;
      context.stroke();
    }

    this.updateInteractable(context, this.positionWorld);
  }
}
