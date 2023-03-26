import Drawable, { DrawableDimensions } from "./Drawable";
import { PositionVector } from "./Renderable";

export default class Rect extends Drawable {
  render(
    context: CanvasRenderingContext2D,
    parentDimensions: DrawableDimensions,
    offset: PositionVector
  ) {
    const { x, y } = this.setPositionWorldFromOffset(parentDimensions, offset);
    const { width, height } = this.dimensions;

    context.fillStyle = this.style.fill;
    if (this.style.borderRadius) {
      roundedRect(context, x, y, width, height, this.style.borderRadius);
      context.fill();
      if (this.style.lineWidth) {
        context.lineWidth = this.style.lineWidth;
        context.strokeStyle = this.style.stroke;
        context.stroke();
      }
    } else {
      context.fillRect(x, y, width, height);
      if (this.style.lineWidth) {
        context.lineWidth = this.style.lineWidth;
        context.strokeStyle = this.style.stroke;
        context.strokeRect(x, y, width, height);
      }
    }

    this.updateInteractable(context, this.positionWorld);
  }
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
