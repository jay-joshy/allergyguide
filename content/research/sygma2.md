+++
title = "As-Needed Budesonide–Formoterol versus Maintenance Budesonide in Mild Asthma: the SYGMA2 trial"
description = "Is PRN budesonide–formoterol non-inferior to maintenance budesonide in reducing severe asthma exacerbations for mild asthma?"
date = 2025-03-20
draft = false

[taxonomies]
tags = ["Research","Asthma"]
[extra]
keywords = "Asthma"
toc = true
authors = ["Joshua Yu"]
+++

{{wip(body="WIP. Pending: staff review.")}}

{{ research_card(paper="sygma2", show_title=true) }}

{% admonition(type="info", icon="info", title="Trial metadata") %}

- Published: 2018
- Journal: NEJM
- Funded by: AstraZeneca

{% end %}

## What's the clinical question?

In patients with mild asthma, is PRN budesonide-formoterol non-inferior to budesonide maintenance therapy in preventing severe asthma exacerbations?

**Why is this important?**

Adherence to regular controller steroid puffer therapy in mild asthma is poor, with underuse associated with severe asthma exacerbations. Would PRN steroid-LABA be a comparable treatment to a trial-controlled regular use of controller steroid puffer therapy?

## PICO

{% two_columns_fancy() %}

**Population**:

- **Inclusion Criteria**: Patients aged 12 years and older with a clinical diagnosis of mild asthma requiring GINA step 2 treatment. Their asthma must have been present for at least 6 months, and be either _uncontrolled on PRN SABA_ or _controlled on mono-maintenance low dose ICS or LTRA_

  - For PRN SABA: required pre-bronchodilator FEV1>=60% predicted with FEV1>=80% post-bronchodilator
  - For low dose ICS or LTRA: required FEV1>=80% pre-bronchodilator
  - Both required evidence of reversible airway obstruction within the past 12 months (defined as increase in FEV1>=12% **and** >=200ml after 1 mg Bricanyl Turbuhaler)
- **Relevant Exclusion Criteria**: Recent asthma worsening (within past 30 days) requiring treatment change (beyond short-acting bronchodilators) or systemic glucocorticoid use, current or former smokers with a history of 10 or more pack-years, and history of life-threatening asthma. Pregnancy, BB use of any kind, or recent use of biologic drug

<!-- split -->

**Intervention**:

- PRN Budesonide-formoterol (200 µg budesonide and 6 µg formoterol)

**Comparison**:

- Maintenance therapy with budesonide (200 µg) BID plus PRN terbutaline (0.5 mg)

**Outcome**:

- **Primary**: Annualized rate of severe asthma exacerbations (non-inferiority margin set at 1.2). A severe exacerbation requires any one of:

  - Use of systemic steroids for >=3 days, or
  - Inpatient hospitalization, or
  - ED visit due to asthma that required systemic steroids
- **Relevant Secondary**: Time to first severe exacerbation, ACQ-5 scores, AQLQ scores, percentage of reliever-free days, use of PRN reliever therapy, overall steroid use, pre-bronchodilator FEV1, and adverse events.

{% end %}

## Study Design

This study was a **double-blind, multicenter, parallel-group randomized controlled trial** conducted over **52 weeks** across **354 sites in 25 countries**.

{% text_image(src="/research/sygma2/study_design.png", alt="Figure S1, showing the study design", caption = "Figure S1 from the supplementary appendix.") %}

There was a **2 to 4 week run-in period** where patients used PRN terbutaline alone for symptom relief, before randomization. Randomization was stratified by study site, and computer generated.

Follow-up over 52 weeks was done through both scheduled in-person vists and phone contact.

{% end %}

### Outcome Assessment

#### Primary

- **Annualized rate of severe exacerbations** - identified during follow-up. Additional hospitalizations/systemic steroid use during a severe asthma exacerbation are not counted as a new event

#### Secondary

- **Spirometry**: very detailed criteria for reproducibility are provided in the protocol (ie. timing, model specs, positioning, etc.)
- **ACQ-5 and AQLQ**: self-administered during in-person follow-up visits
- **Puffer Usage (Turbuhaler/placebo)**: a battery powered electronic data logger used for ‘as needed’ and maintenance investigational product

### Statistical analysis

A negative binomial regression model was used for the rate of severe exacerbations, adjusting for treatment group, pretrial treatment, geographic region.

Time to the first severe exacerbation was analyzed using a **Cox proportional-hazards model** with the same adjustment factors. Changes in ACQ-5/AQLQ scores and FEV1 were analyzed using a **mixed model for repeated measures**. "No adjustments for multiple comparisons for secondary efficacy variables were made."

## Results

### Table 1

4215 patients were randomized, with 4176 included in the full analysis set (2089 in the budesonide-formoterol group and 2087 in the budesonide maintenance group). Overall the groups were well balanced, in particular with age, sex, region, and smoking status (mean age 41 years, ~60% female). Asthma characteristics were also well balanced (see below table). Notably, roughly half of the patients had a baseline ACQ-5 score of ≥1.5.

