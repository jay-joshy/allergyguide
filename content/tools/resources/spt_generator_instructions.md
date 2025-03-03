+++
title = "SPT / IDT generator instructions"
date = 2025-03-01
draft = false

[extra]
keywords = "SPT, Skin prick test, intradermal test"
toc = true
authors = ["Joshua Yu"]
+++

## Purpose

This tool is meant to simplify and speed up documentation for SPT or IDT.

If you're only doing a few skin tests and not a panel, _it's probably faster to not use this tool_, and just do it manually within your EMR.

{% admonition(type="info", icon="info", title="Features") %}

1. Quick-search of allergens (see [list](/js/spt_generator_constants.js)) with smart autosuggestion
2. Quick entry of wheal diameter
3. Ability to add an optional note for each entry
4. Template buttons for pre-defined mix-and-match panels
5. Well-formatted copy-paste macros in multiple different formats, sorted by allergen category
6. Entry only requires the keyboard, no mouse required

<br>
NOTE: this tool assumes that wheal sizes >=3mm are positive.
{% end %}

#### Example output:

{% custom_macro() %}
---- Mar 3, 2025 ----
Skin testing was positive for cashew (22mm), peanut (14mm -- podocyte), pistachio (21mm).
Otherwise, almond, brazil nut, hazelnut, macadamia, pecan, pine nut, apple, apricot, banana, cherry, grape, grapefruit, kiwi, lemon, mango, orange, peach, pear, pineapple, plum, strawberry, watermelon were negative.
Positive control (6mm), Negative control (2mm).
{% end %}

## Instructions

1. When the tool web-page is loaded, you are automatically focused on the allergen search bar

2. As you type, a drop-down menu will appear with suggestions:

   a) You can cycle through the suggestions with <kbd><kbd>TAB</kbd></kbd> and <kbd><kbd>SHIFT-TAB</kbd></kbd> (or the up and down arrow keys), and press <kbd><kbd>ENTER</kbd></kbd> to select that allergen

   b) Alternatively, **_you don't have to use the autosuggestions or dropdown menu at all_**. If you type something out in full (or type in a custom allergen) and press <kbd><kbd>ENTER</kbd></kbd>, that allergen will be selected as well

3. Once the allergen is selected, you will be automatically focused on the diameter input. From there:

   a) You can press <kbd><kbd>ENTER</kbd></kbd> and submit the entry without a diameter, OR

   b) Type in the diameter (only 1 number allowed) before submitting the entry with <kbd><kbd>ENTER</kbd></kbd>

4. All submitted entries are available for either deletion with the Red X button, or manual modification.

{% admonition(type="tip", icon="tip", title="Save time with templates") %}
In addition to the above, you can insert templates using the buttons at the top; these enter in a panel of entries without any pre-populated diameters or notes.

These can be mixed and matched, and used multiple times (though you risk duplication).
<br>
<br>
Custom templates are not a feature at this time (? coming in the future).
{% end %}
