// WebSocket message types
export interface WebSocketMessageMap {
  message: MessageEvent<string>;
  open: Event;
  close: CloseEvent;
  error: Event;
}

// WebSocket listener types
export type WebSocketListeners = {
  [K in keyof WebSocketMessageMap]: Array<(event: WebSocketMessageMap[K]) => void>;
};

// WebSocket message data types
export interface WebSocketMessageData<T = unknown> {
  type: string;
  data: T;
  timestamp: string;
}

// WebSocket event handler type
export type WebSocketEventHandler<K extends keyof WebSocketMessageMap> = 
  (event: WebSocketMessageMap[K]) => void;

// WebSocket connection status
export type WebSocketConnectionStatus = 
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'unavailable'; 