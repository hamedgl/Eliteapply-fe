import type { AuthChannelMessage } from "./auth-types";

const CHANNEL_NAME = "eliteapply-auth";

type ChannelHandler = (msg: AuthChannelMessage) => void;

class AuthChannel {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<ChannelHandler> = new Set();
  public tabId: string = Math.random().toString(36).substring(2, 9);

  constructor() {
    this.ensureChannel();
  }

  private ensureChannel(): BroadcastChannel | null {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      if (!this.channel) {
        try {
          this.channel = new BroadcastChannel(CHANNEL_NAME);
          this.channel.onmessage = (event: MessageEvent<AuthChannelMessage>) => {
            this.listeners.forEach((fn) => fn(event.data));
          };
        } catch {
          this.channel = null;
        }
      }
    }
    return this.channel;
  }

  public postMessage(msg: AuthChannelMessage): void {
    const ch = this.ensureChannel();
    if (ch) {
      try {
        ch.postMessage(msg);
      } catch {}
    }
  }

  public subscribe(handler: ChannelHandler): () => void {
    this.listeners.add(handler);
    this.ensureChannel();
    return () => {
      this.listeners.delete(handler);
    };
  }

  public reset(): void {
    if (this.channel) {
      try {
        this.channel.close();
      } catch {}
      this.channel = null;
    }
    this.ensureChannel();
  }
}

export const authChannel = new AuthChannel();
