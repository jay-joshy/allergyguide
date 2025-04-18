+++
title = "Chronic rhinosinusitis"
description = "An approach to chronic rhinosinusitis"
date = 2025-04-18
draft = false
[taxonomies]
tags = ["hypersensitivity","airway and ent"]
[extra]
toc = true
series = "airway and ent"
authors = ["Author: JY", "Editor: AR", "Staff: TBD"]
+++

<div style="padding-top:1rem;">
</div>

{% admonition(type="info", icon="info", title="THE BOTTOM LINE") %}

CRS is a complex inflammatory syndrome of the nose and paranasal sinuses, with three major subtypes: CRSsNP, CRSwNP, and AFRS. <span class="hl-yellow">**Diagnosis requires both objective structural evidence of sinus inflammation** (CT or endoscopy) and **≥2 cardinal symptoms for ≥12 weeks** (nasal congestion, facial pain or pressure, nasal drainage, and absent or reduced smell)</span>. Preliminary workup involves aeroallergen testing with other ad-hoc tests. **First-line management includes trigger avoidance, saline rinses, and INCS; failure of medical therapy may require ENT surgery**. Biologics such as dupilumab are highly effective for CRSwNP, and are indicated for refractory or severe presentations.

<br>

[Patient Resource](/handouts/chronic-rhinosinusitis/)

{% end %}

<br>

{{ load_macro(topic_name = "chronic_rhinosinusitis") }}

## Definitions

{% two_columns() %}

- AFRS: allergic fungal rhinosinusitis
- CRS: chronic rhinosinusitis
- CRSsNP: chronic rhinosinusitis without nasal polyps
- CRSwNP: chronic rhinosinusitis with nasal polyps

<!-- split -->

- FESS: functional endoscopic sinus surgery
- NERD: NSAID exacerbated respiratory disease
- OMC: Ostiomeatal complex

{% end %}

## Summary diagram

{{ img(src ="/topic_assets/chronic_rhinosinusitis/summary.png") }}

## Diagnostic criteria (multiple exist)

{% tabs() %}

<!-- TAB -->International: 2021 (our preference)
<!-- CONTENT -->

Requires <span class="hl-yellow">both ≥2 key symptoms for ≥12 weeks AND objective structural evidence of sinus inflammation:</span> <span class="references">1,2</span>

<div style="padding-top:1rem">
</div>

{% two_columns() %}

{% admonition(type="info", icon="info", title="Key symptoms - at least 2 for at least 12 weeks") %}

- Nasal obstruction or congestion
- Facial pain, pressure, or fullness
- Nasal discharge (rhinorrhea or post-nasal drip)
- Absent or decreased sense of smell
- Cough (in Pediatric CRS)

{% end %}

<!-- split -->

{% admonition(type="info", icon="info", title="Objective sinus inflammation") %}

This is done through either:

1. CT sinuses (non contrast) – will visualize sinus mucosal thickening, opacification (plain XR is not sensitive), OR
2. Direct visualization with nasal endoscopy

{% end %}

{% end %}

<!-- TAB -->Canadian: 2011
<!-- CONTENT -->

Requires both ≥2 key symptoms for ≥8-12 weeks and at least 1 objective finding on endoscopy or CT scan: <span class="references">3</span>

<div style="padding-top:1rem">
</div>

{% admonition(type="info", icon="info", title="Key symptoms") %}

- Facial congestion/fullness
- Facial pain/pressure/fullness
- Nasal obstruction/blockage
- Purulent anterior/posterior nasal drainage (discharge may be nonpurulent, non discolored)
- Hyposmia/anosmia

{% end %}

<!-- TAB -->European: 2020
<!-- CONTENT -->

≥2 key symptoms for ≥12 weeks (at least one from a 'major' criteria) and at least 1 objective finding on endoscopy or CT scan: <span class="references">4</span>

<div style="padding-top:1rem">
</div>

{% two_columns() %}

{% admonition(type="info", icon="info", title="Major symptoms") %}

- Nasal blockage / obstruction / congestion
- Nasal discharge (anterior / posterior nasal drip)

{% end %}

<!-- split -->

{% admonition(type="info", icon="info", title="Minor symptoms") %}

- Adult: facial pain/pressure, OR reduction or loss of smell
- Peds: facial pain/pressure, OR cough

{% end %}

{% end %}

