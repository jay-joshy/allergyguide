---
title: "Oral Immunotherapy Calculator (& allergyguide.ca)"
sub_title: An unmet need in the wild west
author: Joshua Yu
---

# OIT Calculator

## The current landscape of OIT implementation

## Goals of this tool

## How it works: A walkthrough

## Observations about OIT; defining common implementations

## Principles of good design, and key assumptions

## The "Safety Net": Real-time validation

## Research & QI Opportunities

## Next steps

---

# allergyguide.ca

## Goals

## Examples of content

## Next steps

<!-- end_slide -->

# The current landscape of OIT implementation

## ... is filled with substantial heterogeneity

- The specific progression of protein targets, food form (e.g., powder, whole food, liquid), dilution methods, and total steps varies significantly between clinicians, even within a single food.
- _<span style="color: #ff0000">This heterogeneity makes standardized protocol generation a difficult problem</span>_.

## An unmet need:

> Existing tooling for generating OIT protocols are sparse and _do not offer sufficient flexibility for the diversity of protocol phenotypes seen in clinical practice_. Manual methods are time-consuming and prone to human error.
>
> - Manual protocol generation is tedious and time-consuming
> - Dilution and transition calculations
> - Lack of standardization = reinventing the wheel

<!-- end_slide -->

# Goals of this tool

> A robust and flexible platform to generate safe and customizable OIT protocols. Simplify protocol creation, reduce manual errors, and support clinicians and patients with clear, exportable plans.

<!-- list_item_newlines: 2 -->

- _**<span style="color: #ff0000">Customizable Dose Progression</span>**_: Generate OIT protocols with configurable dose progressions, with sensible initial defaults.
- _**<span style="color: #ff0000">Diverse Food Support</span>**_: Handle both solid and liquid foods, performing automatic dilution calculations where necessary.
- _**<span style="color: #ff0000">Food Transitioning</span>**_: Support transitions from a primary food (Food A) to a secondary food (Food B) at a customizable threshold.
- _**<span style="color: #ff0000">Interactive Protocol Tables</span>**_: Fully editable tables for protocol steps, food characteristics, and dilution strategies.
- _**<span style="color: #ff0000">Real-time Validation</span>**_: Immediate, colour-coded warnings for potential safety or practicality concerns during protocol creation.
- _**<span style="color: #ff0000">Export Options</span>**_: ASCII export to clipboard and PDF export of plan for patients.

<!-- end_slide -->

# How it works: A walkthrough

<!-- list_item_newlines: 2 -->

1. **Select Food or Protocol:** Start by searching for a primary food (e.g., "Peanut flour") or loading a pre-existing protocol template.

2. **Customize Protocol:** Adjust Food A settings (protein concentration, form), select a dosing strategy (Standard, Slow, Rapid), and modify individual steps. Optionally, add a transition to a second food (Food B).

3. **Review and Refine:** The tool displays real-time warnings (red for critical, yellow for caution). The protocol table is fully editable.

4. **Export:** ASCII format for EMR or patient-friendly PDF handout.

<!-- end_slide -->

<!-- jump_to_middle -->

# What is the problem space we're dealing with? OIT is so variable ...

## Some personal observations ...

<!-- end_slide -->

# Observations about OIT and defining common implementations

## There are ~~five~~ four main phenotypes of OIT

<!-- incremental_lists: true -->
<!-- list_item_newlines: 2 -->

1. _<span style="color: #ff0000">Food A with initial dilutions</span>_, transitioning to direct dosing once the weight of undiluted food is easily measurable.
2. _<span style="color: #ff0000">Food A with dilutions maintained throughout</span>_ the protocol.
3. _<span style="color: #ff0000">Food A with no dilutions</span>_ (e.g., using pharmacy-compounded products).
4. _<span style="color: #ff0000">Transition from Food A to Food B</span>_, where Food B is given directly without dilution.
5. ~~_<span style="color: #ff0000">Cumbersome units</span>_, ie. 1/64 of a bamba~~

> This tool is designed to handle all four of these common clinical scenarios.

<!-- end_slide -->

# Principles of tool design

> This tool will have both 1) Physician and 2) Patient/family facing UI and instructions

<!-- list_item_newlines: 2 -->

- **<span style="color: #ff0000">Simple and Fast:</span>** Getting a standard result <span style="color: green">**should be quick**</span>: get common well-used protocols with one search and click.

