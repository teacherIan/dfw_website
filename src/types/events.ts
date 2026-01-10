export interface NavigationEvent extends Event {
  detail: {
    page: string;
  };
}

export interface FontChangeEvent extends Event {
  detail: {
    fontFamily: string;
  };
}

declare global {
  interface WindowEventMap {
    navigate: NavigationEvent;
    fontChange: FontChangeEvent;
  }
}
