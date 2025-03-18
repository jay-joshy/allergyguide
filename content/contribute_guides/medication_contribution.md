+++
title = "Medication Card contribution guide"
date = 2025-03-17
draft = false

[extra]
toc = true
authors = ["Joshua Yu"]
+++

Medications can be found in this [page here](/medications/). The goal is to provide cards that are succinct and relevant, not a deep dive -- the user can look at the monograph if they want for more detail.

As such, there's a relatively standardized format for medications. See this example:

```toml
[bilastine]
categories = ["2G antihistamine"]
brand_names = ["Blexten"]
cost = [{ province = "ON", price = "~$1.1 CAD / 20mg tab" }]
moa = "2nd generation H1 receptor antagonist."
half_life = "~15 hours"
routes = "PO tab, liquid (uncommon)"
doses = [
  { indication = "CSU, AR", dose = "20mg PO OD to QID", notes = "adult dosing" },
  { indication = "CSU, AR", dose = "10mg PO OD to QID", notes = "pediatric dosing" },
]
pearls = ["Theoretically does not cross BBB"]
age_group = ">=12 years of age; has been used off-label in younger children"
pregnancy = "Avoid (not enough data)"
contraindications = "Hypersensitivity, QT prolongation or history of torsades"
side_effects.common = "QT prolongation; drowsiness (4%); headache (4%). For reference, drowisness/headache had a 2% incidence rate in placebo arm"
side_effects.severe = "Torsades (very rare)"
monograph_links = ["/monographs/bilastine_2021_1.pdf"]
```

- Categories include: antihistamines, inhalers, nasal sprays, topicals, steroids, DMARDs, biologics, eye-drops ... and probably more in the future
- Monographs will be statically hosted and linked. Include a link for the monograph in your draft file so it can be uploaded to the site. Filenames should be formatted as: genericname_2016_1, where the year is of the last revision and the last number is if there are multiple monographs that year for that drug

How it'll actually look:
{{ medications_toml_load(meds=["bilastine"])}}
