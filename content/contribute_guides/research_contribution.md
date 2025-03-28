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
2. A more detailed breakdown of the paper and assessment of quality of the evidence

{% end %}

# Quick facts

This section should not be longer than half a page at most. It is meant as a **quick glance-over refresher** about what the take-home points were.

{% two_columns() %}

- What is the main clinical question?
- What is the study type?
- What is the population?
- What was the intervention? The therapeutic, diagnostic, or other intervention under investigation (e.g. the experimental intervention, or in observational studies the exposure factor)

<!-- split -->

- What was the comparison/control (if available)?
- What was the outcome?
- What is the bottom line?
- Study quality (GRADE for reviews, ROB/Newcastle-Ottawa Scale)

{% end %}

### Example

From the [SYGMA2 trial](https://www.nejm.org/doi/full/10.1056/NEJMoa1715275) (primary evidence):

{{ research_card(paper="sygma2", show_title=false) }}

# The more detailed review

{% two_columns() %}

- Metadata
  - Title
  - Year
  - Journal
  - Trial name
- Background
- Objective
- Methods

<!-- split -->

- Results
- Figures -- will be hosted statically
- Limitations
- Conclusion
- Study quality

- Authors:
  - Primary: list
  - Reviewers: list
  - Editor: list

{% end %}

# Study quality

### ROB-2 -- for primary evidence

See [here](https://methods.cochrane.org/risk-bias-2) for the original tool, and [here](/tools/rob-2/) for easier to navigate tool that we built.

### GRADE -- for secondary evidence

[link](https://book.gradepro.org/)
