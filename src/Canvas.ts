import Drawable, { DrawableDimensions } from './Drawable';
import { EventName } from './Eventable';
import Group from './Group';
import Renderable, { PositionVector } from './Renderable';
import throttle from './utils/throttle';

export type CanvasOptions = {
  dimensions?: {
    width?: number;
    height?: number;
    matchParent?: boolean;
  };
  scale?: number;
  keyboard?: {
    cancelInteractionsWithEsc?: boolean;
  };
  hasCanvasDrag?: boolean;
};

export type MouseCanvasEvent = { offsetX: number; offsetY: number };

export default class Canvas {
  private canvasElement: HTMLCanvasElement;
  private canvasContext: CanvasRenderingContext2D;
  elementDimensions: DrawableDimensions = { width: 0, height: 0 };
  private elementPixels: DrawableDimensions = { width: 0, height: 0 };
  private position: PositionVector = { x: 0, y: 0 };
  private mainGroup: Group;
  private renderCallback: VoidFunction;
  private scale: number = 1;
  private scaleRaw: number = 1;
  private ratio: number;
  private hasCanvasDrag: boolean;

  constructor(canvasParentElement: HTMLElement, options: CanvasOptions) {
    const { dimensions: optionDimensions, keyboard } = options;
    this.hasCanvasDrag = options.hasCanvasDrag ?? true;
    this.ratio = window.devicePixelRatio || 1;
    this.mainGroup = new Group([], {
      debugName: 'mainGroup',
      // doRecalculateDimensions: false,
      // events: new Set<EventName>(["drag"]),
      addDraggableClass: false,
    });
    this.setScale(options.scale ?? this.scale);
    this.renderCallback = this.render.bind(this);
    if (!canvasParentElement) {
      throw new Error('id returns an empty element');
    }
    this.canvasElement = document.createElement('canvas');
    canvasParentElement.appendChild(this.canvasElement);
    const canvasContext = this.canvasElement.getContext('2d');
    if (!canvasContext) {
      throw new Error(' returns an element with wrong type');
    }
    this.canvasContext = canvasContext;
    if (canvasParentElement) {
      if (optionDimensions?.matchParent) {
        this.setCanvasSize({
          width: canvasParentElement.clientWidth,
          height: canvasParentElement.clientHeight,
        });
        // TODO cleanup on destroy
        window.addEventListener(
          'resize',
          throttle(() => {
            this.setCanvasSize({
              width: canvasParentElement.clientWidth,
              height: canvasParentElement.clientHeight,
            });
            this.renderFastWithAnimationFrame();
          }, 1_000)
        );
      } else {
        this.setCanvasSize({
          width: optionDimensions?.width ?? 100,
          height: optionDimensions?.height ?? 100,
        });
      }
    } else {
      throw new Error('matchParentDimensions can not be set');
    }

    this.canvasElement.addEventListener('click', (event) => {
      if (disabled || lastDragged) {
        return;
      }
      const selectedRenderable = this.getElementOfEvent('click', event);

      if (selectedRenderable) {
        selectedRenderable.fire('click');
      }
    });

    let mouseDown = false;
    let mouseX = 0;
    let mouseY = 0;
    let mouseXStart = 0;
    let mouseYStart = 0;
    let disabled = false;
    let lastEnteredMouseEnter: Renderable | undefined;
    let lastEnteredDrag: Renderable | undefined;
    let lastEnteredClick: Renderable | undefined;
    let lastDragged: Renderable | undefined;

    const convertMouseWithScaleToPosition = (): PositionVector => {
      return {
        x: (mouseX - mouseXStart) / this.scaleRaw + mouseXStart,
        y: (mouseY - mouseYStart) / this.scaleRaw + mouseYStart,
      };
    };

    const dragChangeCallback = (event: MouseCanvasEvent): boolean => {
      let selectedRenderableDrag = this.getElementOfEvent('drag', event);
      let needsRender = false;

      if (mouseDown) {
        // dragStart
        if (!lastDragged) {
          if (selectedRenderableDrag) {
            mouseXStart = mouseX;
            mouseYStart = mouseY;
            lastDragged = selectedRenderableDrag;
          } else if (this.hasCanvasDrag) {
            lastDragged = this.mainGroup;
          } else {
            return false;
          }
          lastDragged.onDragStart(convertMouseWithScaleToPosition());
          this.canvasElement.classList.add('dragging');
          this.canvasElement.classList.remove('draggable');
        }
        // drag
        lastDragged.onDrag(convertMouseWithScaleToPosition());
        needsRender = true;
      }
      // dragEnd
      else if (lastDragged) {
        lastDragged.onDragEnd(convertMouseWithScaleToPosition());
        this.canvasElement.classList.remove('dragging');
        this.canvasElement.classList.toggle('draggable', lastDragged.isShowDraggable());
        lastDragged = undefined;
        needsRender = true;
      } else {
        if (selectedRenderableDrag) {
          if (selectedRenderableDrag !== lastEnteredDrag) {
            lastEnteredDrag = selectedRenderableDrag;
            this.canvasElement.classList.toggle('draggable', selectedRenderableDrag.isShowDraggable());
          }
        } else {
          if (lastEnteredDrag) {
            this.canvasElement.classList.remove('draggable');
          }
          lastEnteredDrag = undefined;
        }
      }
      return needsRender;
    };

    const resetLastEnteredMouseEnter = (): boolean => {
      let needsRender = false;
      if (lastEnteredMouseEnter) {
        lastEnteredMouseEnter.fire('mouseout');
        if (lastDragged) {
          lastEnteredMouseEnter.fire('dropout');
        }
        needsRender = true;
      }
      lastEnteredMouseEnter = undefined;
      return needsRender;
    };

    const throttleMouseMove = throttle<MouseCanvasEvent>(
      (event) => {
        // basics
        if (disabled) {
          return;
        }
        mouseX = event.offsetX;
        mouseY = event.offsetY;

        let needsRender = false;
        // mouseenter
        const selectedRenderableMouseEnter = this.getElementOfEvent('mouseenter', event);

        if (selectedRenderableMouseEnter) {
          if (selectedRenderableMouseEnter !== lastEnteredMouseEnter) {
            if (lastEnteredMouseEnter) {
              lastEnteredMouseEnter.fire('mouseout');
              if (lastDragged) {
                lastEnteredMouseEnter.fire('dropout');
              }
            }
            lastEnteredMouseEnter = selectedRenderableMouseEnter;
            lastEnteredMouseEnter.fire('mouseenter');
            if (lastDragged) {
              lastEnteredMouseEnter.fire('dropenter');
            }
            needsRender = true;
          }
        } else {
          needsRender = resetLastEnteredMouseEnter();
        }

        // all drag
        needsRender ||= dragChangeCallback(event);

        const selectedRenderableClick = this.getElementOfEvent('click', event);
        if (selectedRenderableClick) {
          if (selectedRenderableClick !== lastEnteredDrag) {
            lastEnteredClick = selectedRenderableClick;
            this.canvasElement.classList.add('clickable');
          }
        } else {
          if (lastEnteredClick) {
            this.canvasElement.classList.remove('clickable');
          }
          lastEnteredClick = undefined;
        }

        if (needsRender) {
          this.renderFastWithAnimationFrame();
        }
      },
      10,
      { trailing: false }
    );

    const stopDrag = (event: MouseCanvasEvent) => {
      if (disabled) {
        return;
      }
      let needsRender = resetLastEnteredMouseEnter();
      if (mouseDown) {
        mouseDown = false;
        dragChangeCallback(event);
        needsRender = true;
      }
      if (needsRender) {
        this.renderFastWithAnimationFrame();
      }
    };

    this.canvasElement.addEventListener('mousemove', throttleMouseMove);
    this.canvasElement.addEventListener('mousedown', (event) => {
      if (disabled) {
        return;
      }
      mouseDown = true;
      dragChangeCallback(event);
      this.renderFastWithAnimationFrame();
    });
    this.canvasElement.addEventListener('mouseup', (event) => {
      if (lastDragged && lastEnteredMouseEnter && lastEnteredMouseEnter.hasEvent('drop')) {
        lastEnteredMouseEnter.fire('drop');
      }
      stopDrag(event);
    });
    this.canvasElement.addEventListener('mouseout', stopDrag);
    // this.canvasElement.addEventListener("wheel", (e) => {});

    if (keyboard?.cancelInteractionsWithEsc) {
      // TODO cleanup on destroy
      window.addEventListener(
        'keydown',
        (event) => {
          if (event.defaultPrevented) {
            return; // Do nothing if the event was already processed
          }
          switch (event.key) {
            /*
            case "Down": // IE/Edge specific value
            case "ArrowDown":
              // Do something for "down arrow" key press.
              break;
            case "Up": // IE/Edge specific value
            case "ArrowUp":
              // Do something for "up arrow" key press.
              break;
            case "Left": // IE/Edge specific value
            case "ArrowLeft":
              // Do something for "left arrow" key press.
              break;
            case "Right": // IE/Edge specific value
            case "ArrowRight":
              // Do something for "right arrow" key press.
              break;
            case "Enter":
              // Do something for "enter" or "return" key press.
              break;
            */
            case 'Esc': // IE/Edge specific value
            case 'Escape':
              stopDrag({ offsetX: mouseX, offsetY: mouseY });
              break;
            default:
              return; // Quit when this doesn't handle the key event.
          }
          // Cancel the default action to avoid it being handled twice
          event.preventDefault();
        },
        true
      );
    }
  }

