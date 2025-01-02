+++
title = "testing_macros"
description = "page to test macros and others"
date = 2024-11-10T15:00:00Z
draft = false

[taxonomies]
tags = ["Research","Something","Images"]
[extra]
keywords = "Image, Markdown, Shortcodes, Swap"
toc = true
series = "Research"
authors = ["test", "test2"]
+++

## text_image_to_right

{ { text_image_to_right(text="# Here is some text on the left.", src="/research/example.jpg", alt="An image description", caption = "test caption") }}

{{ text_image_to_right(text="# Here is some text on the left.", src="/research/example.jpg", alt="An image description", caption = "test caption") }}

## widget_penfast

{ { widget_penfast() }}
{{ widget_penfast() }}

## Custom boxes

### important

{ % important(header = "important header") %}
This is an important section.
{% end %}

{% important(header = "important header") %}
This is an important section.
{% end %}

### warning

{ % warning(header = "warning header") %}
This is a warning section.
{% end %}

{% warning(header = "warning header") %}
This is a warning section.
{% end %}

### question

{ % question(question= "this is the question") %}
This is the question answer
{% end %}

{% question(question= "this is the question") %}
This is the question answer
{% end %}

### test_toml_load

{ { test_toml_load(section_name = "label_1") }}
{{ test_toml_load(section_name = "label_1") }}
