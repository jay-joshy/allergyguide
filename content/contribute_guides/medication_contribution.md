+++
title = "Medication Card contribution guide"
date = 2025-03-17
draft = false

[extra]
toc = true
authors = ["Joshua Yu"]
+++

- Medications can be found in this [page here](/medications/) and are also accessible through popups {% popup() %}

{{ medications_toml_load(meds=["bilastine"])}}

{% end %}

- The goal is to provide cards that are succinct and relevant, not a deep dive -- the user can look at the monograph if needed for more detail
- As such, there's a relatively standardized format for medications. See this example:

```toml
[bilastine]
draft = false
categories = ["2G antihistamine"]
brand_names = ["Blexten"]
cost = [{ province = "ON", price = "~$1.1 CAD / 20mg tab" }]
coverage = [{ province = "ON", details = "ODB" }]
otc = "no"
moa = "2nd generation H1 receptor antagonist"
half_life = "~15 hours"
peak_action = "~1h, rapid absorption"
routes = "10/20mg PO tab, 2.5mg/ml liquid (uncommon)"
doses = [
  { indication = "CSU, AR", dose = "20mg PO OD to QID", notes = "≥12 years old" },
  { indication = "CSU, AR", dose = "10mg PO OD to QID", notes = "4-11 years old" },
]
pearls = [
  "Theoretically does not cross BBB; less sedating than other AHs",
  "No renal adjustments needed; minimal data with hepatic impairment but not expected to cause issues",
  "Going beyond OD is technically off-label",
  "Take without food or juice otherwise absorption impaired",
]
age_group = "≥4 years old"
pregnancy = "Avoid (not enough data)"
contraindications = "Hypersensitivity, QT prolongation or history of torsades"
side_effects.common = "QT prolongation (at 100mg ODx4, max mean increase 6ms); drowsiness (4%); headache (4%). For reference, drowisness/headache had a 2% incidence rate in placebo arm"
side_effects.severe = "Torsades (very rare)"
monograph_links = ["/monographs/bilastine_2021_1.pdf"]
abbreviations = "CSU-chronic spontaneous urticaria; AR-allergic rhinitis"
```

Here is an example template:

```toml
# [medname] must be formatted as {generic (hyphenate if combination)} with {_route} if dramatically different from oral.
# for example: [budesonide_inhaler] because the oral form is used for EoE.
# similarly, [fluticasone-furoate_inhaler] - note the hyphenation used between the drug combos.
[template_med]
draft = false # if false, the medication card will be rendered with a WIP sign
categories = ["testcategory"] # check with the editors for the proper category
brand_names = ["brandnameA", "brandnameB"]
cost = [
  { province = "ON", price = "~$X CAD / Ymg tab" },
  { province = "BC", price = "~$X CAD / Ymg tab" },
]
coverage = [
  { province = "ON", details = "enter details" }, # ie. ODB
  { province = "BC", details = "enter details" },
]
otc = "yes" # only 'yes' or 'no' allowed
moa = "Insert MoA"
half_life = "~X hours"
peak_action = "Optional to add this in" # how long it takes for the medication to have its intended or maximal effect
routes = "oral tab, liquid, ODT"
doses = [
  { indication = "diseaseA", dose = "Zmg OD", notes = "adult" },
  { indication = "diseaseA", dose = "Zmg OD", notes = "adult, CrCl < 30" },
  { indication = "diseaseB", dose = "Zmg BID", notes = "pediatric (ages X-Y)" },
]
pearls = [
  "Insert pearl here",
] # each separate element in the array is a bullet point
age_group = "insert age group"
pregnancy = "insert information, can link to data" # link with HTML
contraindications = "insert"
side_effects.common = "insert"
side_effects.severe = "insert"
monograph_links = ["/monographs/example_2025_1.pdf"]
abbreviations = ""
```

- The editors will deal with the categories section
- Monographs will be statically hosted and linked. Include a link for the monograph in your draft file so it can be uploaded to the site (**it should come from a government site**!!)
  - Filenames should be formatted as: genericname_2016_1, where the year is of the last revision and the last number is if there are multiple monographs that year for that drug

How it'll actually look:

{{ medications_toml_load(meds=["bilastine"])}}

<script src="/js/popup.js"></script>
