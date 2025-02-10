Content:

- Make example articles for 1) a condition (ie. penicillin allergy) 2) macro 3) research
- Pediatric medicine crash course
- port original pen-fast questions over with extra options
- add non-ige mediated mast cell degranulation section (with specific sections with things like IV iron, NAC, alcohol, opioids, etc)
- sections for pdfs for not only patient handouts but how to use inhalers, etc.
- Billing tips (would have to be province specific -- VERY fellow focused and low priority)

Organizational:

- fully flesh out contribution process
- set up example google drive
- opinion from staff -- UBC, Western, McMaster?
- other resident / fellow support / thoughts?

Shortcodes:

- consolidate and make dark/light themes for your boxes, particularly the question box (which does not look good on mobile)
- shortcode for references. It will accept as a parameter a json with the following format:

```json
[{
"id":"numbers 1 -> ...",
"aha_bib":"insert aha style bib for this reference",
"url":"str"
"notes":"str"
},
{
  etc.
}
]
```

For example:

```json
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
}]
```

- The shortcode will be placed at the bottom of the doc, input will be the JSON; shortcode will reference the JS. It will look for elements of the references class within the md page such as:

```md
... rest of the document
this is a sentence that needs two references <div class = refrences>1,3</div>
here is another sentence with only one reference <div class = refrences>2</div>
... rest of the document content

{% references() %}
[{
"id":"numbers 1 -> ...",
"aha_bib":"insert aha style bib for this reference",
"url":"str"
"notes":"str"
},
{
etc.
}
]
{% end %}
```

- in place of the elements of the references class, it will render an icon (which lives within static/icon/important.svg). If you click on the icon, it will create a well formatted modern pop-up that will have display the references (aha_bib and notes if they exist), with a clickable link. If there are many references the popup box will be able to scroll.
- the shortcode should have error handling; for example, if there are duplicate ids within the JSON it should throw an error (ie. {{ throw(message="etc etc etc") }})

Other stylistic:

- fix / make custom banner.png for the site
- Decide on design of home page
- Add author pictures to about
