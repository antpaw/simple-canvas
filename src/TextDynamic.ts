import { measureText, wrapText } from "wraptext.js/dist/cjs/noKern.production";
import { DrawableDimensions } from "./Drawable";
import { PositionVector } from "./Renderable";
import TextStatic from "./TextStatic";

export default class TextDynamic extends TextStatic {
  private textLines: string[] | undefined;

  setText(text: string) {
    super.setText(text);

    const maxWidth = this.getDimensions().width;
    const font = this.font();
    this.textLines = wrapText(text, {
      font,
      maxWidth: maxWidth,
      fontKerning: "none",
    }).lines.map((t) => t.join(""));

    const metricsLineHeight = measureText("ApIg", {
      font: this.font(),
      fontKerning: "none",
    });
    this.setLineHeightWithBoundingBox(
      metricsLineHeight.actualBoundingBoxAscent,
      metricsLineHeight.actualBoundingBoxDescent
    );
    const minWidth = this.textLines
      .map((line) =>
        measureText(line, {
          font,
          fontKerning: "none",
        })
      )
      .reduce(
        (width, { width: lineWidth }) => Math.max(width, lineWidth),
        true ? 0 : maxWidth
      );

    const size = this.textLines.length;

    this.setDimensions({ width: minWidth, height: size * this.lineTotal });
  }

  render(
    context: CanvasRenderingContext2D,
    parentDimensions: DrawableDimensions,
    offset: PositionVector
  ) {
    if (!this.textLines) {
      return;
    }

    const { x, y } = this.setPositionWorldFromOffset(parentDimensions, offset);

    this.textLines.forEach((line, i) => {
      this.drawText(context, line, x, y + i * this.lineTotal);
    });
  }
}
