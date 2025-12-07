// ONLY for immutable data
export class AppState {
  public readonly foodsIndex: any[];
  public readonly protocolsIndex: any[];
  public readonly warningsPageURL: string;

  constructor(data: any, warningsUrl: string) {
    this.foodsIndex = data.fuzzySortPreparedFoods;
    this.protocolsIndex = data.fuzzySortPreparedProtocols;
    this.warningsPageURL = warningsUrl;
  }
}
