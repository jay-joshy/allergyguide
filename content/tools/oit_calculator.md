+++
title = "OIT Calculator"
description = "Generate EMR and patient ready protocols for oral immunotherapy to any food."
date = 2025-11-08
draft = false

[taxonomies]
tags = ["tools"]
[extra]
keywords = "immunotherapy"
toc = true
authors = ["Joshua Yu"]
+++

</br>
</br>

{{ oit_calculator() }}

# OIT CALCULATOR README:

## Background and rationale:

Oral immunotherapy (OIT) is a novel approach to treating food allergies that is most effective / safe in younger populations. It involves a structured gradient introduction of a food through many 'steps', each corresponding to a particular protein count: the last step is the maintenance step, usually 300mg of food protein.

The usual 'standard' progression of protein doses / steps is as follows, with 2-4 weeks between each step:

| Step | Protein (mg) |
| ---- | ------------ |
| 1    | 1            |
| 2    | 2.5          |
| 3    | 5            |
| 4    | 10           |
| 5    | 20           |
| 6    | 40           |
| 7    | 80           |
| 8    | 80           |
| 9    | 120          |
| 10   | 160          |
| 11   | 240          |
| 12   | 300          |

That said, the goals of OIT can be achieved with many different protocols: as such, there is wide variability in how OIT is implemented across Canada and between individual physicians. That variability may manifest in different forms of food (powders, whole, liquid), if dilution is required for initial steps, how many steps are taken in total, the protein content for each step, and so on: there are many permutations. For example, for a very high-risk patient there may be a 'slow' dose progression starting from 0.5mg to 300mg in 20 steps instead of 12; there may also be a 'rush/rapid' strategy with less steps and larger dose differences between steps. While there is little evidence that specific dosing schedules are superior to others, the ability to create, edit, and adapt protocols for a patient’s specific situation is crucial.

However, there is no easy, accessible resource to generate EMR and patient friendly protocols for a variety of foods that takes into account these basic variations in application, and the current practices rely on time-intensive and manual approaches to make protocols with more room for human error.

## Premises:

### Operational

1. OIT can be offered at home or with in-clinic updosing. Either way, patients and healthcare workers require a **clearly laid out plan**.
2. Foods for OIT can be liquids or solids, and depending on the starting protein dose, dilutions are likely required. With solids diluted into liquids, we assume the solid contributes negligibly to the final volume. For example: if 1 ml of a solution of 0.2g of peanut powder in 40ml of liquid is given, we assume that only 0.2g * 1/40 = 0.005g is actually ingested.
3. There are four 'phenotypes' of OIT:

- Food A with initial dilutions before the direct food is given. The transition occurs once the weight of undiluted food is easily measurable. Ie. Steps 1-3 are peanut powder diluted in water, then steps 4 - maintenance are powder only.
- Food A with dilutions all the way to maintenance dose. More useful if parents want something they can measure once and then more easily give for a few days, instead of weighing something every day.
- Food A without any dilutions. Usually not feasible especially in the first low dose steps (weight would be very hard to measure); can be done if compounded by pharmacy but not widely available.
- Food A -> Food B at some point. The formulation of food A could be either with dilutions only, mixed dilutions, or no dilutions. Ie. Steps 1-5 are cod powder diluted in water, then steps 6 - maintenance are cooked cod once weight of food is easily measurable. Another example is steps 1-2 are code powder diluted in water, 3-5 are powder only, and 6 onwards is cooked cod.

Examples of the phenotypes in table form:

#### Food A with initial dilutions

Liquid X, 8g protein per 250ml

| Step | Protein (mg) | Method   | Daily amount | Amount for mixture | Water for mixture |
| ---- | ------------ | -------- | ------------ | ------------------ | ----------------- |
| 1    | 1            | Dilution | 1 ml         | 1 ml               | 31 ml             |
| 2    | 2.5          | Dilution | 1 ml         | 1 ml               | 11.8 ml           |
| 3    | 5            | Dilution | 1 ml         | 1 ml               | 5.4 ml            |
| 4    | 10           | Direct   | 0.3 ml       | n/a                | n/a               |
| 5    | 20           | Direct   | 0.6 ml       | n/a                | n/a               |
| 6    | 40           | Direct   | 1.3 ml       | n/a                | n/a               |
| 7    | 80           | Direct   | 2.5 ml       | n/a                | n/a               |
| 8    | 120          | Direct   | 3.8 ml       | n/a                | n/a               |
| 9    | 160          | Direct   | 5 ml         | n/a                | n/a               |
| 10   | 240          | Direct   | 7.5 ml       | n/a                | n/a               |
| 11   | 300          | Direct   | 9.4 ml       | n/a                | n/a               |

