import type { Protocol } from "../types";

type Listener = (protocol: Protocol | null, note: string) => void;

export class ProtocolState {
  // FOR UNDO/REDO
  private MAX_HISTORY = 100;
  // Present
  private protocol: Protocol | null = null;
  // Past
  private history: Protocol[] = [];
  // Future (for Redo)
  private future: Protocol[] = [];

  private customNote: string = "";
  private listeners: Listener[] = [];

  public getProtocol(): Protocol | null { return this.protocol; }
  public getCustomNote(): string { return this.customNote; }

  // for UI buttons expose ability to redo/undo
  public getCanUndo(): boolean { return this.history.length > 0; }
  public getCanRedo(): boolean { return this.future.length > 0; }

  /**
   * Update protocol
   * @param p New protocol
   * @param options.addToHistory Default true. make false for ephemeral updates (ie typing in customNote)
   */
  public setProtocol(p: Protocol | null, options: { addToHistory?: boolean } = { addToHistory: true }) {
    if (this.protocol && options.addToHistory) {
      // Push current state to history before overwriting
      this.history.push(this.protocol);
      if (this.history.length > this.MAX_HISTORY) this.history.shift();

      // Clear future on new action
      this.future = [];
    }

    this.protocol = p;
    this.notify();
  }

  public undo() {
    if (this.history.length === 0) return;

    const previous = this.history.pop();
    if (previous && this.protocol) {
      this.future.push(this.protocol); // Move current to future
      this.protocol = previous;        // Set current to past
      this.notify();
    }
  }

  public redo() {
    if (this.future.length === 0) return;

    const next = this.future.pop();
    if (next && this.protocol) {
      this.history.push(this.protocol); // Move current to history
      this.protocol = next;             // Set current to future
      this.notify();
    }
  }

  // Custom Note NOT part of the memento pattern
  public setCustomNote(note: string, options?: { skipRender: boolean }) {
    this.customNote = note;
    if (!options?.skipRender) this.notify();
  }

  public subscribe(listener: Listener) {
    this.listeners.push(listener);
    listener(this.protocol, this.customNote);
  }

  private notify() {
    this.listeners.forEach(fn => fn(this.protocol, this.customNote));
  }
}
