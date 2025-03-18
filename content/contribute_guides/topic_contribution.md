+++
title = "Topic contribution guide"
date = 2025-03-17
draft = false

[extra]
toc = true
authors = ["Joshua Yu"]
+++

See here for an example of a semi-finished topic page: [Chronic rhinosinusitis](/topics/hypersensitivity/airway_ent/chronic-rhinosinusitis/).

Not all topics will fit this general structure, and it is meant as a general scaffold. Pearls, tips, pitfalls, etc. should be intermixed throughout the topic -- ideally, the page is not just a solid mass of bullet points.

## Topic structure

{% two_columns() %}

- Macro to c/p (see [here](/contribute#macros) for guide on writing macros)
- Summary:
  - Condition name, epidemiology, pathophysiology, manifestations, diagnosis, management.
- Definitions:
  - Things to know up front before reading the article
  - Abbreviations
- Presentation
  - Clinical: (history and exam)
  - Lab/imaging findings:
- Diagnosis:
  - Criteria / approach
  - Differentials

<!-- split -->

- Investigations:
- Management:
  - Usual:
  - Special circumstances:
- Natural history / prognosis:
- Patient resources:
- Quiz yourself:
- Further Reading:
  - clinical guidelines
  - other sources
- Authors:
  - Primary: list
  - Reviewers: list
  - Editor: list

{% end %}

{% admonition(type="danger", icon="info", title="Don't just use plain-text") %}
Within a topic page, there are many ways to customize the text: in particular, **Markdown** and **Shortcodes**.

{% end %}

## Markdown

- See [this link](https://www.writethedocs.org/guide/writing/markdown/) for a great introduction to the Markdown format
- For your purposes, **you do not have to know Markdown itself very well** -- it is more important you know that the website renders Markdown. This means that you are able to use _italics_, **bolded words**, ~~strike-through-text~~, and links such as the one before. Lists and bullet points will also render as you expect. Different title headers can be achieved with [# signs](https://www.writethedocs.org/guide/writing/markdown/#headers)
- You can also make tables in Markdown, though they do not look the best and cannot be too complicated:

  | Name   | Comment                                                                 |
  | :----- | :---------------------------------------------------------------------- |
  | Alice  | Always involved in various communications                               |
  | Bob    | A good guy, who likes to communicate with Alice                         |
  | Malroy | Not so nice guy. Tries to mess with the communication of Alice and Bob. |

## Shortcodes

- Shortcodes are custom pieces of styled HTML (and sometimes javascript). You can use any of the shortcodes below as you like for a topic
- Each can serve a different purpose, and helps break up plain-text into more manageable sections
- You don't have to know how to implement them -- one of the editors who knows how to code will do it for you. Just indicate in your draft document what shortcode you want, and the information you need in it. If you're interested in the actual code, [check out the GitHub](https://github.com/jay-joshy/allergyguide/tree/main/templates/shortcodes)

#### Admonitions

Admonitions are boxes that are intended to **highlight an important fact for the reader**. There are a variety of styles and icons that can be used. Options for type/icon: note, tip, info, warning, danger, and pearl. These can be mixed and matched. The title of each admonition can be changed to any text.

{% admonition(type="danger", icon="danger", title="DANGER") %}
This is a danger admonition with a danger icon, and the title DANGER.
{% end %}

{% admonition(type="warning", icon="warning", title="WARNING") %}
This is a warning admonition with a warning icon, and the title WARNING.
{% end %}

{% admonition(type="info", icon="info", title="INFO") %}
And so forth.
{% end %}

{% admonition(type="tip", icon="tip", title="TIP") %}
And so forth.

{% end %}

{% admonition(type="note", icon="note", title="NOTE") %}
And so forth.

{% end %}

{% admonition(type="pearl", icon="pearl", title="PEARL") %}
And so forth.

{% end %}

{% admonition(type="note", icon="question", title="MIXUP") %}
This is a note admonition with a question icon and the title MIXUP.

{% end %}

#### Question

Insert questions with hidden answers. Click the blurred section to reveal it.

{% question(question="A 27 year old female presents to clinic with complaints of frequent infections. She has had 3 episodes of pneumonia confirmed by XR over the past 3 years as well as 2 episodes of sinusitis requiring a short course of antibiotics. She has no relevant family history and no symptoms of asthma or SOB. **What is the most appropriate test to consider?**<br><br>a) Serum immunoglobulins<br>b) Blood cultures") %}
Serum immunoglobulins is the correct answer. CVID is the most likely diagnosis from the stem, and it requires...
{% end %}

#### text_image

Sometimes you want to show an image and text to one side of it. You have two options:

{% text_image(src="/images/example.jpg", alt="An image description", caption = "test caption") %}
_Here is some text_ on the left.
{% end %}

{% text_image(text_position = "right", src="/images/example.jpg", alt="An image description", caption = "test caption") %}
_Here is some text_ on the right.
{% end %}

#### two_columns

Sometimes you want two columns to place text in.

{% two_columns() %}
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum

<!-- split -->

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum
{% end %}

#### references

References are embeddable! All you need to do it prepare references like you normally do with a bibliography in AHA style, and the editor will implement the rest. For example:

This sentence needs two references <span class="references">1,2</span>. Here is another sentence with one reference <span class="references">3</span>.

... rest of document

{% references(showBib = true) %}
[{
"id": "1",
"aha_bib": "Netting MJ, Campbell DE, Koplin JJ, et al. An Australian Consensus on Infant Feeding Guidelines to Prevent Food Allergy: Outcomes From the Australian Infant Feeding Summit. Journal of Allergy and Clinical Immunology: In Practice. 2017;5(6):1617-1624. doi:10.1016/j.jaip.2017.03.013",
"url": "https://pubmed.ncbi.nlm.nih.gov/28499774/",
"notes": ""
}, {
"id": "2",
"aha_bib": "Khan DA, Banerji A, Blumenthal KG, et al. Drug allergy: A 2022 practice parameter update. Journal of Allergy and Clinical Immunology. 2022;150(6):1333-1393. doi:10.1016/j.jaci.2022.08.028",
"url": "https://www.jacionline.org/article/S0091-6749(22)01186-1/fulltext",
"notes": "This study was good!"
}, {
"id": "3",
"aha_bib": "Another reference here with its own details.",
"url": "https://example.com",
"notes": ""
}]
{% end %}

#### custom_macro

You can create custom copy-paste macros if you need to.

{% custom_macro() %}
Here is a custom macro copy paste section
{% end %}

#### load_macro

You can also load any macros from the offical macro 'repo' [here](https://github.com/jay-joshy/allergyguide/blob/main/static/toml/topic_macros.toml)

{{ load_macro(topic_name = "chronic_rhinosinusitis") }}

#### contributors

A small cut-out for contributors. This may be removed in the future.

{{ contributors(authors=["Alice Smith", "Bob Johnson"], editors=["Charlie Brown"], staff_reviewers=["David Lee"]) }}

#### timeline

{% timeline() %}
[{
"title":"Lorem Ipsum Event",
"body":"Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
"date":"Jul-2023"
},
{
"title":"Lorem Ipsum event 2",
"body":"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged.",
"date":"Jun-2022"
}]
{% end %}

#### mermaid

mermaid diagrams are interesting to use but not mandatory. If you want to explore and use these, check out their [documentation](https://mermaid.js.org/intro/).

```md
{% raw() %}
{% mermaid() %}
sequenceDiagram
Alice ->> Bob: Hello Bob, how are you?
Bob-->>John: How about you John?
Bob--x Alice: I am good thanks!
Bob-x John: I am good thanks!
Note right of John: Bob thinks a long<br/>long time, so long<br/>that the text does<br/>not fit on a row.

    Bob-->Alice: Checking with John...
    Alice->John: Yes... John, how are you?

{% end %}
{% end %}
```

{% mermaid() %}
sequenceDiagram
Alice ->> Bob: Hello Bob, how are you?
Bob-->>John: How about you John?
Bob--x Alice: I am good thanks!
Bob-x John: I am good thanks!
Note right of John: Bob thinks a long<br/>long time, so long<br/>that the text does<br/>not fit on a row.

    Bob-->Alice: Checking with John...
    Alice->John: Yes... John, how are you?

{% end %}

Other examples of mermaid charts (taken from their docs):

{% mermaid() %}
gantt
dateFormat YYYY-MM-DD
title Adding GANTT diagram functionality to mermaid
excludes weekends
%% (`excludes` accepts specific dates in YYYY-MM-DD format, days of the week ("sunday") or "weekends", but not the word "weekdays".)

    section A section
    Completed task            :done,    des1, 2014-01-06,2014-01-08
    Active task               :active,  des2, 2014-01-09, 3d
    Future task               :         des3, after des2, 5d
    Future task2              :         des4, after des3, 5d

    section Critical tasks
    Completed task in the critical line :crit, done, 2014-01-06,24h
    Implement parser and jison          :crit, done, after des1, 2d
    Create tests for parser             :crit, active, 3d
    Future task in critical line        :crit, 5d
    Create tests for renderer           :2d
    Add to mermaid                      :until isadded
    Functionality added                 :milestone, isadded, 2014-01-25, 0d

    section Documentation
    Describe gantt syntax               :active, a1, after des1, 3d
    Add gantt diagram to demo page      :after a1  , 20h
    Add another diagram to demo page    :doc1, after a1  , 48h

    section Last section
    Describe gantt syntax               :after doc1, 3d
    Add gantt diagram to demo page      :20h
    Add another diagram to demo page    :48h

{% end %}
