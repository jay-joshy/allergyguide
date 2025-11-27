import cnfFoods from '../tool_assets/typed_foods_rough.json';
import customFoods from '../tool_assets/custom_foods.json';
import protocols from '../tool_assets/oit_protocols.json';

interface FoodItem {
  "Food": string;
  "Mean protein in grams": number;
  "Serving size": number;
  "Type": string;
}

// COMPILE TIME CHECK
// If the JSON files don't match FoodItem[], build fails
cnfFoods satisfies readonly FoodItem[];
customFoods satisfies readonly FoodItem[];

interface ProtocolData {
  name: string;
  dosing_strategy: string;
  food_a: {
    type: string;
    name: string;
    gramsInServing: string;
    servingSize: string;
  };
  food_a_strategy: string;
  di_threshold: string;
  food_b?: {
    type: string;
    name: string;
    gramsInServing: string;
    servingSize: string;
  };
  food_b_threshold?: string;
  table_di: any[]; // steps for protocol using dilution initial strategy
  table_dn: any[]; // steps for protocol using dilution none strategy
  table_da: any[]; // steps for protocol using dilution all strategy
  custom_note?: string;
}

// COMPILE TIME CHECK
protocols satisfies readonly ProtocolData[];

