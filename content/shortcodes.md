+++
title = "Shortcodes"
description = "Testing of shortcodes"
date = 2024-11-24
updated = 2025-02-07
draft = false
in_search_index = false

[extra]
toc = true
+++

See below for markdown syntax used for the custom shortcodes used in this website.

## Re: nesting shortcodes

The below code does not work:

```md
{% raw() %}
{% warning(header = "warning header") %}
{{ warning_box_only(body="# nested warning!") }}
{% end %}
{% end %}
```

It will instead throw this error:

```zsh
Error: Reason: Failed to render 'shortcodes/warning.html'
Error: Reason: Filter call 'markdown' failed
Error: Reason: Failed to render markdown filter: Failed to render warning_box_only shortcode

Caused by:
    0: Failed to render 'shortcodes/warning_box_only.html'
    1: Filter 'markdown' not found
```

Calling {{/* warning_box_only(body="nested warning!") */}} is essentially asking to inject html in place of the shortcode. However, if you look at warning_box_only.html:

```html
<blockquote class="warning_box_only">
  <div class="content">
    {{ body | markdown | safe }}
  </div>
</blockquote>
```

it is expecting the body to be MARKDOWN, not HTML. If you remove the markdown filter from warning_box_only.html, then it will work -- but the markdown within the warning_box_only will not be rendered properly.

## Custom boxes

### important

```md
{% raw() %}
{% important(header = "important header") %}
test
Press <kbd>CTRL+ALT+Delete</kbd> to end the

So it turns out you CAN put shortcodes inside other shortcodes, but it cannot be the % % with a body type.
{{ contributors(authors=["Alice Smith", "Bob Johnson"], editors=["Charlie Brown"], staff_reviewers=["David Lee"]) }}
{% end %}
{% end %}
```

{% important(header = "important header") %}
test
Press <kbd>CTRL+ALT+Delete</kbd> to end the

So it turns out you CAN put shortcodes inside other shortcodes, but it cannot be the % % with a body type.
{{ contributors(authors=["Alice Smith", "Bob Johnson"], editors=["Charlie Brown"], staff_reviewers=["David Lee"]) }}
{% end %}

### warning

```md
{% raw() %}
{% warning(header = "warning header") %}
This is a warning section.

Here is an attempt at the % % nested shortcode.
{% important_box_only() %}
important bx only!!!
{% end %}
{% end %}

{% end %}
```

{% warning(header = "warning header") %}
This is a warning section.

Here is an attempt at the % % nested shortcode.
{% important_box_only() %}
important bx only!!!
{% end %}
{% end %}

### question

```md
{% raw() %}
{% question(question= "this is the question. now lets make it very long to the point where it probably needs to wrap around because its so large and fat and i hope this doesn't look bad.<br><br>1) this or that<br>2)this") %}
This is the question answer
{% end %}
{% end %}
```

{% question(question= "this is the question. now lets make it very long to the point where it probably needs to wrap around because its so large and fat and i hope this doesn't look bad.<br><br>1) this or that<br>2)this") %}
This is the question answer
{% end %}

### important_box_only

```md
{% raw() %}
{% important_box_only() %}
important bx only!!!
{% end %}
{% end %}
```

{% important_box_only() %}
important bx only!!!
{% end %}

### warning_box_only

```md
{% raw() %}
{% warning_box_only() %}
warning box only content
{% end %}
{% end %}
```

{% warning_box_only() %}
warning box only content
{% end %}

## admonition

Credit to [tabi](https://welpo.github.io/tabi/blog/shortcodes/#admonitions) for the styling. It's more pleasant colour scheme wise and it changes with the light/dark mode.
Options for type/icon: note, tip, info, warning, danger, pearl, question (only the icon)

These can be mixed and matched.

```md
{% raw() %}
{% admonition(type="danger", icon="danger", title="Warning DANGER") %}
This is a danger admonition with a danger icon.

**Markdown can be used here :)**
{% end %}
{% end %}
```

{% admonition(type="danger", icon="danger", title="DANGER") %}
This is a danger admonition with a danger icon.

**Markdown can be used here :)**
{% end %}

{% admonition(type="warning", icon="warning", title="WARNING") %}
Blah blah here is a wall of text wall of text Blah blah here is a wall of text wall of text Blah blah here is a wall of text wall of text Blah blah here is a wall of text wall of text
{% end %}

{% admonition(type="info", icon="info", title="INFO") %}
BLah blah
{% end %}

{% admonition(type="tip", icon="tip", title="TIP") %}
Blah blah
{% end %}

{% admonition(type="note", icon="note", title="NOTE") %}
blah blah
{% end %}

{% admonition(type="note", icon="question", title="question icon") %}
blah blah
{% end %}
We also have the elusive pearl mode:

```md
{% raw() %}
{% admonition(type="pearl", icon="pearl", title="PEARL") %}
Insert sage clinical pearl
{% end %}
{% end %}
```

{% admonition(type="pearl", icon="pearl", title="PEARL") %}
Insert sage clinical pearl
{% end %}

## text_image

Of note; you cannot nest a shortcode easily within a shortcode. Ie. I could not use {{ shortcode }} within the text image to right text.

```md
{% raw() %}
{% text_image(src="/images/example.jpg", alt="An image description", caption = "test caption") %}
_Here is some text_ on the left.</br><kbd>CTRL+ALT+Delete</kbd>
{% end %}
{% end %}
```

{% text_image(src="/images/example.jpg", alt="An image description", caption = "test caption") %}
_Here is some text_ on the left.</br><kbd>CTRL+ALT+Delete</kbd>
{% end %}