Solid X, 7g protein per 30g

| Step | Protein (mg) | Method   | Daily amount | Amount for mixture | Water for mixture |
| ---- | ------------ | -------- | ------------ | ------------------ | ----------------- |
| 1    | 1            | Dilution | 1 ml         | 0.2 g              | 46.7 ml           |
| 2    | 2.5          | Dilution | 1 ml         | 0.2 g              | 18.7 ml           |
| 3    | 5            | Dilution | 1 ml         | 0.2 g              | 9.3 ml            |
| 4    | 10           | Dilution | 1 ml         | 0.2 g              | 4.7 ml            |
| 5    | 20           | Dilution | 1 ml         | 0.5 g              | 5.8 ml            |
| 6    | 40           | Dilution | 2 ml         | 0.5 g              | 5.8 ml            |
| 7    | 80           | Direct   | 0.3 g        | n/a                | n/a               |
| 8    | 120          | Direct   | 0.5 g        | n/a                | n/a               |
| 9    | 160          | Direct   | 0.7 g        | n/a                | n/a               |
| 10   | 240          | Direct   | 1 g          | n/a                | n/a               |
| 11   | 300          | Direct   | 1.3 g        | n/a                | n/a               |

#### Food A with dilutions until maintenance

Y powder, 1g protein per 15g

| Step | Protein (mg) | Method   | Daily amount | Amount for mixture | Water for mixture |
| ---- | ------------ | -------- | ------------ | ------------------ | ----------------- |
| 1    | 1            | Dilution | 0.5 ml       | 0.2 g              | 6.7 ml            |
| 2    | 2.5          | Dilution | 0.5 ml       | 0.2 g              | 2.7 ml            |
| 3    | 5            | Dilution | 1 ml         | 0.2 g              | 2.7 ml            |
| 4    | 10           | Dilution | 1 ml         | 0.2 g              | 1.3 ml            |
| 5    | 20           | Dilution | 1 ml         | 0.5 g              | 1.7 ml            |
| 6    | 40           | Dilution | 2 ml         | 0.5 g              | 1.7 ml            |
| 7    | 80           | Dilution | 4 ml         | 0.5 g              | 1.7 ml            |
| 8    | 120          | Dilution | 4 ml         | 2.0 g              | 4.4 ml            |
| 9    | 160          | Dilution | 4 ml         | 2.5 g              | 4.2 ml            |
| 10   | 240          | Dilution | 4 ml         | 4.0 g              | 4.4 ml            |
| 11   | 300          | Dilution | 4 ml         | 5.0 g              | 4.4 ml            |

#### Food A without any dilutions

X powder, 21g protein per 100g

| Step | Protein (mg) | Method | Daily amount | Amount for mixture | Water for mixture (mL) |
| ---- | ------------ | ------ | ------------ | ------------------ | ---------------------- |
| 1    | 1            | Direct | 0.005 g      | n/a                | n/a                    |
| 2    | 2.5          | Direct | 0.012 g      | n/a                | n/a                    |
| 3    | 5            | Direct | 0.024 g      | n/a                | n/a                    |
| 4    | 10           | Direct | 0.048 g      | n/a                | n/a                    |
| 5    | 20           | Direct | 0.095 g      | n/a                | n/a                    |
| 6    | 40           | Direct | 0.19 g       | n/a                | n/a                    |
| 7    | 80           | Direct | 0.381 g      | n/a                | n/a                    |
| 8    | 120          | Direct | 0.571 g      | n/a                | n/a                    |
| 9    | 160          | Direct | 0.762 g      | n/a                | n/a                    |
| 10   | 240          | Direct | 1.143 g      | n/a                | n/a                    |
| 11   | 300          | Direct | 1.429 g      | n/a                | n/a                    |

OR if the food is a liquid:

