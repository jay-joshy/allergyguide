+++
title = "Research critical appraisal contribution guide"
date = 2025-03-17
draft = false

[extra]
toc = true
authors = ["Joshua Yu"]
+++
<br>
<br>

{% admonition(type="tip", icon="tip", title="Appraisal structure") %}
Critical appraisal of primary or secondary literature will have two major sections:

1. A quick and concise need-to-know summary
2. A more detailed breakdown of the paper

{% end %}

# Quick facts

This section should not be longer than half a page at most. It is meant as a quick glance-over refresher about what the take-home points were.

- What is the main clinical question?
- What is the study type?
- What is the population?
- What was the intervention? The therapeutic, diagnostic, or other intervention under investigation (e.g. the experimental intervention, or in observational studies the exposure factor)
- What was the comparison/control (if available)?
- What was the outcome?
- What is the bottom line?
- Study quality (GRADE for reviews, ROB/Newcastle-Ottawa Scale)

### Example

From the [SYGMA2 trial](https://www.nejm.org/doi/full/10.1056/NEJMoa1715275) (primary evidence):

{% json_to_table(show_headers=false) %}
[
{
"Category": "Main Clinical Question",
"Details": "Is PRN budesonide–formoterol noninferior to daily maintenance budesonide therapy in reducing severe asthma exacerbations for mild asthma?"
},
{
"Category": "Study type",
"Details": "52 week double-blind, randomized, multi-center, phase 3, non-inferiority trial"
},
{
"Category": "Population",
"Details": "Patients with mild persistent asthma (≥12 years), including those with previously controlled and uncontrolled symptoms on minimal therapy."
},
{
"Category": "Intervention",
"Details": "Twice-daily placebo + PRN budesonide–formoterol (200μg/6μg)."
},
{
"Category": "Comparison/Control",
"Details": "Regular BID budesonide (200μg) + as-needed terbutaline (0.5mg)."
},
{
"Category": "Outcome",
"Details": "At 52 weeks, the PRN budesonide–formoterol group had an annualized rate of severe exacerbations of 0.11 events per patient-year compared to 0.12 events per patient-year in the maintenance budesonide group (rate ratio, 0.97; upper one-sided 95% CI, 1.16; noninferiority met). ACQ-5 score improved by 0.35 in the as-needed group versus 0.46 in the maintenance group (difference, 0.11 units; 95% CI, 0.07 to 0.15; p<0.001). Median daily inhaled glucocorticoid exposure in the as-needed group was 66μg vs. 267μg in the maintenance group."
},
{
"Category": "Bottom Line",
"Details": "For mild asthma, PRN budesonide–formoterol was noninferior to daily budesonide in preventing severe exacerbations, with a non-clinically relevant difference in ACQ-5 and less overall steroid exposure."
},
{
"Category": "Study quality",
"Details": "To be done"
}
]
{%end%}

# The more detailed review

- Metadata
  - Title
  - Year
  - Journal
  - Trial name
- Figures -- will be hosted statically
- Description
  - Background
  - Objective
  - Methods
  - Results
  - Limitations
  - Conclusion
- Study quality

# Study quality

### ROB-2 -- for primary evidence

[link](https://methods.cochrane.org/risk-bias-2)

### GRADE -- for secondary evidence

[link](https://gdt.gradepro.org/app/handbook/handbook.html)
