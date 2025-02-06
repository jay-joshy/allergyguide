+++
title = "Shortcodes"
description = "Testing of shortcodes"
date = 2024-11-24
draft = false
in_search_index = false

[extra]
toc = true
+++

See below for markdown syntax used for the custom shortcodes used in this website.

## remote_text

```md
{{ remote_text(src="https://raw.githubusercontent.com/jay-joshy/allergyguide/refs/heads/main/TODO.md") }}
```

## Custom boxes

### important

```md
{% raw() %}
{% important(header = "important header") %}
test
Press <kbd>CTRL+ALT+Delete</kbd> to end the

You can't put another shortcode inside here sadly...
I think you probably can but it's difficult...
{% end %}
{% end %}
```

{% important(header = "important header") %}
test
Press <kbd>CTRL+ALT+Delete</kbd> to end the

You can't put another shortcode inside here sadly...
I think you probably can but it's difficult...
{% end %}

### warning

```md
{% raw() %}
{% warning(header = "warning header") %}
This is a warning section.
{% end %}
{% end %}
```

{% warning(header = "warning header") %}
This is a warning section.
{% end %}

### question

```md
{% raw() %}
{% question(question= "this is the question. now lets make it very long to the point where it probably needs to wrap around because its so large and fat and i hope this doesn't look bad") %}
This is the question answer
{% end %}
{% end %}
```

{% question(question= "this is the question. now lets make it very long to the point where it probably needs to wrap around because its so large and fat and i hope this doesn't look bad") %}
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

## text_image_to_right

Of note; you cannot nest a shortcode easily within a shortcode. Ie. I could not use {{ shortcode }} within the text image to right text.

```md
{% raw() %}
{{ text_image_to_right(text="# Here is some text on the left.</br><kbd>CTRL+ALT+Delete</kbd>", src="/images/example.jpg", alt="An image description", caption = "test caption") }}
{% end %}
```

{{ text_image_to_right(text="# Here is some text on the left.</br><kbd>CTRL+ALT+Delete</kbd>", src="/images/example.jpg", alt="An image description", caption = "test caption") }}

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

## contributors

```md
{% raw() %}
{{ contributors(authors=["Alice Smith", "Bob Johnson"], editors=["Charlie Brown"], staff_reviewers=["David Lee"]) }}
{% end %}
```

{{ contributors(authors=["Alice Smith", "Bob Johnson"], editors=["Charlie Brown"], staff_reviewers=["David Lee"]) }}

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

## load_macro

```md
{% raw() %}
{{ load_macro(topic_name = "_xample_topic") }}
{% end %}
```

{{ load_macro(topic_name = "_xample_topic") }}

## medications_toml_load

```md
{% raw() %}
{{ medications_toml_load()}}
{% end %}
```

{{ medications_toml_load()}}

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

{{ wip() }}