|                                                                       | PRN Budesonide-Formoterol (2089) | Budesonide Maintenance (2087) |
| --------------------------------------------------------------------: | :------------------------------: | :---------------------------: |
|                                   <div align="left">ACQ-5 score</div> |                                  |                               |
|                                                                  Mean |           1.49 ± 0.89            |         $1.53 ± 0.90          |
|                                        Score ≥1.5 - no./total no. (%) |         943/2043 (46.2)          |       1000/2037 (49.1)        |
|                          <div align="left"> FEV1 % of predicted</div> |                                  |                               |
|                                             Before bronchodilator use |           84.4 ± 13.9            |          84.1 ± 13.9          |
|                                              After bronchodilator use |           96.3 ± 13.8            |          96.0 ± 13.5          |
| <div align="left">No. of severe exacerbations in previous 12 mo</div> |                                  |                               |
|                                                                     0 |           1630 (78.0)            |          1627 (78.0)          |
|                                                                     1 |            365 (17.5)            |          362 (17.3)           |
|                                                                    ≥2 |             94 (4.5)             |           98 (4.7)            |

### Primary Outcome

{{ img(src="/research/sygma2/primary.png" alt="Primary outcome results", class="c1", caption = "Rate ratios for the annualized rate of severe asthma exacerbations. Solid line: non-inferiority margin; dashed line: superiority margin.") }}

PRN budesonide-formoterol was non-inferior to budesonide maintenance therapy for the annualized rate of severe asthma exacerbations, with rates of 0.11 (95% CI, 0.10 to 0.13) and 0.12 (95% CI, 0.10 to 0.14), respectively (RR 0.97; upper one-sided 95% confidence limit, 1.16). In total, 8.5% of the budesonide-formoterol group compared to 8.8% in the budesonide had a severe exacerbation, a non-significant difference.

|                                                                                                                   | PRN Budesonide-Formoterol (2089) | Budesonide Maintenance (2087) |
| ----------------------------------------------------------------------------------------------------------------: | :------------------------------: | :---------------------------: |
|                                                                <div align="left"> All severe exacerbations </div> |                                  |                               |
|                                                                                     Patients with ≥1 exacerbation |            177 (8.5)             |           184 (8.8)           |
|                                                                                        Total no. of exacerbations |               217                |              221              |
|                    <div align="left">Severe exacerbation leading to systemic glucocorticoid use for ≥3 days</div> |                                  |                               |
|                                                                                     Patients with ≥1 exacerbation |            171 (8.2)             |           173 (8.3)           |
|                                                                                        Total no. of exacerbations |               209                |              207              |
| <div align="left">Severe exacerbation leading to emergency department visit and systemic glucocorticoid use</div> |                                  |                               |
|                                                                                     Patients with ≥1 exacerbation |             25 (1.2)             |           36 (1.7)            |
|                                                                                        Total no. of exacerbations |                26                |              40               |
|                                            <div align="left">Severe exacerbation leading to hospitalization</div> |                                  |                               |
|                                                                                     Patients with ≥1 exacerbation |             17 (0.8)             |           17 (0.8)            |
|                                                                                        Total no. of exacerbations |                20                |              17               |

### Secondary Outcomes

{% text_image(src="/research/sygma2/time_to_ex.png", alt="Figure 1B, showing time to first severe exacerbation", caption = "Time to first exacerbation between treatment groups.") %}

#### Exacerbations

No significant difference was found between groups for time to first severe exacerbation. There was no significant difference in rate of exacerbations depending on pretrial treatment.

{% end %}

#### ACQ-5, AQLQ

{% admonition(type="warning", icon="info", title="What is the ACQ-5 score?") %}

5-question survey about average symptoms over the past week including: 1) night-time symptoms, 2) morning symptoms, 3) activity limitations, 4) SOB, 5) wheezing.

- Score <0.75 is well controlled; >1.5 is poorly controlled
- A change of 0.5 is considered the minimal clinically important difference

{% end %}

<br>

{% two_columns() %}

In both groups, the ACQ-5 and AQLQ score trended towards better control; while both analyses were not controlled for multiple comparisons, they both favoured the budesonide maintenance group.

However, the actual magnitude of change for both scores was relatively small:

- ACQ-5: the mean difference between budesonide maintenance and PRN Symbicort scores was 0.11 (95% CI, 0.07 to 0.15); at the end of 52 weeks, 40.3% vs. 44.3% had a decrease of ≥0.5 (OR 0.86; 95% CI, 0.75 to 0.99). If you took that 4% difference at face-value, the NNT to decrease the ACQ-5 score by 52 weeks would be 25
- AQLQ: the mean difference between budesonide maintenance and PRN Symbicort scores was -0.096 (95% CI, -0.137 to -0.054)

<!-- split -->

{{ img(src="/research/sygma2/acq5.png" alt="ACQ-5 trend over time", class="c1", caption = "Trend of ACQ-5 over 52 weeks from baseline. Minimal clinically important difference is 0.5.") }}
{{ img(src="/research/sygma2/aqlq.png" alt="AQLQ trend over time", class="c1", caption = "Trend of AQLQ over 52 weeks. Overall score is 1-7 inclusive; higher scores => better QOL.") }}

{% end %}

{% two_columns() %}

<!-- split -->

{% end %}

#### Spirometry (FEV1)

#### Steroid use

Patients in the budesonide-formoterol group had a significantly lower median daily dose of inhaled glucocorticoid (66 µg) compared to the budesonide maintenance group (267 µg).

#### Adherence

#### Use of PRN medications

#### Adverse Events

Adverse events were similar between groups, with one death in each group—one deemed asthma-related in the budesonide maintenance group and the other not related to asthma in the budesonide-formoterol group.

## Limitations
