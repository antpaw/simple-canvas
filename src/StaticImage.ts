import Drawable, { DrawableDimensions, DrawableOptions } from './Drawable';
import { PositionVector } from './Renderable';

export default class StaticImage extends Drawable {
  private image: HTMLImageElement | undefined;
  private isLoading: boolean = true;
  private isErrorLoading: boolean = false;
  private isFinalErrorError: boolean = false;

  constructor(
    options: DrawableOptions & {
      imageUrl: string;
      callback: () => void;
    }
  ) {
    super(options);
    this.startLoadImage(options.imageUrl, options.callback);
  }

  render(context: CanvasRenderingContext2D, parentDimensions: DrawableDimensions, offset: PositionVector) {
    const { x, y } = this.setPositionWorldFromOffset(parentDimensions, offset);
    const { width, height } = this.dimensions;

    if (this.image) {
      context.drawImage(this.image, x, y, width, height);
    }
  }

  startLoadImage(src: string, onLoadCallback: () => void) {
    let loadCount = 0;
    const loadImage = () => {
      this.image = new Image();
      this.image.src = src;
      this.image.addEventListener('error', () => {
        this.isLoading = false;
        this.isErrorLoading = true;
        this.isFinalErrorError = loadCount > 10;
        if (!this.isFinalErrorError) {
          loadCount++;
          setTimeout(loadImage, 2_000);
        }
      });
      this.image.addEventListener('load', () => {
        this.isLoading = false;
        this.isErrorLoading = false;
        this.isFinalErrorError = false;
        onLoadCallback();
      });
    };
    loadImage();
  }
}
