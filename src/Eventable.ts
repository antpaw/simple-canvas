export type EventCallback = (options?: any) => any;
export type EventName =
  | "click"
  | "mouseout"
  | "mouseenter"
  | "drag"
  | "dragstart"
  | "dragend"
  | "drop"
  | "dropout"
  | "dropenter";

export type EventableOptions = {
  events?: Set<EventName>;
};

export default class Eventable {
  private eventListeners: Map<EventName, EventCallback[]> = new Map();
  private hasAnyInteractable: boolean;
  private consumeEvents: Set<EventName>;
  private hasMouseOut: boolean;
  private hasMouseEnter: boolean;

  constructor(options: EventableOptions) {
    this.consumeEvents = options.events || new Set();
    this.hasAnyInteractable = this.consumeEvents.size > 0;
    this.hasMouseEnter = this.consumeEvents.has("mouseenter");
    this.hasMouseOut = this.consumeEvents.has("mouseout");
  }

  stashMouseEnterAndOut(add: boolean): void {
    if (add) {
      if (this.hasMouseEnter) {
        this.consumeEvents.add("mouseenter");
      }
      if (this.hasMouseOut) {
        this.consumeEvents.add("mouseout");
      }
    } else {
      if (this.hasMouseEnter) {
        this.consumeEvents.delete("mouseenter");
      }
      if (this.hasMouseOut) {
        this.consumeEvents.delete("mouseout");
      }
    }
  }

  hasInteractableOrChildren(): boolean {
    return this.hasAnyInteractable;
  }

  isInteractable(): boolean {
    return this.hasAnyInteractable;
  }

  hasEvent(eventName: EventName): boolean {
    return this.consumeEvents.has(eventName);
  }

  on(eventName: EventName, handler: EventCallback): VoidFunction {
    const callbacks = this.eventListeners.get(eventName);
    if (callbacks) {
      callbacks.push(handler);
    } else {
      this.eventListeners.set(eventName, [handler]);
    }
    return () => this.off(eventName, handler);
  }

  off(eventName: EventName, handler?: EventCallback): void {
    if (!this.eventListeners.get(eventName)) {
      return;
    }

    if (handler) {
      const callbacks = this.eventListeners.get(eventName);
      if (callbacks) {
        const index = callbacks.indexOf(handler);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    } else {
      this.eventListeners.delete(eventName);
    }
  }

  fire(eventName: EventName, options?: any): void {
    const listenersForEvent = this.eventListeners.get(eventName);
    if (listenersForEvent) {
      for (let i = 0; i < listenersForEvent.length; i++) {
        listenersForEvent[i].call(this, options);
      }
    }
  }
}