X milk, 1g protein per 250 ml

| Step | Protein (mg) | Method | Daily amount | Amount for mixture | Water for mixture (mL) |
| ---- | ------------ | ------ | ------------ | ------------------ | ---------------------- |
| 1    | 1            | Direct | 0.3 ml       | n/a                | n/a                    |
| 2    | 2.5          | Direct | 0.6 ml       | n/a                | n/a                    |
| 3    | 5            | Direct | 1.3 ml       | n/a                | n/a                    |
| 4    | 10           | Direct | 2.5 ml       | n/a                | n/a                    |
| 5    | 20           | Direct | 5.0 ml       | n/a                | n/a                    |
| 6    | 40           | Direct | 10.0 ml      | n/a                | n/a                    |
| 7    | 80           | Direct | 20.0 ml      | n/a                | n/a                    |
| 8    | 120          | Direct | 30.0 ml      | n/a                | n/a                    |
| 9    | 160          | Direct | 40.0 ml      | n/a                | n/a                    |
| 10   | 240          | Direct | 60.0 ml      | n/a                | n/a                    |
| 11   | 300          | Direct | 75.0 ml      | n/a                | n/a                    |

#### Food A -> Food B

With this approach, the same dose is repeated at the transition point. For example, step 7 and 8 contain the same amount of protein:

Powder X: 20g of protein per 30g

| Step | Protein (mg) | Method   | Daily amount | Amount for mixture | Water for mixture |
| ---- | ------------ | -------- | ------------ | ------------------ | ----------------- |
| 1    | 1            | Dilution | 1 ml         | 0.2 g              | 133 ml            |
| 2    | 2.5          | Dilution | 1 ml         | 0.2 g              | 53 ml             |
| 3    | 5            | Dilution | 2 ml         | 0.2 g              | 53 ml             |
| 4    | 10           | Dilution | 1 ml         | 0.4 g              | 27 ml             |
| 5    | 20           | Dilution | 1 ml         | 0.5 g              | 17 ml             |
| 6    | 40           | Dilution | 2 ml         | 0.5 g              | 17 ml             |
| 7    | 80           | Dilution | 4 ml         | 0.5 g              | 17 ml             |

after step 7 is complete, transitions to:

Food X: 10g of protein per 30g

| Step | Protein (mg) | Method | Daily amount | Amount for mixture | Water for mixture |
| ---- | ------------ | ------ | ------------ | ------------------ | ----------------- |
| 8    | 80           | Direct | 0.24 g       | n/a                | n/a               |
| 9    | 120          | Direct | 0.36 g       | n/a                | n/a               |
| 10   | 160          | Direct | 0.48 g       | n/a                | n/a               |
| 11   | 240          | Direct | 0.72 g       | n/a                | n/a               |
| 12   | 300          | Direct | 0.9 g        | n/a                | n/a               |

4. Different phenotypes of how OIT is offered suit different patients and families: flexibility to switch easily is an advantage

### Operational definitions

**OIT Protocol**
Full set of doses and instructions for given food. Recall that:

- Food A may be given either 1) diluted for all steps, 2) not diluted (neat) for all steps, or 3) diluted initially for the first few steps until the undiluted form is easily measurable with a kitchen scale
- Food A may OPTIONALLY transition to another form of the food, called Food B. For example, Salmon powder (Food A) diluted/undiluted/both for 7 steps before cooked salmon (Food B) is given for step 8 until maintenance

Therefore, a complete OIT protocol must contain the following information which can be expressed in pseudocode as such:

