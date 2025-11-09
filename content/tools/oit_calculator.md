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

# OIT CALCULATOR README:

## Rationale:

There is wide variability in how OIT protocols are implemented across Canada and between individual physicians. OIT can be offered for most foods, and it is now often offered at-home. There is no easy, accessible resource to general EMR and patient friendly protocols for a variety of foods, and the current environment relies on time-intensive approaches with more room for human error to create protocols.

## Premises:

### Operational

1. OIT can be offered at home or with in-clinic updosing. Either way, patients and healthcare workers require a **clearly laid out plan**.
2. Foods for OIT can be liquids or solids, and depending on the starting protein dose dilutions are likely required. With solids diluted into liquids, we assume the solid contributes negligibly to the final volume. For example: if 1 ml of a solution of 0.2g of peanut powder in 40ml of liquid is given, we assume that only 0.2g * 1/40 = 0.005g is actually ingested.
3. There are four 'phenotypes' of OIT:

- Food A with dilutions -> Food A without dilutions. Once weight of undiluted food is easily measurable. Ie. Steps 1-3 are peanut powder slurry, then steps 4 - maintenance are powder only.
- Food A with dilutions until maintenance. More useful if parents want something they can measure once and then more easily give for a few days, instead of weighing something every day.
- Food A without any dilutions. Usually not feasible especially in the first low dose steps; can be done if compounded by pharmacy but not widely available.
- Food A -> Food B at some point. The formulation of food A could be either with dilutions only, mixed dilutions, or no dilutions. Ie. Steps 1-5 are cod powder slurry, then steps 6 - maintenance are cooked cod once weight of food is easily measurable

Examples of the phenotypes in table form:

#### Food A with dilutions -> Food A without dilutions

Liquid, 8g protein per 250ml

| Step | Protein (mg) | Method   | Daily amount (ml) | Amount for mixture | Water for mixture (mL) |
| ---- | ------------ | -------- | ----------------- | ------------------ | ---------------------- |
| 1    | 1            | Dilution | 1                 | 1                  | 31                     |
| 2    | 2.5          | Dilution | 1                 | 1                  | 11.8                   |
| 3    | 5            | Dilution | 1                 | 1                  | 5.4                    |
| 4    | 10           | Direct   | 0.3               | n/a                | n/a                    |
| 5    | 20           | Direct   | 0.6               | n/a                | n/a                    |
| 6    | 40           | Direct   | 1.3               | n/a                | n/a                    |
| 7    | 80           | Direct   | 2.5               | n/a                | n/a                    |
| 8    | 120          | Direct   | 3.8               | n/a                | n/a                    |
| 9    | 160          | Direct   | 5                 | n/a                | n/a                    |
| 10   | 240          | Direct   | 7.5               | n/a                | n/a                    |
| 11   | 300          | Direct   | 9.4               | n/a                | n/a                    |

Solid, 7g protein per 30g

| Step | Protein (mg) | Method   | Daily amount | Amount for mixture (g) | Water for mixture (mL) |
| ---- | ------------ | -------- | ------------ | ---------------------- | ---------------------- |
| 1    | 1            | Dilution | 1            | 0.2                    | 46.7                   |
| 2    | 2.5          | Dilution | 1            | 0.2                    | 18.7                   |
| 3    | 5            | Dilution | 1            | 0.2                    | 9.3                    |
| 4    | 10           | Dilution | 1            | 0.2                    | 4.7                    |
| 5    | 20           | Dilution | 1            | 0.5                    | 5.8                    |
| 6    | 40           | Dilution | 2            | 0.5                    | 5.8                    |
| 7    | 40           | Direct   | 0.2          | n/a                    | n/a                    |
| 8    | 80           | Direct   | 0.3          | n/a                    | n/a                    |
| 9    | 120          | Direct   | 0.5          | n/a                    | n/a                    |
| 10   | 160          | Direct   | 0.7          | n/a                    | n/a                    |
| 11   | 240          | Direct   | 1            | n/a                    | n/a                    |
| 12   | 300          | Direct   | 1.3          | n/a                    | n/a                    |

#### Food A with dilutions until maintenance

Y powder, 1g protein per 15g

