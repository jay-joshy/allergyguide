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

## Background and rationale:

Oral immunotherapy (OIT) is a novel approach to treating food allergies that is most effective / safe in younger populations. It involves a structured gradient introduction of a food through many 'steps', each corresponding to a particular protein count: the last step is the maintenance step, usually 300mg of food protein.

There is wide variability in how OIT protocols are implemented across Canada and between individual physicians. That variability may manifest in the forms of the food that are used for OIT, how they are diluted, how many steps are taken in total, the protein content for each step, and others: there are many permutations. However, there is no easy, accessible resource to generate EMR and patient friendly protocols for a variety of foods that takes into account these basic variations in application, and the current practices rely on time-intensive and manual approaches to make protocols with more room for human error.

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

```
Food obj:
  type: liquid | solid
  name: str
  protein_conc: float (g protein per g of food)

Method enum:
  dilute
  direct

Protocol obj:
  food_a: food
  food_a_strategy: dilute_initial | dilute all | dilute_none
  di_threshold: float
  food_b: null | food
  food_b_threshold: float (positive number)
  table_di: [
    [food, protein, Method, daily_amount, null | [food weight, liquid volume] ],
    ...
  ]
  table_da: [
    [food, protein, Method, daily_amount, null | [food weight, liquid volume] ],
    ...
  ]
  table_dn: [
    [food, protein, Method, daily_amount, null | [food weight, liquid volume] ],
    ...
  ]
```

## OIT calculator spec

User details

- When searching for foods, custom should be an option - but it should also search though the CNF 2015 and automatically populate the rest. The protein count thereafter should also be editable. As reference, the CNF 2015 file is a .csv that looks like:

```csv
Food,Food Group,Mean value in 100g,StandardError,Type
Cheese souffle,Mixed Dishes,9.54,0.0,solid
"Chop suey, with meat, canned",Mixed Dishes,4.07,0.0,solid
"Chinese dish, chow mein, chicken",Mixed Dishes,6.76,0.538,solid
"Vinegar, cider",Spices and Herbs,0.0,0.0,liquid
...
```

- There should be an easy way to alter the dosing per step.
- There should be an easy way to add or delete steps.
- While there should be sensible defaults, elements of the dosing schedule such as the daily amount, amount to measure for dilutions if applicable, should be easily editable
- There should also be an easy way to save the protocol (and its variations) and load it. Ie. a unique hash generated with each printed patient resource or EMR copy, that can be loaded.
- On the backend, there should be the ability to add institution specific protocols (ie random person on internet cannot make a custom one). Ie. I can add "peanut bcch powder" which populates the tool with the different permutations of a specific peanut powder
