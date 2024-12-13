import type { WebSocketMessageMap, WebSocketEventHandler } from '../../types/websocket';

type WebSocketListenerMap = {
  message: ((event: MessageEvent<string>) => void)[];
  open: ((event: Event) => void)[];
  close: ((event: CloseEvent) => void)[];
  error: ((event: Event) => void)[];
};

export class MockWebSocket implements Partial<WebSocket> {
  // Static properties
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  // Instance properties
  readonly CONNECTING = MockWebSocket.CONNECTING;
  readonly OPEN = MockWebSocket.OPEN;
  readonly CLOSING = MockWebSocket.CLOSING;
  readonly CLOSED = MockWebSocket.CLOSED;
  
  private listeners: Partial<WebSocketListenerMap> = {};
  public readyState: number = this.CONNECTING;
  public binaryType: BinaryType = 'blob';
  public bufferedAmount: number = 0;
  public extensions: string = '';
  public protocol: string = '';
  public url: string = '';
  
  // Event handlers
  public onclose: ((this: WebSocket, ev: CloseEvent) => any) | null = null;
  public onerror: ((this: WebSocket, ev: Event) => any) | null = null;
  public onmessage: ((this: WebSocket, ev: MessageEvent<any>) => any) | null = null;
  public onopen: ((this: WebSocket, ev: Event) => any) | null = null;

  constructor(url: string, protocols?: string | string[]) {
    this.url = url;
    if (protocols) {
      this.protocol = Array.isArray(protocols) ? protocols[0] : protocols;
    }
    setTimeout(() => {
      this.readyState = this.OPEN;
      this.dispatchEvent(new Event('open'));
    }, 0);
  }

  addEventListener<K extends keyof WebSocketMessageMap>(
    type: K,
    listener: WebSocketEventHandler<K>
  ): void {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    const listeners = this.listeners[type] as WebSocketListenerMap[K];
    listeners.push(listener as any);
  }

  removeEventListener<K extends keyof WebSocketMessageMap>(
    type: K,
    listener: WebSocketEventHandler<K>
  ): void {
    const listeners = this.listeners[type] as WebSocketListenerMap[K] | undefined;
    if (listeners) {
      this.listeners[type] = listeners.filter(l => l !== listener) as any;
    }
  }

  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
    if (this.readyState !== this.OPEN) {
      throw new Error('WebSocket is not open');
    }
    
    const messageData = typeof data === 'string' ? data :
      data instanceof Blob ? '(blob)' :
      ArrayBuffer.isView(data) ? '(binary)' :
      JSON.stringify(data);

    setTimeout(() => {
      this.dispatchEvent(new MessageEvent('message', { data: messageData }));
    }, 50);
  }

  close(code?: number, reason?: string): void {
    if (this.readyState === this.CLOSED) return;
    this.readyState = this.CLOSING;
    setTimeout(() => {
      this.readyState = this.CLOSED;
      this.dispatchEvent(new CloseEvent('close', { code, reason, wasClean: true }));
    }, 0);
  }

  dispatchEvent(event: Event): boolean {
    const type = event.type as keyof WebSocketMessageMap;
    const listeners = this.listeners[type] as WebSocketListenerMap[typeof type] | undefined;
    if (!listeners?.length) return false;

    try {
      listeners.forEach(listener => {
        if (event instanceof MessageEvent && type === 'message') {
          (listener as (event: MessageEvent<string>) => void)(event);
        } else if (event instanceof CloseEvent && type === 'close') {
          (listener as (event: CloseEvent) => void)(event);
        } else {
          (listener as (event: Event) => void)(event);
        }
      });

      // Call the corresponding event handler
      switch (type) {
        case 'open':
          this.onopen?.call(this, event);
          break;
        case 'message':
          if (event instanceof MessageEvent) {
            this.onmessage?.call(this, event);
          }
          break;
        case 'close':
          if (event instanceof CloseEvent) {
            this.onclose?.call(this, event);
          }
          break;
        case 'error':
          this.onerror?.call(this, event);
          break;
      }
      return true;
    } catch (error) {
      console.error('Error dispatching WebSocket event:', error);
      return false;
    }
  }

  // Helper method for tests
  sendEvent<K extends keyof WebSocketMessageMap>(
    type: K,
    event: WebSocketMessageMap[K]
  ): void {
    this.dispatchEvent(event);
  }
}

export class FailingWebSocket extends MockWebSocket {
  constructor(url: string, protocols?: string | string[]) {
    super(url, protocols);
    setTimeout(() => {
      this.dispatchEvent(new Event('error'));
      this.close(1006, 'Connection failed');
    }, 0);
  }
}

export const createWebSocketMessage = <T extends object>(data: T): MessageEvent<string> => {
  return new MessageEvent('message', {
    data: JSON.stringify(data),
    origin: 'ws://localhost',
    lastEventId: '',
    source: null,
    ports: []
  });
}; 