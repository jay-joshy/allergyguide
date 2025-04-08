+++
template = "pages.html"
title = "Macros"
draft = false
in_search_index = false
+++

{{ topic_macros_toml_load(filter=true) }}

## Josh's corner

{% custom_macro() %}
ENDOCRINOLOGY CONSULTATION

We assessed this patient in the endocrinology clinic today on {current_date} with Dr. Nadira Husein.
Demographic:
RFR:

PAST MEDICAL HISTORY:

RELEVANT MEDICATIONS:

FAMILY HISTORY:

SOCIAL HISTORY:

HISTORY OF PRESENTING ILLNESS:

PHYSICAL EXAM:

On physical examination, they were not in distress.

INVESTIGATIONS:

IMPRESSION:

Recommendations:

FOLLOW-UP:
We have not arranged any follow-up at this time, but they are welcome to contact us as required.
We have arranged for follow-up in:

Thank you for allowing us to take part in this patient's care. Please feel free to contact us if there are any questions or concerns.

Sincerely,

Joshua Yu R3 IM
On behalf of Dr. Nadira Husein

CC:
{% end %}

<br>

{% custom_macro() %}
ENDOCRINOLOGY FOLLOW-UP

Dr. Nadira Husein and I saw this patient in follow up in the endocrinology clinic on {current_date}. They were last seen:

Their last assessment and plan was:

RELEVANT MEDICAL HISTORY:

CURRENT MEDICATIONS:

INTERVAL HISTORY:

Otherwise:

PHYSICAL EXAM:

INVESTIGATIONS:

ASSESSMENT:

Recommendations:

FOLLOW-UP:
We have not arranged any follow-up at this time, but they are welcome to contact us as required.
We have arranged for follow-up in:

Thank you once again for involving us in this patient's care. Please do not hesitate to contact us if you have any further questions or concerns.

Sincerely,

Joshua Yu R3 IM
On behalf of Dr. Nadira Husein
{% end %}