```ts
enum Method {
  Dilute = "DILUTE",
  Direct = "DIRECT",
}

enum Type {
  Liquid = "LIQUID",
  Solid = "SOLID",
}

// Standard: 1, 2.5, 5, 10, 20, 40, 80, 120, 160, 240, 300
// Slow: 0.5, 1, 1.5, 2.5, 5, 10, 20, 30, 40, 60, 80, 100, 120, 140, 160, 190, 220, 260, 300
// Rapid: 1, 2.5, 5, 10, 20, 40, 80, 160, 300
enum DosingStrategy {
  Standard = "STANDARD",
  Slow = "SLOW",
  Rapid = "RAPID",
}

enum FoodAStrategy {
  Dilute_Initial = "DILUTE_INITIAL",
  Dilute_None = "DILUTE_NONE",
  Dilute_All = "DILUTE_ALL",
}
  
class Food {
  type: Type;
  name: string;
  protein_conc: number; // (g protein per g or ml of food)

  get protein_g_from_total(total_g: number) {
    return this.number * total_g;
  }

}

class Row {
  food: Food;
  protein: number;
  method: Method;
  daily_amount: number;
  mix_amount?: number;
  water_amount?: number;
}

class Protocol {
  dosing_strategy: DosingStrategy;
  food_a: Food
  food_a_strategy: FoodAStrategy; // default usually should be dilute_initial 
  di_threshold: number = 0.2; // if dilute_initial strategy, then initial steps are diluted until the undiluted food_a is measurable at at least X grams. Default 0.2g
  food_b?: Food;
  food_b_threshold?: number = 0.5; // when food_b can be measured at this threshold, switch to food_b from food_a. Default 0.5g
  // different permutations of food_a based on the strategy chosen that can easily be viewed
  table_di: Row[];
  table_dn: Row[];
  table_da: Row[];
}
```

## OIT calculator spec

### GUI: designed for landscape on desktop, not phone for now

Rough outline:

```html
<div class="oit_calculator">
	<div class=settings-container>
		<div class="food-a-container">
			<div class="search-container">
				<input type="text" id="food-a-search" placeholder="Search for foods or protocols..." class="search-input">
			</div>
		</div>
		<div class="food-b-container">
			<div class="search-container">
				<input type="text" id="food-b-search" placeholder="Optionally, load another food to transition to ..." class="search-input">
				<button id="clear-food-b" class="clear-food-b">Clear</button>
			</div>
		</div>
	</div>
	<div class="dosing-strategy-container">
	</div>
	<div class="output-container">
		<table></table>
		<div class="warnings-container"></div>
	</div>
</div>
```

The top half of the screen is the settings-container, which will contain the settings to select Food A and optionally Food B. These are in separate child containers, food-a-container and food-b-container. Both these containers have their own search bars to look through a repository of foods (name, protein content, and type (solid/liquid)).

Within food-a-container:

- top search bar that spans the width. This search bar is special: see [here](#food-a-search-mechanism) for details. Once a food is selected, the search bar is input is cleared, and then the rest of the container is populated
- an editable bar right below that also spans the width, that contains the name of the selected food (which can be manually changed after)
- a positive number input field for "Protein (g) per " either 100ml or 100g serving, depending on if the food is a solid or liquid. Unit of ml vs g is automatically determined by the food form
- a food form toggle button "Form: [ SOLID | LIQUID ]"
- a food A strategy toggle button "Strategy: [ Initial dilution | Dilution only | No dilutions ]"
- if Initial dilution is selected, there should be another input box for: "Threshold to stop diluting:" ml or g, depending on if the food is a solid or liquid

Within food-b-container:

- top search bar that spans the width with clear-food-b button after that will clear food-b from the protocol (ie. if there was any info entered after, it would be erased). Once a food is selected, the search bar is input is cleared, and then the rest of the container is populated
- editable bar right below that also spans the width, that contains the name of the selected food (which can be manually changed after)
- a positive number input field for "Protein (g) per " either ml or g, depending on if the food is a solid or liquid
- a food form toggle button "Form: [ SOLID | LIQUID ]"
- a food b threshold input: "Threshold to transition:" ml or g, depending on if the food is a solid or liquid

Within dosing-strategy-container: a toggle bottom for "Dosing Strategy: [STANDARD | SLOW | RAPID]"

Within output-container a table with the dosing schedule is displayed, and to the right a small div for any warnings that may arise. The table in rough looks like:

| Step | Protein (mg) | Method   | Daily amount | Amount for mixture | Water for mixture |
| ---- | ------------ | -------- | ------------ | ------------------ | ----------------- |
| 1    | 1            | Dilution | 1 ml         | 0.2 g              | 46.7 ml           |
| 2    | 2.5          | Dilution | 1 ml         | 0.2 g              | 18.7 ml           |
| 3    | 5            | Dilution | 1 ml         | 0.2 g              | 9.3 ml            |
| 4    | 10           | Dilution | 1 ml         | 0.2 g              | 4.7 ml            |
| 5    | 20           | Dilution | 1 ml         | 0.5 g              | 5.8 ml            |
| 6    | 40           | Dilution | 2 ml         | 0.5 g              | 5.8 ml            |
| 7    | 80           | Direct   | 0.3 g        | n/a                | n/a               |
| 8    | 120          | Direct   | 0.5 g        | n/a                | n/a               |
| 9    | 160          | Direct   | 0.7 g        | n/a                | n/a               |
| 10   | 240          | Direct   | 1 g          | n/a                | n/a               |
| 11   | 300          | Direct   | 1.3 g        | n/a                | n/a               |

- Editable column cells: protein (mg), daily amount, amount for mixture. With each edit, other row values should automatically update
- The values should also automatically update with manual changes to the protein conc of the selected food(s)
- To the left of each step number, there should be a (+) and a (-) to either copy the current step (ie add another one) before it, or delete the step.

Within the output container there should also be two buttons: 1) to copy an ASCII representation of the protocol to paste into an EMR, and 2) a button to generate a printable PDF of the protocol.

