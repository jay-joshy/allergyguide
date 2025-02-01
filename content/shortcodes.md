+++
title = "Shortcodes"
description = "Testing of shortcodes"
date = 2024-11-24
draft = false
in_search_index = false

[extra]
toc = true
+++

<kbd><kbd><kbd>This is a demonstration of the possible shortcodes that can be used. Review shortcodes.md to see how each shortcode is used within the .md documents.</kbd></kbd></kbd>

## kbd

Press <kbd>CTRL+ALT+Delete</kbd> to end the

## text_image_to_right

{{ text_image_to_right(text="# Here is some text on the left.</br><kbd>CTRL+ALT+Delete</kbd>", src="/images/example.jpg", alt="An image description", caption = "test caption") }}

Of note; you cannot nest a shortcode easily within a shortcode. Ie. I could not use the important {{}} shortcode within the text image to right text.

## widget_penfast

{{ widget_penfast() }}

## Custom boxes

### important

{% important(header = "important header") %}
test
Press <kbd>CTRL+ALT+Delete</kbd> to end the

You can't put another shortcode inside here sadly...
I think you probably can but it's difficult...
{% end %}

### warning

{% warning(header = "warning header") %}
This is a warning section.
{% end %}

### question

{% question(question= "this is the question. now lets make it very long to the point where it probably needs to wrap around because its so large and fat and i hope this doesn't look bad") %}
This is the question answer
{% end %}

### important_box_only

{% important_box_only() %}
important bx only!!!
{% end %}

### warning_box_only

{% warning_box_only() %}
warning box only content
{% end %}

## test_toml_load

{{ test_toml_load(section_name = "label_1") }}

## wide_contact_card

{{ wide_contact_card(title="example title", text = "test text", src="/images/example.jpg", url="/research/") }}

## contact_card_gallery

{{ card_grid() }}

## profile_grid

{{profile_grid()}}

## load_macro

{{ load_macro(topic_name = "_xample_topic") }}

## medications_toml_load

{{ medications_toml_load()}}

## two_columns

{% two_columns() %}
Left column text goes here.

### Markdown should be supported

<!-- split -->

Right column text goes here.
{% end %}

## two_columns_fancy

{% two_columns_fancy() %}
Left column text goes here.

### Markdown should be supported

<!-- split -->

Right column text goes here.
{% end %}

## contributors

{{ contributors(authors=["Alice Smith", "Bob Johnson"], editors=["Charlie Brown"], staff_reviewers=["David Lee"]) }}

## mermaid

this should only work with templates of page or pages.html

{% mermaid() %}
graph TD
A[Enter Chart Definition] --> B(Preview)
B --> C{decide}
C --> D[Keep]
C --> E[Edit Definition]
E --> B
D --> F[Save Image and Code]
F --> B
{% end %}

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