| Step | Protein (mg) | Method   | Daily amount (mL) | Amount for mixture | Water for mixture (mL) |
| ---- | ------------ | -------- | ----------------- | ------------------ | ---------------------- |
| 1    | 1            | Dilution | 0.5               | 0.2                | 6.7                    |
| 2    | 2.5          | Dilution | 0.5               | 0.2                | 2.7                    |
| 3    | 5            | Dilution | 1                 | 0.2                | 2.7                    |
| 4    | 10           | Dilution | 1                 | 0.2                | 1.3                    |
| 5    | 20           | Dilution | 1                 | 0.5                | 1.7                    |
| 6    | 40           | Dilution | 2                 | 0.5                | 1.7                    |
| 7    | 80           | Dilution | 4                 | 0.5                | 1.7                    |
| 8    | 120          | Dilution | 4                 | 2.0                | 4.4                    |
| 9    | 160          | Dilution | 4                 | 2.5                | 4.2                    |
| 10   | 240          | Dilution | 4                 | 4.0                | 4.4                    |
| 11   | 300          | Dilution | 4                 | 5.0                | 4.4                    |

#### Food A without any dilutions

X powder, 21g protein per 100g

| Step | Protein (mg) | Method | Daily amount (g) | Amount for mixture | Water for mixture (mL) |
| ---- | ------------ | ------ | ---------------- | ------------------ | ---------------------- |
| 1    | 1            | Direct | 0.005            | n/a                | n/a                    |
| 2    | 2.5          | Direct | 0.012            | n/a                | n/a                    |
| 3    | 5            | Direct | 0.024            | n/a                | n/a                    |
| 4    | 10           | Direct | 0.048            | n/a                | n/a                    |
| 5    | 20           | Direct | 0.095            | n/a                | n/a                    |
| 6    | 40           | Direct | 0.19             | n/a                | n/a                    |
| 7    | 80           | Direct | 0.381            | n/a                | n/a                    |
| 8    | 120          | Direct | 0.571            | n/a                | n/a                    |
| 9    | 160          | Direct | 0.762            | n/a                | n/a                    |
| 10   | 240          | Direct | 1.143            | n/a                | n/a                    |
| 11   | 300          | Direct | 1.429            | n/a                | n/a                    |

OR if the food is a liquid:

X milk, 1g protein per 250 ml

| Step | Protein (mg) | Method | Daily amount (mL) | Amount for mixture | Water for mixture (mL) |
| ---- | ------------ | ------ | ----------------- | ------------------ | ---------------------- |
| 1    | 1            | Direct | 0.3               | n/a                | n/a                    |
| 2    | 2.5          | Direct | 0.6               | n/a                | n/a                    |
| 3    | 5            | Direct | 1.3               | n/a                | n/a                    |
| 4    | 10           | Direct | 2.5               | n/a                | n/a                    |
| 5    | 20           | Direct | 5.0               | n/a                | n/a                    |
| 6    | 40           | Direct | 10.0              | n/a                | n/a                    |
| 7    | 80           | Direct | 20.0              | n/a                | n/a                    |
| 8    | 120          | Direct | 30.0              | n/a                | n/a                    |
| 9    | 160          | Direct | 40.0              | n/a                | n/a                    |
| 10   | 240          | Direct | 60.0              | n/a                | n/a                    |
| 11   | 300          | Direct | 75.0              | n/a                | n/a                    |

#### Food A -> Food B

4. Different phenotypes of how OIT is offered suit different patients and families: flexibility to switch easily is an advantage

### Operational definitions

**OIT Protocol**
Set of doses and instructions for a given food(s).

User details

- There should be the ability to add institution specific protocols. Ie. if I search "peanut bcch" I want the tool populated with the different permutations of peanut powder specific product that they recommend
- There should be an easy way to alter the dosing per step.
- There should be an easy way to add or delete steps.
- There should also be an easy way to save the protocol (and its variations) and load it. Ie. a unique hash generated with each printed patient resource or EMR copy, that can be loaded.
- While there should be sensible defaults, elements of the dosing schedule should be easily editable
- When searching for foods, custom should be an option - but it should also search though the CNF 2015 and automatically populate the rest. The protein count thereafter should also be editable.

* To make things simpler; only one 'OIT protocol' is defined at a current time.
*

## What information is actually required to 'copy' or 'share' a specific protocol?

```
Food obj:
  type: liquid | solid
  name: str
  protein_conc: float (g protein per g of food)

Protocol:
  food_a: food
  food_b: null | food
  food_a_strategy: dilute_mix | dilute all | dilute_none
  table_a: [
    [food, protein, dilute | no, daily_amount, null | [food weight, liquid volume] ],
    ...
  ]
  table_b: [
    [food, protein, dilute | no, daily_amount, null | [food weight, liquid volume] ],
    ...
  ]
  table_c: [
    [food, protein, dilute | no, daily_amount, null | [food weight, liquid volume] ],
    ...
  ]

hash should contain:
proto_a: protocol | null
proto_b: protocol | null
proto_c: protocol | null
```
