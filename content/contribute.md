+++
title = "Contributing to allergyguide.ca"
description = "How the sausage is made"
draft = false
date = "2025-01-31"
in_search_index = false
updated = "2025-03-17"
[extra]
toc = true
authors = ["Joshua Yu"]
+++

Thanks for checking us out! If you're interested in clinical allergy and immunology and would like to help out, connect with us (see the mail button at the bottom of the page).

## Contribution process

After exploring what options exist on the [contribution hub](https://docs.google.com/spreadsheets/d/1tm2AntOqbr0d6mDEJ-A_TqVjwmLKI67KboSagkZ9Au0/edit?usp=sharing):

{{ img(src="/images/hub.png" class="ci" alt="Picture of the google sheets hub for topic/medication/research availability" link="https://docs.google.com/spreadsheets/d/1tm2AntOqbr0d6mDEJ-A_TqVjwmLKI67KboSagkZ9Au0/edit?usp=sharing") }}
<br>
Contribution follows this rough timeline:

{% timeline() %}
[{
"title":"Prerequisites",
"body":"Pick a new or available topic [from the list](https://docs.google.com/spreadsheets/d/1tm2AntOqbr0d6mDEJ-A_TqVjwmLKI67KboSagkZ9Au0/edit?usp=sharing). Connect with an editor. Determine potential staff reviewer(s).",
"date":"Step 1"
},
{
"title":"Drafting",
"body":"Timeline 2 weeks for initial draft. See the contribution guides for [macros and topics](@/contribute_guides/topic_contribution.md), [medications](@/contribute_guides/medication_contribution.md), and [critical appraisal of research](@/contribute_guides/research_contribution.md).",
"date":"Step 2"
},
{
"title":"Review and edits",
"body":"Editor and Contributor collaborate on initial edits. Once the editor and contributor are happy, the edited draft is sent for staff review.",
"date":"Step 3"
},
{
"title":"Publish",
"body":"An editor with coding know-how will create the final formatted page for final review by the primary author(s) and staff.",
"date":"Step 4"
}]
{% end %}

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

## Website / coding

If you have experience with programming (reasonably comfortable with Markdown, html, js, scss/css, and git) and want to contribute, very happy to have you on board! To learn the structure of the website, please refer to the [Zola documentation](https://www.getzola.org/). Pages are written in Markdown with [Tera templating](https://keats.github.io/tera/).

Josh will be the main person approving pull requests for the time being.
Re: adding content to website -- there are some formatting nuances, and a myriad of [shortcodes](/shortcodes) that can be used.

## ROADMAP and TODO!:

```md
{{ remote_text(src="https://raw.githubusercontent.com/jay-joshy/allergyguide/refs/heads/main/TODO.md") }}
```
