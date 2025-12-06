import type { Protocol } from "../types";

type Listener = (protocol: Protocol | null, note: string) => void;

export class ProtocolState {
  private protocol: Protocol | null = null;
  private customNote: string = "";
  private listeners: Listener[] = [];

  // Getters
  public getProtocol(): Protocol | null { return this.protocol; }
  public getCustomNote(): string { return this.customNote; }

  // Setters
  public setProtocol(p: Protocol | null) {
    this.protocol = p;
    this.notify();
  }

  // For custom
  public setCustomNote(note: string, options?: { skipRender: boolean }) {
    this.customNote = note;
    if (!options?.skipRender) this.notify();
  }

  // Observer Pattern
  public subscribe(listener: Listener) {
    this.listeners.push(listener);
    // Immediately notify new subscriber of current state
    listener(this.protocol, this.customNote);
  }

  private notify() {
    this.listeners.forEach(fn => fn(this.protocol, this.customNote));
  }
}
