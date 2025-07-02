+++
title = "Approach to immune deficiencies"
description = "[description of md page]"
date = 2025-01-01
draft = false
weight=1


[taxonomies]
tags = ["immunology"]
[extra]
toc = true
series = "immunology"
authors = ["author 1", "author 2"]
status="not-started" # options include not-started, wip, or ready
+++

{{ wip() }}

</br>
</br>

<div class="blur-container">

# from talk 07/02/2025

Categorization: primary vs secondary, innate vs adaptive, T cell vs B cell

Some terms:

- PIDD (primary immune deficiency disease)
- IEI (inborn errors of immunity)

> older terms are PID (primary immune deficiency) but this is now outdated. IEI is an umbrella term covering PIDD, autoimmune diseases, allergies... etc

Epidemiology quick facts (no sources for this attached):

- Secondary >>common than PIDD.
  - Malnutrition, HIV, malignancy, drugs, protein loss (ie nephrotic syndrome), metabolic disease (ie. diabetes, liver disease)
  - drug related, atopic eczema and breakdown of skin barrier, PCD, seasonal allergies, heart disease, CF, asthma ...
- for PIDD
  - 1 in 500 including milder forms
  - 1 in 1200 serious PIDD

Below is primarily for primary IEI

## Suggestive history: (fellows should memorize criteria)

- = 2 new ear infections in 1y
- = 2 new sinus infections within 1y in absence of allergy
- one pna per year for >1y
- chronic diarrhea with weight loss
- recurrent viral infections (colds, herpes, warts, condyloma)
- Recurrent need for IV antibiotics
- Recurrent deep abscesses of the skin or internal organs
- persistent thrush or fungal infection, skin or elsewhere
- infection with normally harmless NTM
- family history of PIDD

> HOWEVER: these 10 warning signs are NOT fully sensitive
> 20% of hospitalized patients with suspected PID would not be included for immunologic investigation according to the 10 warning signs (Mehra 2007).
> 56% sensitivity, 16% specificity (Arkwright 2011)

There is some more nuance to the questioning:

- **AGE at onset** (before or after 6 months??)
- frequency (normal differs based on age)
- context behind each infection
- type: deep-seated, superficial; organism isolated?
- response to treatment, if needed

Unlike normal infections, those associated with ID may be:

- more than 12/year
- unusually severe / persistent; may be refractory to usual antibiotic therapy
- atypical presentation
- cause persistent damage
- may have recurrent infections with the same organisms
- may have infections with opportunisitc microbes
- may have infections despite being given protective vaccine
- adverse response to live vaccines (ie active viral disease)

Some specific organ system pearls

- Otitis media:
  - early onset <3-4 months old
  - mastoiditis, brain abscesses
  - recurrence despite ear tubes or change to sinusitis
- Pneumonias
  - if >=2 X-ray proven:
    - Different lung sites?
    -
      - FHX or PIDD?
    - Known bronchiectasis or pneumatocele?

Some important FHx pearls

- ask about consanguinity in parents AND grandparents
- any sex related patterns?
- unexplained or early infant deaths or deaths due to infection/inflammation?

# Now an approach to IEI

~500 different gene defects ...
broad umbrella:

- B & T cell problems
- predominantly antibody deficiencies
- immune dysregulation
- congential issues with phagocyte # function or both
- innate immunity
- autoinflammatory
- complement def
- bone marrow failure

A way to break it down could include:

- IEI
  - PIDD (infection predominant patho)
  - PIRD (Primary immune regulatory disorders), ie IPEX, IBD, malignancy

Category of IEI from infection types / pattern (not very specific, very simplified):

| Category of Disorder                     | Typical Infectious History and Pathogens                                    |
| ---------------------------------------- | --------------------------------------------------------------------------- |
| Cellular immune defect                   | Recurrent opportunistic infections, viral, fungal, bacterial, mycobacterial |
| Humoral immune defect                    | Recurrent sinopulmonary infections with encapsulated bacteria               |
| Neutrophil defect                        | Recurrent bacterial and fungal infections involving the skin and organs     |
| IFN-gamma/IL-12 pathway defect           | Recurrent atypical mycobacterial (includes BCG), _Salmonella_ infections    |
| Complement defects — early components    | Recurrent sinopulmonary and skin infections with encapsulated bacteria      |
| Complement defects — terminal components | Recurrent _Neisseria_ infections                                            |

{% json_to_table() %}
[
{
"microorganism": "Viruses",
"antibodyDeficiencies": "Enteroviruses",
"combinedImmuneDeficiencies": "All, especially: CMV, EBV, respiratory syncytial virus, parainfluenza type 3",
"phagocyteDefects": "No",
"complementDeficiencies": "No"
},
{
"microorganism": "Bacteria",
"antibodyDeficiencies": "Streptococcus pneumoniae, Haemophilus influenzae, Moraxella catarrhalis, Pseudomonas aeruginosa, Staphylococcus aureus, Neisseria meningitidis, Mycoplasma pneumoniae",
"combinedImmuneDeficiencies": "As for antibody deficiencies but also: Salmonella species, Listeria monocytogenes, enteric (gut) flora",
"phagocyteDefects": "S. aureus, P. aeruginosa, Burkholderia cepacia, Nocardia asteroides, Salmonella species, E. coli, other enteric flora",
"complementDeficiencies": "As for antibody deficiencies, especially: N. meningitidis in deficiency of late components"
},
{
"microorganism": "Mycobacteria",
"antibodyDeficiencies": "No",
"combinedImmuneDeficiencies": "Non-tuberculous, including BCG",
"phagocyteDefects": "Non-tuberculous, including BCG",
"complementDeficiencies": "No"
},
{
"microorganism": "Fungi",
"antibodyDeficiencies": "No",
"combinedImmuneDeficiencies": "Candida and Aspergillus species, Cryptococcus neoformans, Histoplasma capsulatum",
"phagocyteDefects": "Candida species, Aspergillus species",
"complementDeficiencies": "No"
},
{
"microorganism": "Protozoa",
"antibodyDeficiencies": "Giardia lamblia",
"combinedImmuneDeficiencies": "Pneumocystis jiroveci, Toxoplasma gondii, Cryptosporidium parvum",
"phagocyteDefects": "No",
"complementDeficiencies": "No"
}
]

{% end %}

</div>
