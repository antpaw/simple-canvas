import Drawable, { DrawableDimensions, DrawableOptions } from './Drawable';
import { PositionVector } from './Renderable';

type TextAlign = 'left' | 'right' | 'center';

type TextStyleOption = {
  textStyle?: TextStyleOptions;
};

type TextStyleOptions = {
  fontSize?: number;
  fontFace?: string;
  fontStyle?: string;
  textAlign?: TextAlign;
  lineHeight?: number;
};

type TextStyle = {
  fontSize: number;
  fontFace: string;
  fontStyle: string;
  textAlign: TextAlign;
  lineHeight: number;
};

export type TextStaticOptions = TextStyleOption & DrawableOptions;

export default class TextStatic extends Drawable {
  text: string = '';

  textStyle: TextStyle = TextStatic.GetDefaultTextStyle();
  private lineHeight: number = 0;
  private lineSpacing: number = 0;
  private firstLineStart: number = 0;
  // lastLineEnd: number;
  lineTotal: number = 0;

  constructor(text: string, options: TextStaticOptions) {
    super(options);
    this.setStyle(options.textStyle || this.textStyle);
    this.setText(text);
  }

  static GetDefaultTextStyle(): TextStyle {
    return {
      fontSize: 18,
      fontFace: 'sans-serif',
      fontStyle: '',
      textAlign: 'left',
      lineHeight: 30,
    };
  }

  font() {
    return `${this.textStyle.fontStyle} ${this.textStyle.fontSize}px ${this.textStyle.fontFace}`;
  }

  setStyle(testStyle: TextStyleOptions) {
    this.textStyle = Object.assign(TextStatic.GetDefaultTextStyle(), testStyle);
  }

  setText(text: string) {
    this.text = text;
  }

  setLineHeightWithBoundingBox(actualBoundingBoxAscent: number, actualBoundingBoxDescent: number) {
    this.lineHeight = actualBoundingBoxAscent + actualBoundingBoxDescent;
    this.lineSpacing = this.lineHeight / 5;
    this.firstLineStart = actualBoundingBoxAscent + this.lineSpacing;
    // this.lastLineEnd = actualBoundingBoxDescent + this.lineSpacing;
    this.lineTotal = this.lineHeight + this.lineSpacing * 1.7;
  }

  drawText(context: CanvasRenderingContext2D, text: string, x: number, y: number): void {
    context.fillStyle = this.style.fill;
    context.font = this.font();
    context.textAlign = this.textStyle.textAlign;

    context.fillText(text, x, y + this.firstLineStart);
  }

  render(context: CanvasRenderingContext2D, parentDimensions: DrawableDimensions, offset: PositionVector) {
    const { x, y } = this.setPositionWorldFromOffset(parentDimensions, offset);
    this.drawText(context, this.text, x, y);
  }
}
