# Allergyguide.ca

## Goals

A resident-led and faculty-reviewed website for high-yield and concise information about 1) conditions 2) therapies/medications 3) Clinical decision tools 4) patient resources. It is meant for **practical use by residents**.

Secondary goals if time permits includes:

- Set of questions for RC studying
- Critical appraisal of new research
- Patient resources translated into different languages -- also with specific geographics (ie. BC, ON, etc.)

**Please see the current draft website for a better idea of what is envisioned: [allergyguide.ca](https://allergyguide.ca)**

## What is required to make this succeed both short and long term?

- A consistent editor (hopefully Josh)
- A well defined contributing process (and a way for non-coders to contribute)
- Well defined topics to address / have goals towards
- Resident contribution across Canada
- Faculty support (as reviewers, maybe as sponsors?)

For further details re: contributing process, formatting, content for topics/macros/etc., **please see the [contribution page](https://allergyguide.ca/contribute/)**

## Site structure:

- Homepage
- Conditions/Topics -- patient resources are included for each
- Meds -- categorized medication cards for easy reference
- Clinical tools
- Research -- short critical appraisals of mostly landmark studies relevant to patient education
- About -- goals of the site, contributors, etc.
- Contribute -- workflow, style guides, etc

### Topics/Conditions

Sections:

- Tests
  - SPT, IgE, Food challenges, Drug Challenges
- Hypersensitivity
  - Drugs
    - Principles and approach
    - Desensitization
    - Vaccines
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
    - Anaphylaxis
    - Idiopathic/recurrent anaphylaxis
    - Mast cell disorders
    - Venom hypersensitivity
- Immunology
  - Principles
  - B-cell mediated
  - T-cell mediated
- Misc
  - Eosinophilia
  - Elevated IgE

## Nitty-gritty internals:

Some data will be stored as .toml or for ease of editing. Most likely we will pursue .toml given it is much more human readable.

### Running the site:

https://www.getzola.org/
https://abridge.pages.dev/
https://thedataquarry.com/posts/static-site-zola/#code

Site is deployed from Netlify from GitHub. It is all open-source.
