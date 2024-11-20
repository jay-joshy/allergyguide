+++
title = "test research title"
description = "description of md page"
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

# Test page

This is some test of the site.
{{ text_image_to_right(text="# Here is some text on the left.", src="/research/example.jpg", alt="An image description", caption = "test caption") }}

{{ widget_penfast() }}

{% important(header = "important header") %}
This is an important section.
{% end %}

{% warning(header = "warning header") %}
This is a warning section.
{% end %}

{% question(question= "this is the question") %}
This is the question answer
{% end %}

This is the jsonload thing:
{{ macro(section_name = "label") }}

# testing macros.html

You cannot use macros within the .md file. It needs to be part of the templates.
