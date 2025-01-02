# Allergyguide.ca

TODO:

- home-page -- create sections with links to pages X DONE
- about page
  - add author pictures
- 404 page -- tweak
- content (need one example page per section)
  - macros
  - topics
  - meds
  - research
- Shortcodes:
  - Picture with caption underneath, modern X DONE
  - Template for macros/ which just lists them all out X DONE
  - Profiles — circular picture with caption underneath X DONE
- tomls
  - macros for topics X DONE
  - research appraisal
  - medications
- connect allergy.ca to github upon deployment
- contributing guide (ie. style)

## Goals

A resident-led and faculty reviewed website for high-yield and concise information about 1) conditions 2) therapies/medications 3) Clinical decision tools 4) patient resources. It is meant for **practical use by residents**.

Secondary goals if time permits includes:

- Hosting our own LLM with capabilities of searching through allergy guidelines
- Set of questions for RC studying
- Critical appraisal of new research
- Patient resources translated into different languages

## Site structure:

- About - goals of the site, contributors, etc.
- Privacy - boilerplate -- we're not collecting anything
- Contribute - WIP, style guides, etc. Also for shortcode guides.
- Main page -- slideshow, links to click on,
- Research
- Conditions/Topics
- Clinical tools
- Meds
- Patient resources

## Data structures

Some data will be stored as .toml or .json for ease of editing. Most likely we will pursue .toml given it is much more human readable.

### research articles:

Systematic review vs primary evidence

- Metadata
  - Title
  - Year
  - Journal
  - Trial name: Option
- Tags: list[str]
- Summary
- PICO
- Figures
  - (Path to photo, description)
- Description
  - Background
  - Objective
  - Methods
  - Results
  - Limitations
  - Conclusion

### medications:

- Generic
- Brand names
- Cost:: (province and coverage)
- Mechanism of action:
- Doses:
  - Indication, dose, adjustments
- Contraindications:
- Side effects:
  - Severe
  - Common

### macros (for conditions to c/p)

- History
- Investigations:
- Management:

## Topic breakdown

1. list them all out or 2) break them down into sections
   easier to navigate if you break them down into sections
   It might be easier to just list them all out and THEN figure out it later.
   That, or USE the tags to find things more easily

Tests

- SPT, IgE

Drug allergy principles

- desensitization
- vaccine
- SCADs
- DRESS
- IgE mediated

Food allergy

- IgE mediated
- Non IgE mediated
- PFAS
- Oral challenges
- EoE
- immunotherapy

Derm

- atopic dermatitis
- CSU
- angioedema
- contact dermatitis

ENT/Resp

- Asthma
- Allergic rhinitis
- chronic sinusitis
- immunotherapy
- ABPA
- EGPA

Immunology

- Principles
- B cell mediated
- T cell mediated
- Misc

Misc?
MCAS, recurrent anaphylaxis
Eosinophilia
Elevated IgE

## Topic structure

Not defined in .toml as I want the structure to be fairly flexible. In general though:

- Macro (defined in a separate file)
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
- Prognosis:
- Patient resource sheet:
- Quiz yourself:
- Further Reading:
- Authors:
  - Primary: list
  - Reviewers: list
  - Editor: list

## Running the site:

Install zola:

```zsh
brew install zola
```

https://www.getzola.org/
https://abridge.pages.dev/
https://thedataquarry.com/posts/static-site-zola/#code