- **<span style="color: #ff0000">To be simple and fast in a large problem space requires sensible defaults.</span>** Not everyone will agree on these defaults, <span style="color: green">but they should be easy to change</span>.

- **<span style="color: #ff0000">WYSIWYG (What You See Is What You Get):</span>** Most of the protocol should be manually editable without surprising re-calculation behaviour. That means: if you decide to shoot yourself in the foot and ask for an impossible situation, <span style="color: #ff0000">**you will get it**</span>.

- **<span style="color: #ff0000">Flexible but Safe:</span>** If you give a user +++ freedom, <span style="color: yellow">unintended side-effects inevitably arise</span>. The tool won't stop you from making changes, but it will flag potential issues with clear warnings.

- **<span style="color: #ff0000">Let computers do the menial calculations</span>**

<!-- end_slide -->

# Key assumptions

<!-- list_item_newlines: 2 -->

- **<span style="color: #ff0000">Measurement Limits:</span>** Defaults to 0.01g for scales and 0.1ml for syringes; practically, I personally have found a minimum measurement of 0.2g or 0.2ml to be reasonable
  - Some feedback: for certain families, measuring 0.1 ml resolution with a syringe is difficult?

- **<span style="color: #ff0000">Daily amounts</span>**: variation in practice ... 0.5 ml, etc.

- **<span style="color: #ff0000">Dilution Mechanics:</span>** Assumes negligible volume for solids in liquid (with safeguards). Aims for practical recipes (e.g., making enough for at least 3 days)

- **<span style="color: #ff0000">Food Data:</span>** Uses Health Canada data as a base, but custom foods are addable

```json
[
  {
    "Food": "PB2 - Powdered Peanut Butter - Original",
    "Mean value in 100g": 46.15,
    "Type": "Solid"
  },
  {
    "Food": "PB&Me Powdered Natural Peanut Butter",
    "Mean value in 100g": 50,
    "Type": "Solid"
  },
  ...
]
```

- **<span style="color: #ff0000">Dosing Strategies:</span>** Provides three default progressions (Standard, Slow, Rapid) as sensible starting points.

<!-- end_slide -->

# How do we calculate dilutions?

<!-- list_item_newlines: 2 -->

- It searches through many possible recipes (combinations of food amount, water amount, etc.).
- It prioritizes recipes that are:
  - **Measurable:** Use amounts that can be accurately measured with standard kitchen scales and syringes.
  - **Practical:** Tries to create a mixture that will last for at least 3 servings.
  - **Safe:** Follows built-in rules to avoid overly concentrated or large-volume mixtures.
- The "best" recipe is then automatically selected and displayed.

<!-- end_slide -->

# The "Safety Net": Real-time validation

> A safety net, not a straitjacket. Non-blocking feedback

<!-- list_item_newlines: 2 -->

- <span style="color:red">**Red Warnings (Critical):**</span> For issues that are likely unsafe or impossible.
  - _Example: A calculated dose is too small to be measured accurately at home._

- <span style="color: #FFA500">**Yellow Warnings (Caution):**</span> For things that might be impractical or unusual.
  - _Example: A dilution requires a very large amount of water._

<!-- end_slide -->

# Research & QI Opportunities

> This tool creates structured, digital data for every protocol.

<!-- list_item_newlines: 2 -->

- TODO!

<!-- end_slide -->

# Action items for OIT Calculator

<!-- list_item_newlines: 2 -->

- **Review and add more Warning Rules:**
  - Review current rules
  - Add warnings for excessively high target protein doses (e.g., >5000mg).
- **Improved Patient Handouts:**
  - Expand the PDF export to include comprehensive patient-facing information about home OIT administration, side effects, emergency protocols, etc.
- **Adding more custom food and protocols**
  - Pending more beta testing for bugs
- **QI project**
  - Reaching out to allergists (BCCH, ARISE) who would be interested
- **Rounding**: only integers for mls? For some families, having to measure .1 ml resolution difficult?
  - Offer as a toggle?

<!-- end_slide -->

---

# allergyguide.ca

## The bigger picture

<!-- end_slide -->

# Goals of allergyguide.ca

<!-- end_slide -->

# Examples of content

<!-- end_slide -->

# Next steps for allergyguide.ca

<!-- end_slide -->