```md
{% raw() %}
{% text_image(text_position = "right", src="/images/example.jpg", alt="An image description", caption = "test caption") %}
_Here is some text_ on the right.</br><kbd>CTRL+ALT+Delete</kbd>
{% end %}
{% end %}
```

{% text_image(text_position = "right", src="/images/example.jpg", alt="An image description", caption = "test caption") %}
_Here is some text_ on the right.</br><kbd>CTRL+ALT+Delete</kbd>
{% end %}

## two_columns

```md
{% raw() %}
{% two_columns() %}
Left column text goes here.

### Markdown should be supported

<!-- split -->

Right column text goes here.
{% end %}
{% end %}
```

{% two_columns() %}
Left column text goes here.

### Markdown should be supported

<!-- split -->

Right column text goes here.
{% end %}

## two_columns_fancy

```md
{% raw() %}
{% two_columns_fancy() %}
Left column text goes here.

### Markdown should be supported

<!-- split -->

Right column text goes here.
{% end %}
{% end %}
```

{% two_columns_fancy() %}
Left column text goes here.

### Markdown should be supported

<!-- split -->

Right column text goes here.
{% end %}

## spoiler

```md
{% raw() %}
this is a spoiler that you can click: {{ spoiler(body="text to hide", fixed_blur=false) }}
{% end %}
```

this is a spoiler that you can click: {{ spoiler(body="text to hide", fixed_blur=false) }}

You can also use it like so (fixed_blur = true means you can't see it ever):

```md
{% raw() %}
{% spoiler(fixed_blur = true) %}
testing this
{% end %}
{% end %}
```

{% spoiler(fixed_blur = true) %}
testing this
{% end %}

## contributors

```md
{% raw() %}
{{ contributors(authors=["Alice Smith", "Bob Johnson"], editors=["Charlie Brown"], staff_reviewers=["David Lee"]) }}
{% end %}
```

{{ contributors(authors=["Alice Smith", "Bob Johnson"], editors=["Charlie Brown"], staff_reviewers=["David Lee"]) }}

## timeline

Adapted from the excellent pico theme.

```md
{% raw() %}
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
{% end %}
```

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

## mermaid

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

## widget_penfast

```md
{% raw() %}
{{ widget_penfast() }}
{% end %}
```

{{ widget_penfast() }}

## wide_contact_card

```md
{% raw() %}
{{ wide_contact_card(title="example title", text = "test text", src="/images/example.jpg", url="/research/") }}
{% end %}
```

{{ wide_contact_card(title="example title", text = "test text", src="/images/example.jpg", url="/research/") }}

## contact_card_gallery

```md
{% raw() %}
{{ card_grid() }}
{% end %}
```

{{ card_grid() }}

## profile_grid

```md
{% raw() %}
{{profile_grid()}}
{% end %}
```

{{profile_grid()}}

## custom_macro

```md
{% raw() %}
{% custom_macro() %}
Here is a custom macro copy paste section
{% end %}
{% end %}
```

{% custom_macro() %}
Here is a custom macro copy paste section
{% end %}

## load_macro

```md
{% raw() %}
{{ load_macro(topic_name = "chronic_rhinosinusitis") }}
{% end %}
```

{{ load_macro(topic_name = "chronic_rhinosinusitis") }}

## medications_toml_load

param: meds (list of str)
if not provided default will show all medications from the toml

```md
{% raw() %}
{{ medications_toml_load(meds=["bilastine"])}}
{% end %}
```

{{ medications_toml_load(meds=["bilastine"])}}

## example_colormode

{% example_colormode() %}
This is a test
{% end %}

## kbd

```md
<kbd><kbd><kbd>This is a demonstration of the possible shortcodes that can be used. Review shortcodes.md to see how each shortcode is used within the .md documents.</kbd></kbd></kbd>
```

<kbd><kbd><kbd>This is a demonstration of the possible shortcodes that can be used. Review shortcodes.md to see how each shortcode is used within the .md documents.</kbd></kbd></kbd>

## test_toml_load

```md
{% raw() %}
{{ test_toml_load(section_name = "label_1") }}
{% end %}
```

{{ test_toml_load(section_name = "label_1") }}

## wip

```md
{% raw() %}
{{ wip() }}
{% end %}
```

{{ wip() }}

## remote_text

```md
{% raw() %}
{{ remote_text(src="https://raw.githubusercontent.com/jay-joshy/allergyguide/refs/heads/main/TODO.md") }}
{% end %}
```

```md
{{ remote_text(src="https://raw.githubusercontent.com/jay-joshy/allergyguide/refs/heads/main/TODO.md") }}
```

# example

proof of concept that 1) you can load in simple arrays and 2) use tera macros

```md
{{/* example(a = ["test1", "test2"], n = 10) */}}
```

{{ example(a = ["test1", "test2"], n = 10) }}

# references

```md
{% raw() %}
This sentence needs two references <span class="references">1,2,3,1,1,1</span> and some of this

Here is another sentence with one reference <span class="references">2</span>

... rest of the document content

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
{% end %}
```

This sentence needs two references <span class="references">1,2,3,1,1,1</span> and some of this

Here is another sentence with one reference <span class="references">2</span>

... rest of the document content

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

## mobile_warning

{{ mobile_warning() }}

## json_to_table

{% json_to_table()%}
[
{ "name": "Bob", "age": 21, "isCool": false },
{ "name": "Sarah", "age": 22, "isCool": true },
{ "name": "Lee", "age": 23, "isCool": true }
]
{% end %}
