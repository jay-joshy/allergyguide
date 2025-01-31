# Allergyguide.ca

## Goals

A resident-led and faculty-reviewed website for high-yield and concise information about 1) conditions 2) therapies/medications 3) Clinical decision tools 4) patient resources. It is meant for **practical use by residents**.

Secondary goals if time permits includes:

- Hosting our own LLM with capabilities of searching through allergy guidelines
- Set of questions for RC studying
- Critical appraisal of new research
- Patient resources translated into different languages

## What is required to make this succeed both short and long term?

- Consistent editor (Josh)
- A well defined contributing process (and a way for non-coders to contribute)
- Well defined topics to address / have goals towards
- Resident contribution across Canada
- Faculty support (as reviewers, maybe as sponsors?)

## Site structure:

- Homepage
- Conditions/Topics
- Meds -- categorized medication cards for easy reference
- Clinical tools
- Research
- Patient resources
- About - goals of the site, contributors, etc.
- Contribute - workflow, style guides, etc

### Topics

Sections:

- Tests
  - SPT, IgE, Food challenges, Drug Challenges
- Hypersensitivity
  - Drugs
    - principles and approach
    - desensitization
    - vaccines
    - SCAD
    - Penicillin allergy
  - Food
    - IgE mediated
    - PFAS
    - Non-IgE mediated (EoE, etc)
    - Immunotherapy
  - Airway and ENT
    - Allergic Rhinitis
    - Asthma
    - Chronic sinusitis
    - ABPA
  - Dermatology
    - Chronic urticaria
    - Angioedema
    - Atopic dermatitis
    - Contact dermatitis
  - Misc
    - Idiopathic/recurrent anaphylaxis
    - Mast cell disorders
    - Eosinophilia
    - Elevated IgE
- Immunology
  - Principles
  - B-cell mediated
  - T-cell mediated
- Misc

#### General topic structure

- Macro to c/p
- Summary:
  - Condition name, epidemiology, pathophysiology, manifestations, diagnosis, management.
- Definitions:
  - Things to know up front before reading the article
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

### research articles:

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

### medications:

Example below:

```
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
age_group = ">=12 years of age; has been used off-label in younger children"
pregnancy = "Avoid (not enough data)"
contraindications = "Hypersensitivity, QT prolongation or history of torsades"
side_effects.common = "QT prolongation; drowsiness (4%); headache (4%). For reference, drowisness/headache had a 2% incidence rate in placebo arm"
side_effects.severe = "Torsades (very rare)"
monograph_links = ["https://pdf.hres.ca/dpd_pm/00062419.PDF"]
```

## Contribution process

Prerequisites: 1) there are staff who we have available to proofread drafts for topic sections 2) there is an editor who can take charge over the 'section'

1. Resident or fellow picks a topic they wish to do, and connect with editor for that 'section' (to be defined later)
2. Timeline is set for 1st rough draft (~ 2 weeks?), which can be completed in whatever editor they want
3. Editor and contributor back and forth initial edits
4. Edited draft is sent to staff, necessary edits are made
5. Editor / Josh / someone with some coding knowledge will add content into website (there is some formatting nuances)

## Nitty gritty internals:

Some data will be stored as .toml or for ease of editing. Most likely we will pursue .toml given it is much more human readable.

### Running the site:

https://www.getzola.org/
https://abridge.pages.dev/
https://thedataquarry.com/posts/static-site-zola/#code

Site is deployed from Netlify from GitHub. It is all open-source.
