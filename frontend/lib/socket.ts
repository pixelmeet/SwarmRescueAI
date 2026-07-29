export class SocketClient {
  private ws: WebSocket | null = null;

  connect(url: string, onMessage: (data: any) => void) {
    if (typeof window === "undefined") return;
    this.ws = new WebSocket(url);

    this.ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        onMessage(parsed);
      } catch (err) {
        onMessage(event.data);
      }
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