#### food-a-search mechanism

When the user starts to type, they will see a dropdown of only the names of matching foods from a .json as follows:

```json
[
  {
    "Food": "Cheese souffle",
    "Food Group": "Mixed Dishes",
    "Mean value in 100g": 9.54,
    "Type": "Solid"
  },
  {
    "Food": "Chop suey, with meat, canned",
    "Food Group": "Mixed Dishes",
    "Mean value in 100g": 4.07,
    "Type": "Solid"
  },
  ...
]
```

The .json can be loaded in .js as: `fetch("/tool_assets/typed_foods_rough.json")` and etc.

The names are searched using fuzzysort.min.js, is case insensitive. The first search result is always "Custom: {Whatever the user has typed}" in case the user wants to make a custom food. The dropdown shows a **maximum of VIRTUAL_SCROLL_THRESHOLD items**; rest scrollable. There should be a slight debounce / delay (ie 150 ms) and a search limit of around 50.

**The behaviour for food-b-search mechanism is the EXACT same, _EXCEPT that food-a-search can also search for pre-defined PROTOCOLS_**.
This is where there's another JSON file to search through with the following structure (steps are omitted for brevity here, the numbers are not actually correct/valid), in particular the "name" field. When the protocol is chosen, the whole table / rest of the relevant settings are populated as per the protocol.

```json
[
  {
    "name": "Protocol: peanut powder",
    "dosing_strategy": "STANDARD",
    "food_a": {
      "type": "SOLID",
      "name": "Peanut Powder",
      "protein_conc": 0.21
    },
    "food_a_strategy": "DILUTE_INITIAL",
    "di_threshold": 0.2,
    "food_b": {
      "type": "SOLID",
      "name": "Roasted Peanut",
      "protein_conc": 0.25
    },
    "food_b_threshold": 0.45,
    "table_di": [
      {
        "food": "Peanut Powder",
        "protein": 1,
        "method": "DILUTE",
        "daily_amount": 0.005,
        "mix_amount": 0.005,
        "water_amount": 0.5
      },
      {
        "food": "Peanut Powder",
        "protein": 2.5,
        "method": "DILUTE",
        "daily_amount": 0.012,
        "mix_amount": 0.012,
        "water_amount": 1.2
      },
      {
        "food": "Roasted Peanut",
        "protein": 160,
        "method": "DIRECT",
        "daily_amount": 0.64
      },
      {
        "food": "Roasted Peanut",
        "protein": 240,
        "method": "DIRECT",
        "daily_amount": 0.96
      },
      {
        "food": "Roasted Peanut",
        "protein": 300,
        "method": "DIRECT",
        "daily_amount": 1.2
      }
    ],
    "table_dn": [],
    "table_da": []
  },
  {
    "name": "Protocol: milk rapid",
    "dosing_strategy": "RAPID",
    "food_a": {
      "type": "LIQUID",
      "name": "Cow Milk",
      "protein_conc": 0.004
    },
    "food_a_strategy": "DILUTE_NONE",
    "di_threshold": 0.2,
    "table_di": [],
    "table_dn": [
      {
        "food": "Cow Milk",
        "protein": 1,
        "method": "DIRECT",
        "daily_amount": 0.25
      },
      {
        "food": "Cow Milk",
        "protein": 2.5,
        "method": "DIRECT",
        "daily_amount": 0.63
      },
      {
        "food": "Cow Milk",
        "protein": 300,
        "method": "DIRECT",
        "daily_amount": 75
      }
    ],
    "table_da": []
  },
  ... and so on
]
```

