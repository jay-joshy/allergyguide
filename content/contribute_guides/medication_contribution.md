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
categories = ["2G antihistamine"]
brand_names = ["Blexten"]
cost = [{ province = "ON", price = "~$1.1 CAD / 20mg tab" }]
coverage = [
  { province = "ON", details = "enter details" },
  { province = "BC", details = "enter details" },
]
otc = "no"
moa = "2nd generation H1 receptor antagonist."
half_life = "~15 hours"
routes = "PO tab, liquid (uncommon)"
doses = [
  { indication = "CSU, AR", dose = "20mg PO OD to QID", notes = "adult dosing" },
  { indication = "CSU, AR", dose = "10mg PO OD to QID", notes = "pediatric dosing" },
]
pearls = [
  "Theoretically does not cross BBB; less sedating than other AHs",
  "Take without food or juice otherwise absorption impaired",
]
age_group = "≥12 years old; used off-label in younger ages"
pregnancy = "Avoid (not enough data)"
contraindications = "Hypersensitivity, QT prolongation or history of torsades"
side_effects.common = "QT prolongation; drowsiness (4%); headache (4%). For reference, drowisness/headache had a 2% incidence rate in placebo arm"
side_effects.severe = "Torsades (very rare)"
monograph_links = ["/monographs/bilastine_2021_1.pdf"]
```

Here is an example template:

```toml
[template_med]
categories = ["testcategory", "testA", "testB"]
brand_names = ["brandnameA", "brandnameB"]
cost = [
  { province = "ON", price = "~$X CAD / Ymg tab" },
  { province = "BC", price = "~$X CAD / Ymg tab" },
]
coverage = [
  { province = "ON", details = "enter details" },
  { province = "BC", details = "enter details" },
]
otc = "yes"
moa = "Insert MoA"
half_life = "~X hours"
peak_action = "Optional to add this in"
routes = "oral tab, liquid, ODT"
doses = [
  { indication = "diseaseA", dose = "Zmg OD", notes = "adult" },
  { indication = "diseaseA", dose = "Zmg OD", notes = "adult, CrCl < 30" },
  { indication = "diseaseB", dose = "Zmg BID", notes = "pediatric (ages X-Y)" },
]
pearls = ["Insert pearl here"]
age_group = "insert age group"
pregnancy = "insert information, can link to data"
contraindications = "insert"
side_effects.common = "insert"
side_effects.severe = "insert"
monograph_links = ["/monographs/example_2025_1.pdf"]
```

- The editors will deal with the categories section
- Monographs will be statically hosted and linked. Include a link for the monograph in your draft file so it can be uploaded to the site (**it should come from a government site**!!)
  - Filenames should be formatted as: genericname_2016_1, where the year is of the last revision and the last number is if there are multiple monographs that year for that drug

How it'll actually look:

{{ medications_toml_load(meds=["bilastine"])}}

<script src="/js/popup.js"></script>
