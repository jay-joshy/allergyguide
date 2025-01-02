+++
title = "Testing the templating"
description = "description of md page"
date = 2024-12-10T15:00:00Z
draft = false
template = "topic_macros.html"

[taxonomies]
tags = ["Research","Something","Images"]
[extra]
keywords = "Image, Markdown, Shortcodes, Swap"
toc = true
authors = ["test", "test2"]
+++

In the template itself the below line is included.
However, it does not work when used in the .md file.

Tis is the content
Macros don't work here
{% import "macros.html" as m %}
{{ m::input(label="TKEJAL:KSJDALSKJF", type="text") }}