### Validation checks:

Next to the protocol table, there will be a rectangle labelled with "WARNINGS". Normally it will simply state "No problems found", but it will display validation checks that have failed in order for the physician to know if the protocol is invalid or potentially dangerous. These warnings are grouped into two levels: yellow and red.

- yellow
  - dilution errors:
    - a single dilution makes less than 4 days of servings (ie. the daily dose is 1ml, but the instructions say to make 2ml of diluted solution)
  - any of the steps are not in ascending order of protein content
  - steps > 25 (it's a bit _too_ slow)
  - the final dose is >300mg
- red
  - Too fast:
    - Total steps < 6
    - Once mg protein >10, any step that is more than an doubling (ie. 20 -> 60)
  - Protein content provided is wrong (ie. looking at a single row, if the calculated protein content doesn't match the specified one for the step, this should be flagged)
  - A calculation is impossible (ie in a dilution, the request is for 100mg protein but the amount measured is less even without dilution; dilution makes less than 1 serving size)
  - if a step uses dilution and the amount measured to mix is <0.1g or <0.2cc (impractical, not easily measurable for parents)

### Complexities

There is a LOT of state that requires accounting for. While we want the user to have freedom to tweak the protocol, it must be controlled: the worst-case scenario is a protocol that is created that is dangerous due to errors from the program due to a bug. There should be checks and asserts for various grades of problems that will be displayed to the user.

## Sample user workflow

User opens the webpage. They see a the two search bars for food A and optionally food B, and an unfilled table at the bottom

### Selection of pre-defined food

- After typing in the searchbar for food A, ie. peanut butter, they select "Peanut Butter"
- The fields in food-a-container are automatically populated with relevant information + defaults. Specifically:
  - Editable food name field is filled with "Peanut Butter", and protein (g) per 100g serving is filled (ie. 23), and form is "Solid". All this info comes from the JSON with the food profiles
  - Strategy is default initial dilution, with a threshold to switch of 0.2 g. This means that when 0.2g OR MORE of peanut powder alone is enough to match one of the protein (mg) goals, the method switches from DILUTION to DIRECT.
  - The default dosing Strategy is "STANDARD", which corresponds to the following (mg) amounts: 1, 2.5, 5, 10, 20, 40, 80, 120, 160, 240, 300
    - as you recall, Slow: 0.5, 1, 1.5, 2.5, 5, 10, 20, 30, 40, 60, 80, 100, 120, 140, 160, 190, 220, 260, 300. Rapid: 1, 2.5, 5, 10, 20, 40, 80, 160, 300. For now, to make this easier, assume that the slow and rapid are the SAME as the STANDARD - we will worry about implementation of this later.
  - If the user were to toggle to "SLOW" or "RAPID", the table is 'recalculated'.
  - The user should see the table populate automatically, and then have the option of editing specific steps - either deleting or adding rows, or altering the target protein (mg) amount, daily amount to give, and the amount of food to measure for a dilution if applicable. The other values in the row should deterministically update.
  - Any warnings from Editing wiggles causing invalid protocols are displayed on a side panel next to the table
  - There then is the option to copy the current protocol or view a PDF (implementation of this is a separate issue for later)

### Selection of custom food

- After typing in the searchbar for a custom food "magic butter" and selecting "Custom: magic butter"
- The fields in food-a-container are populated with relevant information + defaults. Specifically:
  - Editable food name field is filled with "magic butter", and protein (g) per 100g serving is left blank, and form is default "Solid".
  - Strategy is default initial dilution, with a threshold to switch of 0.2 g.
  - The default dosing Strategy is "STANDARD"

### Selection of custom protocol

- After typing in the searchbar for a built in protocol ie. "Protocol: peanut powder" and selecting it
- The fields in food-a-container (and potentially food-b-container) are populated with relevant information. Specifically:
  - Editable food name field is filled with specified food names, etc for protein concentration, form, strategy, thresholds, etc.
  - The rest is as above: the protocol that is loaded remains editable

## Code implementation details

- The app will be built using a Zola shortcode, with separate files for: 1) the shortcode `oit_calculator.html`, 2) the typescript `oit_calculator.ts` (which I will manually compile into `oit_calculator.js`), and 3) `oit_calculator.scss`
- We will use the decimal.js package and when displaying to the user round, but on the background keep several decimal points for precision
- Canonical measurement units are grams for solids, mls for liquids.
- smallest scale resolution for parents: 0.1 g on kitchen scale (red warning at <0.1 g).
- smallest practical syringe volume: 0.2 ml
- default minServingsForMix = 4 (dilution should make at least 4 daily servings)
- Rounding: round to sensible digits for display: grams → 2 decimal places; ml → 1 decimal or integer depending on magnitude. But validation uses exact decimals.

