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

{ { text_image_to_right(text="# Here is some text on the left.", src="/images/example.jpg", alt="An image description", caption = "test caption") }}

{{ text_image_to_right(text="# Here is some text on the left.", src="/images/example.jpg", alt="An image description", caption = "test caption") }}

## widget_penfast

{ { widget_penfast() }}
{{ widget_penfast() }}

## Custom boxes

### important

{ % important(header = "important header") %}
test
{% end %}

{% important(header = "important header") %}
test
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

{ { test_toml_load(section_name = "label_1") }}
{{ test_toml_load(section_name = "label_1") }}

## wide_contact_card

{{ wide_contact_card(title="example title", text = "test text", src="/images/example.jpg", url="/research/") }}

## contact_card_gallery

{{ card_grid() }}

## profile_grid

{{profile_grid()}}

## load_macro

{{ load_macro(topic_name = "example_topic") }}
