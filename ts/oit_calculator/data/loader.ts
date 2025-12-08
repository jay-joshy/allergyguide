import fuzzysort from "fuzzysort";
import type { FoodData, ProtocolData } from "../types";

// Helper type: Takes any object T and adds the 'prepared' property from Fuzzysort
type PreparedItem<T> = T & { prepared: Fuzzysort.Prepared };

/**
 * Return type structure for the loaded application data.
 */
export interface LoadedData {
  foodsDatabase: FoodData[];
  protocolsDatabase: ProtocolData[];
  fuzzySortPreparedFoods: PreparedItem<FoodData>[];
  fuzzySortPreparedProtocols: PreparedItem<ProtocolData>[];
}

/**
 * Load foods and protocol template databases and prepare fuzzy search indices.
 *
 * Fetches:
 * - /tool_assets/typed_foods_rough.json TODO! Change to not rough...
 * - /tool_assets/custom_foods.json
 * - /tool_assets/oit_protocols.json
 *
 * On failure, logs the error and alerts the user that some features may not work.
 *
 * @returns Promise that resolves with loaded data
 * @throws Error if fetching/parsing fails
 */
export async function loadDatabases(): Promise<LoadedData> {
  try {
    // Load databases
    const [cnfFoodsResponse, customFoodsResponse, protocolsResponse] = await Promise.all([
      fetch("/tool_assets/typed_foods_rough.json"),
      fetch("/tool_assets/custom_foods.json"),
      fetch("/tool_assets/oit_protocols.json")
    ]);

    // HTTP errors
    if (!cnfFoodsResponse.ok) throw new Error(`Failed to load CNF foods: ${cnfFoodsResponse.statusText}`);
    if (!customFoodsResponse.ok) throw new Error(`Failed to load custom foods: ${customFoodsResponse.statusText}`);
    if (!protocolsResponse.ok) throw new Error(`Failed to load protocols: ${protocolsResponse.statusText}`);

    // parse json; TODO! validate the JSON structure
    const cnfFoodsDatabase: FoodData[] = await cnfFoodsResponse.json();
    const customFoodsDatabase: FoodData[] = await customFoodsResponse.json();
    const protocolsDatabase: ProtocolData[] = await protocolsResponse.json();

    // merge custom and cnf
    const foodsDatabase = [...cnfFoodsDatabase, ...customFoodsDatabase];

    // Prepare for fuzzy search
    // make objects containing the raw data + the prepared search index
    const fuzzySortPreparedFoods = foodsDatabase.map((f: FoodData) => ({
      ...f,
      prepared: fuzzysort.prepare(f.Food),
    }));
    const fuzzySortPreparedProtocols = protocolsDatabase.map((p: ProtocolData) => ({
      ...p,
      prepared: fuzzysort.prepare(p.name),
    }));

    console.log(
      `Loaded ${foodsDatabase.length} foods and ${protocolsDatabase.length} protocols`,
    );

    return {
      foodsDatabase,
      protocolsDatabase,
      fuzzySortPreparedFoods,
      fuzzySortPreparedProtocols
    };
  } catch (error) {
    console.error("Error loading databases:", error);
    throw error;
  }
}