## DILUTION ASSUMPTIONS:

- For solids diluted into liquids, assume that the solid DOES not contribute to final volume. This assumption DOES BREAK DOWN when the proportion of solid to water becomes larger (say > 1:10) -> which can be a red warning, usually to consider increasing the daily volume (which will increase the amount of dilution required)
- Again, for initial implementation of this app assume only the STANDARD dosing strategy is used (the 11 steps). If it were to be dilutions the entire way through, there are different default daily volumes and amount of food-a to measure based on the protein concentration:

### Calculations for dilutions

Notation:

- `P` = desired protein (mg) for a step
- `C` = concentration mg per gram (solid) or mg per ml (liquid)
- `m` = mass (g OR ml) of food required if used neat: `m = P / C` (if solids, g; if liquids, ml if C is mg/ml)

  - Example solids: C = 233.333 mg/g, P=1 mg → m ≈ 0.004 g
  - Example liquids: C = 4 mg/ml, P=20 mg → m = 20 / 4 = 5 ml

Dilution decision:

- If `m` < `minMeasurableMass` (e.g. 0.1 g) or `m` (if liquid) < `minMeasurableVolume` (0.2 ml), create a dilution:

  - Choose a `mix_food_mass` (or `mix_food_volume`) that is measurable and yields a convenient `dailyAmount_ml` (0.5–5 ml typically).
  - Let `mix_food_amount` produce `mixProteinMg = mix_food_amount * C` (mg).
  - Choose `mixVolume_ml` so that `dailyAmount_ml = desiredDailyServingVolume` yields `P` mg: `dailyAmount_ml = P / (mixProteinMg / mixVolume_ml) = P * mixVolume_ml / mixProteinMg`.
  - Solve for reasonable `mixVolume_ml`: pick `dailyAmount_ml` target (e.g. 1 ml), then `mixVolume_ml = dailyAmount_ml * mixProteinMg / P`.
  - Or choose `mixFood` such that mixVolume is round and `servingsFromMix >= minServings` (>= 4). See algorithm below.

Algorithmic approach for designing a mix:

1. Choose allowable `mix_food_amount` candidates (e.g., 0.1 g, 0.2 g, 0.5 g, 1 g, 2 g). For liquids, ie. 0.5 ml, 1 ml, 2, 3, 4, 5, ... to 10 ml max

2. For each candidate:

   - `mixProteinMg = mix_food_amount * C`
   - For target serving size candidates `[0.5, 1, 2, ... 10] ml` (or larger) compute `mixVolume_ml = P * candidateMixVolume / (mixProteinMg)`

     - rearranged from `P = candidateDailyAmount * (mixProteinMg / mixVolume_ml)` -> `mixVolume_ml = candidateDailyAmount * mixProteinMg / P`
   - Compute `servings = mixVolume_ml / candidateDailyAmount`
   - Accept if:

     - `mixFoodAmount >= minMeasurableMass` (0.1 g) or minMeasurableVolume
     - `servings >= minServingsForMix` (4)
     - `mixVolume_ml` reasonable (≤ 1000 ml)
   - Prefer solution with smallest `mixFoodAmount` above threshold or smallest `dailyAmount_ml` in preferred range.
3. If none pass, increase `mix_food_amount` or choose a direct measure (if impossible then raise red error: "dilution impossible — adjust inputs").
