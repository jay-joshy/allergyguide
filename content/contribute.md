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

Thanks for checking us out! If you're interested in clinical allergy and immunology and would like to help out, connect with us (see the mail button at the bottom of the page).

## TODO:

```md
{{ remote_text(src="https://raw.githubusercontent.com/jay-joshy/allergyguide/refs/heads/main/TODO.md") }}
```

## Contribution process

### Content

Prerequisites: A) there are staff available to proofread drafts for topic sections B) there is an editor who can take charge over the 'section' C) We have a google drive "Resident Contributor Dashboard" (i.e. showing available topics and who’s working on what) to organize our efforts

1. Resident or fellow picks a topic they wish to do, and connect with editor for that 'section' (to be defined later)
2. Timeline is set for 1st rough draft (~ 2 weeks?)

- These drafts can be done through Google Docs drive somewhere for ease of use. While technically it can be done through markdown and version controlled through git, this lowers to barrier to entry.

3. Editor and contributor back and forth initial edits
4. Edited draft is sent to staff, necessary edits are made
5. Editor / Josh / someone with some coding knowledge will add content into website

### Website / coding

Prerequisites: you are reasonably comfortable with markdown, html, js, scss/css, and git. To learn the structure of the website, please refer to the [Zola documentation](https://www.getzola.org/). Pages are written in markdown with [Tera templating](https://keats.github.io/tera/).
Josh will be the main person approving pull requests for the time being.
Re: adding content to website -- there are some formatting nuances, and a myriad of [shortcodes](/shortcodes) that can be used.

## Stylistic Principles

{% important(header = "General writing guidelines") %}

- Be concise and clear -- the intended use is for residents
- Use clear, structured formatting (headings, bullet points, tables) for readability
- Avoid passive voice where possible
- Abbreviations are fine but must be defined
- While a single topic might be quite complex (i.e. asthma), each page is still meant to be relatively simple -- the goal is **not** to be a comprehensive textbook. Link to a resource that goes more in depth at that juncture, or to another subpage.

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

Not all topics will fit this general structure; this is meant as a general scaffold. Pearls, tips, pitfalls, etc. should be intermixed throughout the topic -- ideally, the page is not just a solid mass of bullet points. See [here for some styling options](#styling-options-available) you could use. If you're comfortable with .html/.md, see [shortcodes](/shortcodes) for the full suite of options available.

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
  - clinical guidelines
  - other sources
- Authors:
  - Primary: list
  - Reviewers: list
  - Editor: list

##### Styling options available

Insert admonitions or callouts to draw attention to key facts.

{% admonition(type="danger", icon="danger", title="DANGER") %}
This is a _danger_ section.
{% end %}
<br>
{% admonition(type="warning", icon="warning", title="WARNING") %}
This is a _warning_ section.
{% end %}
<br>
{% admonition(type="info", icon="info", title="INFO") %}
This is an _info_ section.
{% end %}
<br>
{% admonition(type="tip", icon="tip", title="TIP") %}
Tips
{% end %}
<br>
{% admonition(type="note", icon="note", title="NOTE") %}
Note
{% end %}
<br>
{% admonition(type="note", icon="question", title="question icon") %}
Question
{% end %}
<br>
{% admonition(type="pearl", icon="pearl", title="PEARL") %}
Sage clinical pearl
{% end %}

Add images. You can either have them take up the full width, or push them to the side (left or right):
{% text_image(src="/images/peanut_meme.png", alt="An image description", caption = "example caption") %}
_Here is some text_ on the left.

And here is some more text!

Here is **some BOLDED text**
{% end %}

You can also add tables in markdown:

| Name   | Comment                                                                 |
| :----- | :---------------------------------------------------------------------- |
| Alice  | Always involved in various communications                               |
| Bob    | A good guy, who likes to communicate with Alice                         |
| Malroy | Not so nice guy. Tries to mess with the communication of Alice and Bob. |

#### Medications

- categories include: antihistamines, inhalers, nasal sprays, topicals, steroids, DMARDs, biologics, eye-drops
- monographs will be statically hosted and linked. Filenames formatted as: genericname_2016_1, where the year is of the last revision and the last number is if there are multiple monographs that year for that drug
- see the medications.toml file for more detail

Example:

```toml
[bilastine]
categories = ["2G antihistamine"]
brand_names = ["Blexten"]
cost = [{ province = "ON", price = "~$1 CAD / 20mg tab" }]
moa = "2nd generation H1 antagonist."
half_life = "~15 hours"
routes = "PO tab, liquid (uncommon)"
doses = [
  { indication = "CSU, AR", dose = "20mg PO OD to QID", notes = "adult dosing" },
  { indication = "CSU, AR", dose = "10mg PO OD to QID", notes = "pediatric dosing" },
]
pearls = ["Theoretically does not cross BBB"]
age_group = ">=12 years of age; has been used off-label in younger children"
pregnancy = "Avoid (not enough data)"
contraindications = "Hypersensitivity, QT prolongation or history of torsades"
side_effects.common = "QT prolongation; drowsiness (4%); headache (4%). For reference, drowisness/headache had a 2% incidence rate in placebo arm"
side_effects.severe = "Torsades (very rare)"
monograph_links = ["../monographs/bilastine_2021_1.pdf"]
```

How it'll actually look:
{{ medications_toml_load(meds=["bilastine"])}}

#### Research appraisals

Systematic review vs primary evidence

- Metadata
  - Title
  - Year
  - Journal
  - Trial name
- PICO + Conclusion
- Figures -- will be hosted statically
- Description
  - Background
  - Objective
  - Methods
  - Results
  - Limitations
  - Conclusion