<!-- TAB -->American: 2015
<!-- CONTENT -->

≥2 key symptoms for ≥12 weeks and at least 1 objective finding on endoscopy or CT scan: <span class="references">5</span>

<div style="padding-top:1rem">
</div>

{% admonition(type="info", icon="info", title="Key symptoms") %}

- mucopurulent drainage (anterior, posterior, or both),
- nasal obstruction (congestion)
- facial pain-pressure-fullness
- decreased sense of smell

{% end %}

{% end %}

## Epidemiology and classifications

- Overall epidemiology
  - Canadian prevalence ~2-15% <span class="references">6</span>; CRSsNP > CRSwNP >> AFRS
  - Adults and pediatrics affected, mean diagnosis age ~39, females slightly > males <span class="references">6,7</span>
  - Associated with increased healthcare costs + decreased QoL
- Often symptoms are long-standing before presenting to medical attention, given low-grade severity
- Other non-specific symptoms include ear fullness, headache, fatigue, altered taste, cough

#### CRSsNP

- Most common (~⅔ of cases)
- Likely link to allergies, infections, irritants, etc.
- Classically thick and mucopurulent anterior/posterior nasal discharge predominant, less hypo/anosmia than CRSwNP
- May have persistent symptoms with occasional flares

#### CRSwNP

- Polyps are soft, usually bilateral avascular eosinophil-rich growths that most commonly grow from the ethmoid sinuses
- Compared with CRSsNP, stronger association with asthma (~25% of patients), AFRS, NERD <span class="references">6</span>
- Often stuffy nasal quality to voice

#### AFRS

- Inflammation from hypersensitivity to usually commensal fungi
- More often in younger immunocompetent individuals in hot/humid climates (moreso in the US) and low SES; associated with polyposis <span class="references">2,7</span>
- Classically peanut-butter like mucus, very thick and tenacious
- Specific criteria: ALL of
  - CRS symptoms, Type 1 hypersensitivity to fungi confirmed by history, skin test, or serology, typical CT findings, Eosinophilic mucin with non-invasive fungal hyphae, absence of immunodeficiency, uncontrolled diabetes <span class="references">7</span>

{% dropdown(header="FYI: A new classification system?") %}

In 2020 a new classification system beyond sNP/wNP/AFRS was proposed based on primary vs secondary causes, and localization/type of inflammation (local vs diffuse; TH2 skewed vs non-TH2). <span class="references">8</span>

<br>
<br>

Note that not all guidelines / position statements use this classification. Read the referenced JAMA article if you’re interested in learning more :)

<br>

