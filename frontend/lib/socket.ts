export type EventCallback = (data: any) => void;
export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "fallback_polling";
export type StatusCallback = (status: ConnectionStatus) => void;

export class SocketClient {
  private ws: WebSocket | null = null;
  private subscribers: Map<string, Set<EventCallback>> = new Map();
  private statusSubscribers: Set<StatusCallback> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private initialReconnectDelay = 1000;
  private maxReconnectDelay = 16000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private url: string = "";
  private isExplicitDisconnect = false;
  private status: ConnectionStatus = "disconnected";

  private updateStatus(newStatus: ConnectionStatus) {
    this.status = newStatus;
    this.statusSubscribers.forEach((cb) => cb(newStatus));
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public onStatusChange(callback: StatusCallback): () => void {
    this.statusSubscribers.add(callback);
    callback(this.status);
    return () => {
      this.statusSubscribers.delete(callback);
    };
  }

  public connect(url?: string) {
    if (typeof window === "undefined") return;
    if (url) this.url = url;
    if (!this.url) {
      const httpUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const wsProtocol = httpUrl.startsWith("https") ? "wss" : "ws";
      const host = httpUrl.replace(/^https?:\/\//, "");
      this.url = `${wsProtocol}://${host}/ws/dashboard`;
    }

    this.isExplicitDisconnect = false;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.updateStatus("connecting");

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log("[WebSocket] Connected to", this.url);
        this.reconnectAttempts = 0;
        this.updateStatus("connected");
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const { event: eventName, data } = payload;
          if (eventName && this.subscribers.has(eventName)) {
            this.subscribers.get(eventName)?.forEach((cb) => cb(data));
          }
        } catch (err) {
          console.error("[WebSocket] Error parsing message:", err);
        }
      };

      this.ws.onerror = (error) => {
        console.warn("[WebSocket] Socket error:", error);
      };

      this.ws.onclose = () => {
        console.warn("[WebSocket] Connection closed");
        this.ws = null;
        if (!this.isExplicitDisconnect) {
          this.handleReconnection();
        } else {
          this.updateStatus("disconnected");
        }
      };
    } catch (err) {
      console.error("[WebSocket] Connection attempt failed:", err);
      this.handleReconnection();
    }
  }

  private handleReconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(
        this.initialReconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
        this.maxReconnectDelay
      );
      console.log(`[WebSocket] Reconnecting in ${delay}ms (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      this.updateStatus("connecting");
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      this.reconnectTimer = setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.warn("[WebSocket] Max reconnect attempts reached. Switching to fallback polling.");
      this.updateStatus("fallback_polling");
    }
  }

  public subscribe(eventName: string, callback: EventCallback): () => void {
    if (!this.subscribers.has(eventName)) {
      this.subscribers.set(eventName, new Set());
    }
    this.subscribers.get(eventName)!.add(callback);

    return () => {
      const callbacks = this.subscribers.get(eventName);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(eventName);
        }
      }
    };
  }

  public disconnect() {
    this.isExplicitDisconnect = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.updateStatus("disconnected");
  }
}

export const socketClient = new SocketClient();