  private setCanvasSize(dimensions: DrawableDimensions) {
    this.elementDimensions = dimensions;
    const { width, height } = dimensions;
    this.canvasElement.style.width = width + 'px';
    this.canvasElement.style.height = height + 'px';

    this.canvasElement.width = width * this.ratio;
    this.canvasElement.height = height * this.ratio;
    this.elementPixels = {
      width: width * this.ratio,
      height: height * this.ratio,
    };
    this.setMainGroupBounds(dimensions);
  }

  private setMainGroupBounds(xDimensions: DrawableDimensions) {
    if (!this.hasCanvasDrag) {
      return;
    }
    const dimensions = Drawable.maxDimensions(this.elementDimensions, xDimensions);

    const smallPart = dimensions.width * 0.2;
    const x = dimensions.width - smallPart;
    const y = dimensions.height - smallPart;
    this.mainGroup.setBounds({
      min: {
        x: x,
        y: y,
      },
      max: {
        x: -x,
        y: -y,
      },
    });
  }

  setScale(scale: number): void {
    this.scaleRaw = scale ?? 1;
    this.scale = this.scaleRaw * this.ratio;
  }

  private getElementOfEvent(eventName: EventName, event: MouseCanvasEvent): Renderable | undefined {
    return this.mainGroup.findPointInDimensions(eventName, this.canvasContext, event.offsetX * this.ratio, event.offsetY * this.ratio);
  }

  set(...renderables: Drawable[]) {
    this.mainGroup.set(renderables);
    this.setMainGroupBounds(this.mainGroup.getDimensions());
  }

  render() {
    this.canvasContext.setTransform(1, 0, 0, 1, 0, 0);
    this.clear();
    this.canvasContext.scale(this.scale, this.scale);
    this.mainGroup.render(this.canvasContext, this.elementDimensions, this.position);
  }

  renderFastWithAnimationFrame() {
    requestAnimationFrame(this.renderCallback);
  }

  private clear() {
    const { width, height } = this.elementPixels;
    this.canvasContext.clearRect(0, 0, width, height);
  }

  getContext() {
    return this.canvasContext;
  }
}
