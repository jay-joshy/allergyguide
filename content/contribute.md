+++
title = "Contributing to allergyguide.ca"
description = "How the sausage is made"
draft = false
date = "2025-01-31"
in_search_index = false

[extra]
toc = true
authors = ["Joshua Yu"]
+++

Thanks for checking us out! If you're interested in clinical allergy and immunology and would like to help out ...
Connect with us through ...

## Contribution process

Prerequisites: 1) there are staff who we have available to proofread drafts for topic sections 2) there is an editor who can take charge over the 'section' 3) We have a google drive "Resident Contributor Dashboard" (i.e. showing available topics and who’s working on what) to organize our efforts

1. Resident or fellow picks a topic they wish to do, and connect with editor for that 'section' (to be defined later)
2. Timeline is set for 1st rough draft (~ 2 weeks?)

- These drafts can be done through Google Docs drive somewhere for ease of use. While technically it can be done through markdown and version controlled through git, this lowers to barrier to entry.

3. Editor and contributor back and forth initial edits
4. Edited draft is sent to staff, necessary edits are made
5. Editor / Josh / someone with some coding knowledge will add content into website (there are some formatting nuances)

## Stylistic Principles

{% important(header = "General writing guidelines") %}

- Be concise and clear -- the intended use is for residents
- Use clear, structured formatting (headings, bullet points, tables) for readability
- Avoid passive voice where possible
- Abbreviations are fine but must be defined

{% end %}

{% warning(header = "General formatting guidelines") %}

- Bullet points: Prefer over long paragraphs; no periods at the end of items
- Emphasize key points: Use bold, color, and highlights
- Tables/Figures: Only if they enhance understanding (e.g., decision algorithms)

{% end %}

## Content guidelines

#### Macros

- Contains family doctor focused blurb about the condition (ie. pathophys, prognosis)
- Investigations
- Recommendations: non-pharmacologic, pharmacologic

Example:
{{ load_macro(topic_name = "_xample_topic") }}

#### Topics

Not all topics will fit this general structure; this is meant as a general scaffold.

- Macro to c/p
- Summary:
  - Condition name, epidemiology, pathophysiology, manifestations, diagnosis, management.
- Definitions:
  - Things to know up front before reading the article
  - Abbreviations
- Presentation
  - Clinical: (history and exam)
  - Labwork:
- Diagnosis:
  - Criteria / approach
  - Differentials
- Investigations:
- Management:
  - Usual:
  - Special circumstances:
- Natural history / prognosis:
- Patient resource sheet:
- Quiz yourself:
- Further Reading:
- Authors:
  - Primary: list
  - Reviewers: list
  - Editor: list

#### Medications

Example:

```toml
[bilastine]
category = "antihistamine"
brand_names = ["Blexten"]
cost = [{ province = "ON", price = "~$1 CAD per 20mg tab" }]
moa = "H1 antagonist. Marketed as limited CNS distribution."
half_life = "~15 hours"
routes = "oral tab, liquid (uncommon)"
doses = [
  { indication = "CSU, AR", dose = "20mg daily to QID", notes = "adult dosing" },
  { indication = "CSU, AR", dose = "10mg daily to QID", notes = "pediatric dosing" },
]
pearls = ["Theoretically does not cross BBB"]
age_group = ">=12 years of age; has been used off-label in younger children"
pregnancy = "Avoid (not enough data)"
contraindications = "Hypersensitivity, QT prolongation or history of torsades"
side_effects.common = "QT prolongation; drowsiness (4%); headache (4%). For reference, drowisness/headache had a 2% incidence rate in placebo arm"
side_effects.severe = "Torsades (very rare)"
monograph_links = ["https://pdf.hres.ca/dpd_pm/00062419.PDF"]
```

#### Research appraisals

Systematic review vs primary evidence

- Metadata
  - Title
  - Year
  - Journal
  - Trial name
- PICO + Conclusion
- Figures
- Description
  - Background
  - Objective
  - Methods
  - Results
  - Limitations
  - Conclusion