{% mermaid() %}
flowchart LR
A["Primary CRS"] --> B["Localized
(unilateral)"]
A --> C["Diffuse
(bilateral)"]
B --> D["Type 2"]
B --> E["Non-type 2"]

C --> F["Type 2"]
C --> G["Non-type 2"]

D --> H["AFRS"]
E --> I["OMC
Isolated frontal
Isolated sphenoid"]

F --> J["CCAD
eCRS
AFRS"]
G --> K["Non-eCRS
Poor corticosteroid response
Older or smoker"]
{% end %}

{% mermaid() %}
flowchart LR
A["Secondary CRS"] --> B["`Localized
(unilateral)`"]
A --> C["`Diffuse
(bilateral)`"]

B --> D["`Local
pathology`"]

C --> E["`Mechanical
(mucociliary)`"]
C --> F["`Inflammatory
(autoimmune)`"]
C --> G["`Immunity
(immunodeficiency)`"]

D --> H["`Odontogenic
Fungal ball
Tumor`"]

E --> I["`PCD
CF`"]

F --> J["`GPA
EGPA`"]

G --> K["`Selective IgA
deficiency
CVID
Diabetes`"]
{% end %}

{% end %}

## Differential diagnosis

{% two_columns() %}

- Rhinitis (ie. allergic, vasomotor, medicamentosa, hormonal, etc.)
- GPA/EGPA
- Malignancy
- Non-rhinogenic (ie. migraines, trigeminal neuralgia)

<!-- split -->

- Structural abnormalities
- CF
- Immunodeficiency

{% end %}

{% admonition(type="danger", icon="flag", title="RED FLAGS ON HISTORY") %}

- Signs of vasculitis
- Purely unilateral symptoms (consider malignancy)
- Double vision, neurologic symptoms
- Severe headache, neck stiffness, visual changes (? meningitis, abscess, cavernous sinus thrombosis)
- Unexplained weight loss, recurrent fevers, night sweats

{% end %}

## Pathophysiology and risk factors

#### The normal sinuses

{{ img(src="/images/example.png")}}

- Sinuses lined by thin mucosal layer with cilia and goblet cells
- A key ostium (a connection from sinus into the nose) is the OMC

#### The chronically inflamed sinuses

- Exact cause not understood for any subtype of CRS, but overall CRS is more inflammatory > infectious
- Likely combination of physical/environmental insults, hypersensitivity, microbial pathogens, and structural abnormalities that ultimately lead to sinus mucosal dysfunction/inflammation, poor drainage/aeration, and resultant symptoms
  - For AFRS, common organisms: Bipolaris, Curvularia, Alternaria, Rhizopus, Drechslera, Helminthosporium, Fusarium, and Aspergillus <span class="references">7</span>
  - Exaggerated TH2 response and very thick mucous forms

#### PREDISPOSING CONDITIONS/RISK FACTORS TO ASSESS FOR ALL CRS

{% two_columns() %}

- Allergic rhinitis (common culprits: dust mites, pets, molds, cockroaches); typically secretions are more clear/thin
- Airborne irritants (ie. smoking, pollution, occupational exposures)
- Asthma & lower airway respiratory disease
- Disorders of impaired ciliary motility (CF, PCD)
- NERD

<!-- split -->

- Repeated viral infections
- Humoral deficiency - often recurrent purulent infection
- HIV
- Vasculitis
- Pre-existing structural issues (ie. deviated septum): may predispose, but by themselves are a very uncommon cause. Weak evidence

{% end %}

## Investigations

No standard panel of tests. However, consider ad-hoc testing such as:

- SPT / sIgE (most likely you will do this consistently)
- Quantitative immunoglobulins and other humoral deficiency workup
- Ciliary function testing
- CF testing
- NERD testing
- Asthma testing

## Management

{% admonition(type="tip", icon="tip", title="Goal of treatment is usually NOT curative") %}
Goals are symptom control through reduction of inflammation and improvement of sinus patency.
{% end %}

<div style="padding-top:1rem">
</div>

{% admonition(type="danger", icon="info", title="THE BRASS TACKS") %}

- Determine subtype of CRS, consider CT sinus and involvement of ENT colleagues for endoscopic assessment & consideration of early management
- First-line treatment trial (unless AFRS => likely early FESS + altered first-line) for at least 2-3 months, + treatment of any underlying risk factors (ie. AR, GERD, CF, immunodeficiency)
- Monitor treatment either through scores (SNOT-22) vs gestalt clinical judgement
- Specific subtype treatment (ie. biologics for CRSwNP if patient qualifies)
- FESS if medically refractory

{% end %}

#### First line treatment

- **Treat any underlying risk factors (who knew?)**
- **Lifestyle**
  - Avoidance of environmental triggers/insults/allergens
  - High volume nasal saline rinses/irrigation (OTC, rinses > sprays), at least 200 mL per side <span class="references">9</span>. Can improve penetration/efficacy of other topicals if used beforehand.
    - Examples: neti pot, squeeze bottles, etc. Must be STERILE saline (boiled/distilled water)
- **INCS**
  - Multiple delivery methods, most common in Canada are spray and rinses; widely available but high chance of operator misuse with sprays
  - Takes 8-12 weeks to have maximal effect
  - Minimal concern for long-term side effects, ie. adrenal insufficiency
  - _ExRx: Nasonex 2 sprays BID_ {% popup() %}

{{ medications_toml_load(meds=["template_med"])}}

{% end %}

{% dropdown(header="INCS Rx examples and potency") %}

<ul>
  <li>
    Nasonex (mometasone furoate 50 mcg) 2 sprays EN BID {% popup() %}

{{ medications_toml_load(meds=["template_med"])}}

{% end %}

</li>
  <li>
    Avamys (fluticasone furoate 27.5 mcg) 2 sprays EN daily {% popup() %}

{{ medications_toml_load(meds=["template_med"])}}

{% end %}

</li>
  <li>
    Omnaris 2 sprays EN daily {% popup() %}

{{ medications_toml_load(meds=["template_med"])}}

{% end %}

</li>
  <li>
    Flonase 2 sprays EN daily {% popup() %}

{{ medications_toml_load(meds=["template_med"])}}

{% end %}

</li>
  <li>
    Budesonide impregnated saline rinses (ie. Pulmicort, 0.5 mg respule per bottle of saline) BID {% popup() %}

{{ medications_toml_load(meds=["template_med"])}}

{% end %}

</li>
  <li>
    Combination INCS/INAH if comorbid allergies
    <ul>
      <li>
        Ryaltris 2 sprays each nostril BID {% popup() %}

{{ medications_toml_load(meds=["template_med"])}}

{% end %}

</li>
<li>
Dymista 1 spray EN BID {% popup() %}

{{ medications_toml_load(meds=["template_med"])}}

{% end %}

</li>
</ul>

</li>
</ul>

{% json_to_table()%}
[
{
"INCS": "Beclomethasone dipropionate",
"Brand Name": "Beconase AQ",
"Bioavailability": "44%",
"Generation": "First",
"Fragrance": "Scented"
},
{
"INCS": "Budesonide",
"Brand Name": "Rhinocort Aqua, Rhinocort Turbuhaler",
"Bioavailability": "31% (Spray), 22% (Turbuhaler)",
"Generation": "First",
"Fragrance": "Non-scented"
},
{
"INCS": "Flunisolide",
"Brand Name": "Rhinalar",
"Bioavailability": "49%",
"Generation": "First",
"Fragrance": "Non-scented"
},
{
"INCS": "Triamcinolone acetonide",
"Brand Name": "Nasacort AQ",
"Bioavailability": "46%",
"Generation": "First",
"Fragrance": "Non-scented"
},
{
"INCS": "Ciclesonide",
"Brand Name": "Omnaris",
"Bioavailability": "<1%",
"Generation": "Second",
"Fragrance": "Non-scented"
},
{
"INCS": "Fluticasone - azelastine",
"Brand Name": "Dymista",
"Bioavailability": "0.8%",
"Generation": "Second",
"Fragrance": "Non-scented"
},
{
"INCS": "Fluticasone furoate",
"Brand Name": "Avamys",
"Bioavailability": "0.5%",
"Generation": "Second",
"Fragrance": "Non-scented"
},
{
"INCS": "Fluticasone propionate",
"Brand Name": "Flonase",
"Bioavailability": "0.5%",
"Generation": "Second",
"Fragrance": "Scented"
},
{
"INCS": "Mometasone furoate",
"Brand Name": "Nasonex",
"Bioavailability": "0.5%",
"Generation": "Second",
"Fragrance": "non-scented"
}
]
{% end %}
<i>Table adapted from Fowler and Sowerby (2021)</i><span class="references">10</span>

{% end %}

- **Consider involving ENT** for endoscopic assessment and consideration of early surgical management
- **Antibiotics**
  - May consider for acute flares. Most common organism is _S. aureus_
  - **CAUTION**: _this is not a routine treatment_ and there is poor quality evidence it has benefit <span class="references">4</span> - exercise antibiotic stewardship. If requiring multiple courses or known resistant bugs => CULTURE first
  - _ExRx: clavulin 875 mg twice daily for 10 d, moxifloxacin 400 mg PO x10 if penicillin allergic_

{% admonition(type="pearl", icon="pearl", title="PEARLS") %}

<b>Empiric treatment without imaging/endoscopy?</b>

While technically imaging or endoscopy is needed to formally diagnose CRS, if the clinical history is otherwise consistent empiric first-line treatments are often trialed for a few months first before those tests (unless you suspect AFRS or CRSwNP).

<br>

<b>Oral steroids for quick temporary relief</b>

You may see oral corticosteroids used up-front for severely symptomatic cases, but more commonly for CRSwNP and AFRS.
{% end %}

<div style="padding-top:1rem">
</div>

{% admonition(type="tip", icon="tip", title="How is treatment monitored?") %}
In an ideal world, with regular use of validated scores such as SNOT-22 or SNOT-20 (higher score = worse QoL; in some papers minimally significant difference ~9 to 12 points). However, it is not uncommon to see mainly gestalt and variable assessments of symptom control.
{% end %}

{% dropdown(header="SNOT-22 SCORE") %}

<div style = "height:60vh">
<embed src="/topic_assets/chronic_rhinosinusitis/SNOT22.pdf" width="100%" height="100%" />
</div>

{% end %}

#### CRSsNP specific treatment

- Trial first-line treatment. You may see the concept of “up-front intensive treatment”, where they get oral steroids + antibiotics to obtain good symptom control <span class="references">2</span>, though much weaker evidence compared to CRSwNP or AFRS
- Look for risk factors (ie immunodeficiency, CF) if refractory to treatment
- Surgery last line
- No biologics yet

{% dropdown(header="DEEP-DIVE: INCS sprays in CRSsNP") %}

<ul>
  <li>
    Bottom line: while recommended and common, evidence of benefit for INCS sprays in CRSsNP is actually unclear/sparse, though low-harm
  </li>
  <li>
    EPOS 2020 – symptom score benefit in CRS was lower than CRSwNP; only 5 RCTs with CRSsNP <span class="references">4</span>
  </li>
  <li>
    <i>Topical steroids for chronic rhinosinusitis without nasal polyps: A systematic review and meta-analysis</i> <span class="references">11</span>
    <ul>
      <li>Only 5 RCTs used sprays, but there was: 1) large variability on how symptoms and ‘response to treatment’ were assessed 2) No RoB was reported for each individual trial 3) relatively small overall sample size for outcomes such as symptom scores</li>
      <li>    Our opinion of this review: low quality of evidence (GRADE; unreported RoB, indirect/variable outcome assessment)</li>
    </ul>
  </li>
</ul>

{% end %}

#### CRSwNP specific treatment

<ul>
  <li>Trial first-line treatment + often a short course of oral steroids
    <ul>
      <li>Oral steroids = <strong>rapid temporary</strong> relief that fades by a few months <span class="references">12</span>; <strong>must consider significant S/E profile</strong>
        <ul>
          <li><em>ExRx: prednisone 30 mg OD x7d <span class="references">6</span>; note that there is no consensus/consistent dose between trials</em></li>
        </ul>
      </li>
    </ul>
  </li>

{% dropdown(header="DEEP-DIVE: INCS in CRSwNP") %}

<ul>
  <li><strong>Bottom-line:</strong> there is generally low quality evidence that INCS compared to placebo improves symptoms and QoL without significant side effects, though specifics vary by delivery system</li>
  <li><em>The Joint Task Force on Practice Parameters GRADE guidelines for the medical management of chronic rhinosinusitis with nasal polyposis</em><span class="references">13</span>
    <ul>
      <li>SNOT-22: rinses/EDS &gt; sprays</li>
      <li>Symptoms (nasal obstruction/smell esp): sprays/EDS &gt; rinses</li>
      <li>Need for rescue surgery: sprays/EDS &gt; rinses</li>
      <li>Note: sprays are cheap and widely available; EDS $$$$$</li>
    </ul>
  </li>
</ul>

{{ topics_crswnp_incs() }}
{% end %}

<li>At any point biologics can <em>technically</em> be considered, especially if high baseline severity or refractory to other medical therapy; greatest positive effect on QoL outcomes <span class="references">13</span>
    <ul>
      <li>Indications:
        <ul>
          <li>Status post endoscopic sinus surgery when evidence of bilateral nasal polyps</li>
          <li>PLUS ≥3 of:
            <ul>
              <li>Evidence of type 2 inflammation (eosinophilia or high IgE)</li>
              <li>Long term requirement for or contraindication to corticosteroids</li>
              <li>Significantly impaired quality of life</li>
              <li>Significant loss of smell</li>
              <li>Comorbid asthma</li>
            </ul>
          </li>
        </ul>
      </li>
    </ul>
  </li>

<li>Three options: dupilumab (≥12 yo), omalizumab (adults), mepolizumab (adults) [<strong>tezepelumab (Tezspire) is coming soon! Update TBD</strong>]
    <ul>
      <li>All overall have excellent side effect profile</li>
      <li>Cost/insurance prohibitive</li>
      <li>Unclear on: long-term side effects, duration of treatment, predictive patient factors for most benefit</li>
      <li><em>ExRx: Dupilumab 300mg SC q2w {% popup() %}

{{ medications_toml_load(meds=["template_med"])}}

{% end %}
. S/E profile similar to placebo but classically conjunctivitis, eosinophilia, injection site reactions</em></li>

</ul>

</li>

{% dropdown(header="DEEP-DIVE: Biologics in CRSwNP") %}

<ul>
  <li><strong>Bottom-line:</strong> moderate/high quality evidence supporting large effect sizes of biologics in addition to INCS, with minimal side effects compared to placebo. Dupilumab had the largest effect sizes across multiple outcomes</li>
  <li><em>The Joint Task Force on Practice Parameters GRADE guidelines for the medical management of chronic rhinosinusitis with nasal polyposis</em> <span class="references">13</span>
    <ul>
      <li>SNOT-22: dupilumab &gt; omalizumab &gt; mepolizumab &gt; benralizumab</li>
      <li>Symptoms: dupilumab &gt; omalizumab &gt; mepolizumab</li>
      <li>Smell: dupilumab &gt; mepolizumab &gt; omalizumab &gt; benralizumab</li>
      <li>Decrease in need for OCS: dupilumab &gt; mepolizumab &gt; benralizumab</li>
      <li>Decrease in need for surgery: dupilumab &gt; mepolizumab &gt; omalizumab</li>
    </ul>
  </li>
</ul>

{{ topics_crswnp_biologics() }}
{% end %}

<li>ASA desensitization for coexisting NERD
    <ul>
      <li>Anecdotally, less commonly used with biologics available; logistically also difficult</li>
      <li>Involves surprisingly high doses of ASA (i.e. 325 mg BID is maintenance!)</li>
      <li>Reference this practice parameter <span class="references">13</span> if you want to deep dive</li>
    </ul>
  </li>

<li>Leukotriene receptor antagonists (LTRA) in the setting of NERD
    <ul>
      <li>Note: generally <strong>recommended against</strong> for CRSwNP in EPOS 2020, noting poor quality evidence of benefit <span class="references">4</span></li>
      <li><em>ExRx: Montelukast 10mg PO OD (adult dose)</em>{% popup() %}

{{ medications_toml_load(meds=["template_med"])}}

{% end %}

</li>
    </ul>
  </li>
</ul>

#### AFRS specific treatment

- Initial treatment is usually a combination of first-line therapy, early diagnostic/therapeutic FESS, and course of oral steroids
  - Oral steroid course is longer than CRSwNP; reduces risk of recurrence but must balance with S/E profile of long term systemic steroids
  - _ExRx: prednisone 0.5mg/kg OD tapered over weeks to 10 mg OD, then slowly reduced to minimum effective dose_ <span class="references">2,7</span>
- Limited evidence for allergen/fungi immunotherapy (no RCTs), may be started a few weeks postoperatively
- Antifungals have NOT been shown to significantly modify clinical course / symptoms <span class="references">14</span>

#### Surgery / FESS

For CRSsNP and CRSwNP, FESS is considered if medical therapy has failed. Excellent symptomatic relief but with surgical risks.

- By itself, surgery does not cure CRS; recurrence can occur
- Post-surgery, it is important to maintain remission with ongoing medical therapy
- Revisions may be required after a few years; rates ~10-30% <span class="references">6</span>

## Factoids

- Oral decongestants with chronic use can lead to rhinitis medicamentosa and rebound nasal obstruction when stopped

## Quiz yourself:

{{ wip(body="This section remains a work in progress. If you want to help contribute, see below :)") }}

## Further reading:

{% references(showBib=true) %}
[
{
"id": "1",
"bib": "Orlandi RR, Kingdom TT, Smith TL, Bleier B, DeConde A, Luong AU, et al. International consensus statement on allergy and rhinology: rhinosinusitis 2021. Int Forum Allergy Rhinol. 2021 Mar;11(3):213–739",
"url": "https://pubmed.ncbi.nlm.nih.gov/33236525/",
"notes": ""
},
{
"id": "2",
"bib": "Hamilos DL. Chronic rhinosinusitis: Epidemiology and medical management. J Allergy Clin Immunol. 2011 Oct 1;128(4):693–707",
"url": "https://pubmed.ncbi.nlm.nih.gov/21890184/",
"notes": ""
},
{
"id": "3",
"bib": "Desrosiers M, Evans GA, Keith PK, Wright ED, Kaplan A, Bouchard J, et al. Canadian clinical practice guidelines for acute and chronic rhinosinusitis. Allergy Asthma Clin Immunol. 2011 Feb 10;7(1):2",
"url": "https://aacijournal.biomedcentral.com/articles/10.1186/1710-1492-7-2",
"notes": ""
},
{
"id": "4",
"bib": "Fokkens WJ, Lund VJ, Hopkins C, Hellings PW, Kern R, Reitsma S, et al. European Position Paper on Rhinosinusitis and Nasal Polyps 2020. Rhinology. 2020 Feb 20;58(Suppl S29):1–464",
"url": "https://pubmed.ncbi.nlm.nih.gov/32077450/",
"notes": ""
},
{
"id": "5",
"bib": "Rosenfeld RM, Piccirillo JF, Chandrasekhar SS, Brook I, Ashok Kumar K, Kramper M, et al. Clinical practice guideline (update): adult sinusitis. Otolaryngol--Head Neck Surg Off J Am Acad Otolaryngol-Head Neck Surg. 2015 Apr;152(2 Suppl):S1–39",
"url": "https://pubmed.ncbi.nlm.nih.gov/25832968/",
"notes": ""
},
{
"id": "6",
"bib": "Chin CJ, Scott JR, Lee JM. Diagnosis and management of chronic rhinosinusitis. CMAJ. 2025 Feb 18;197(6):E148–54",
"url": "https://www.cmaj.ca/content/197/6/E148",
"notes": ""
},
{
"id": "7",
"bib": "Lee G, Benjamin Prince, Yu J. ACAAI Review for the Allergy and Immunology Boards. 5th Edition. American College of Allergy, Asthma & Immunology; 2024",
"url": "https://education.acaai.org/brbook5",
"notes": ""
},
{
"id": "8",
"bib": "Grayson JW, Hopkins C, Mori E, Senior B, Harvey RJ. Contemporary Classification of Chronic Rhinosinusitis Beyond Polyps vs No Polyps: A Review. JAMA Otolaryngol Neck Surg. 2020 Sep 1;146(9):831–8",
"url": "https://pubmed.ncbi.nlm.nih.gov/32644117/",
"notes": ""
},
{
"id": "9",
"bib": "Chong LY, Head K, Hopkins C, Philpott C, Glew S, Scadding G, et al. Saline irrigation for chronic rhinosinusitis. Cochrane Database Syst Rev. 2016 Apr 26;2016(4):CD011995",
"url": "https://pubmed.ncbi.nlm.nih.gov/27115216/",
"notes": ""
},
{
"id": "10",
"bib": "Fowler J, Sowerby LJ. Using intranasal corticosteroids. CMAJ. 2021 Jan 11;193(2):E47–E47",
"url": "https://www.cmaj.ca/content/193/2/E47",
"notes": ""
},
{
"id": "11",
"bib": "Bhat AM, Heiland LD, Nguyen SA, Rathi VK, Schlosser RJ, Soler ZM. Topical steroids for chronic rhinosinusitis without nasal polyps: A systematic review and meta-analysis. Int Forum Allergy Rhinol. 2024;14(9):1477–87",
"url": "https://pubmed.ncbi.nlm.nih.gov/38787291/",
"notes": ""
},
{
"id": "12",
"bib": "Head K, Chong LY, Hopkins C, Philpott C, Burton MJ, Schilder AG. Short‐course oral steroids alone for chronic rhinosinusitis. Cochrane Database Syst Rev. 2016 Apr 26;2016(4):CD011991",
"url": "https://pubmed.ncbi.nlm.nih.gov/27113367/",
"notes": ""
},
{
"id": "13",
"bib": "Rank MA, Chu DK, Bognanni A, Oykhman P, Bernstein JA, Ellis AK, et al. The Joint Task Force on Practice Parameters GRADE guidelines for the medical management of chronic rhinosinusitis with nasal polyposis. J Allergy Clin Immunol. 2023 Feb 1;151(2):386–98",
"url": "https://www.jacionline.org/article/S0091-6749(22)01484-1/fulltext",
"notes": ""
},
{
"id": "14",
"bib": "Head K, Sharp S, Chong L, Hopkins C, Philpott C. Topical and systemic antifungal therapy for chronic rhinosinusitis. Cochrane Database Syst Rev. 2018 Sep 10;2018(9):CD012453",
"url": "https://pubmed.ncbi.nlm.nih.gov/30199594/",
"notes": ""
}
]
{% end %}

<script src="/js/tabs.js"></script>
<script src="/js/popup.js"></script>
