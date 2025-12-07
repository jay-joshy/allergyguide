import type { Protocol } from "../types";

type Listener = (protocol: Protocol | null, note: string) => void;

/**
 * State manager for OIT Calculator
 * Holds central state (Protocol and Custom Notes), manages Undo/Redo history stack, handles event subscriptions for UI updates
 */
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

  /**
   * @returns current Protocol object or null if not yet initialized
   */
  public getProtocol(): Protocol | null { return this.protocol; }

  /**
   * @returns custom note string
   */
  public getCustomNote(): string { return this.customNote; }

  /**
   * @returns true if there is history available to undo.
   */
  public getCanUndo(): boolean { return this.history.length > 0; }

  /**
   * @returns `true` if there are future states available to redo
   */
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

  /**
   * Updates the custom note content
   * Note custom note is tracked separately from the Protocol object; excluded from undo/redo history 
   *
   * @param note - new text string for the note.
   * @param options - Configuration options
   * @param options.skipRender - If `true`, listeners will NOT be notified of this change 
   */
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
