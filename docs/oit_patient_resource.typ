#import "@preview/cetz:0.4.2"
#import "@preview/cetz-plot:0.1.3": chart, plot

// --- DOCUMENT SETUP ---
#set page(
  paper: "us-letter",
  margin: (x: 0.75in, y: 0.75in),
  numbering: "— 1 —",
  footer: context {
    if counter(page).get().first() in (1, 2) {
      align(right)[GENERAL INFORMATION - #counter(page).display("1")]
    } else if counter(page).get().first() in (3, 4) {
      // Display nothing on the first page
      align(right)[EQUIPMENT - #counter(page).display("1")]
    } else {
      [#counter(page).display("— 1 —")]
    }
  },
)
#set text(font: "Arial", size: 11pt, lang: "en")
#set par(justify: true, leading: 0.65em)
#set heading(numbering: "1.1.")

// --- CUSTOM STYLES ---
#let warning-box(title, body) = {
  block(
    fill: luma(240),
    stroke: (left: 4pt + black),
    inset: 12pt,
    radius: 4pt,
    width: 100%,
    [*#title* \ #body],
  )
}

#let check-box = box(
  stroke: 1pt + black,
  width: 10pt,
  height: 10pt,
  radius: 2pt,
  inset: 0pt,
  baseline: 2pt,
)

// --- TITLE ---
#align(center)[
  #text(size: 24pt, weight: "bold")[Oral Immunotherapy (OIT)]\
  #v(0.1pt)
  #text(size: 14pt, style: "italic")[Patient & Family Guide]
  \
  #line(length: 100%, stroke: 2pt)
]

= What is OIT?
#v(5pt)
OIT is a medical treatment for food allergies that helps patients gradually gain tolerance to the allergen. By slowly giving tiny amounts of the allergen and then slowly increasing the dose over time, the body gradually becomes used to the allergen. _Eventually over ~2 years, the body becomes trained to tolerate doses of the allergen it previously could not_.

*OIT has two main phases:*

1. *Phase 1: Build-up.* Starting with a _tiny_ daily dose, every 2-4 weeks we slowly increase the dose until we reach a maintenance dose (usually a bit less than a serving size). This takes 6 - 12 months.
2. *Phase 2: Maintenance.* Once you reach the maintenance dose, it will be eaten daily for 12 months.

// --- CETZ DIAGRAM: OIT PHASES ---
// https://www.csaci.ca/wp-content/uploads/2020/02/Key-concepts-teaching-tool.pdf
#figure(
  cetz.canvas({
    import cetz.draw: *

    // Setup the plot area
    plot.plot(
      size: (15, 6),
      x-tick-step: none,
      y-tick-step: none,
      axis-style: "school-book",
      {
        // The Build-up Phase (Sloping up)
        plot.add(
          (
            (0, 0),
            (0.5, 0.25),
            (1, 0.5),
            (1.5, 0.75),
            (2, 1),
            (2.5, 1.25),
            (3, 1.5),
            (3.5, 1.75),
            (4, 2),
            (4.5, 2.5),
            (5, 3),
            (5.5, 3.5),
            (6, 4),
          ),
          style: (stroke: (thickness: 2pt, dash: "solid")),
          line: "hv",
        )

        // The Maintenance Phase (Flat line)
        plot.add(
          ((6, 4), (14, 4)),
          style: (stroke: (thickness: 2pt)),
        )
      },
    )

    // Annotations for clarity
    line((6.5, 0), (6.5, 6.5), stroke: (dash: "dashed", paint: gray))
    content((3, 4), box(
      fill: white,
      inset: 2pt,
    )[*Build-up Phase* \ (Slowly increasing)])
    content((12.2, 5), box(
      fill: white,
      inset: 2pt,
    )[*Maintenance Phase* \ (Daily steady dose)])

    // Axis Labels
    content((7.5, -0.5), [*Time*])
    content((-0.5, 3.5), [*Daily dose of food*], angle: 90deg)
  }),
)

= What are the possible outcomes?
#v(5pt)

There are three main outcomes with OIT:

1. *Full Freedom (Tolerance):* you can eat a full serving of the food (like a whole glass of milk or a peanut butter sandwich) without reaction. Around 80%

2. *Safety (Bite-proof):* While you may still react if you eat a full serving, you can tolerate smaller amounts. This protects you from severe reactions if you accidentally eat the food. ~18%

3. *Stopping:* Sometimes, OIT becomes difficult due to taste aversion, is too time consuming for patients and families, or side effects, and we have to stop. This is rare. ~2%

#warning-box("Important Safety Note:")[
  *Remember:* Even after you finish the maintenance phase, if the food is not regularly consumed at least weekly to help the body 'remember' the food is not harmful, the allergy may return.
]

#pagebreak()

= Is OIT right for the patient?
#v(5pt)
#table(
  columns: (1fr, 1fr),
  inset: 10pt,
  align: top + left,
  stroke: none,
  table.header([*Who is a GOOD candidate?*], [*Who might NOT be?*]),
  table.hline(stroke: 1pt),
  [
    - *Confirmed food allergy:* convincing history of reaction with either positive skin test or IgE blood test

    - *Young children:* Infants and preschoolers (under age 6) have immune systems that more easily 'unlearn' allergies.They are also much less likely to have severe reactions during OIT than older children (imagine \<1% versus 14%).

    - *Ability to be consistent:* Able to eat a dose every single day at around the same time. the family must be willing, able, and ready to recognize and treat allergic reactions, including using self-injectable epinephrine properly and in a timely manner
  ],
  [
    - *Uncontrolled Asthma:* Your asthma must be well-managed before starting.

    - *Severe active Eczema:* Severe eczema can make it hard to tell when an allergic reaction is happening.

    - *Older patients:* > age of 6, more likely to have anaphylaxis, less likely to adhere

    - *Inability to obtain required equipment, language barriers*

    - *Inconsistent schedule:* If you travel constantly or cannot stick to a daily routine.

  ],
)

= Benefits vs. Risks

#table(
  columns: (1fr, 1fr),
  inset: 10pt,
  align: top + left,
  stroke: none,
  table.header([*Benefits (The Good)*], [*Risks (The Bad)*]),
  table.hline(stroke: 1pt),
  [
    - *Diet:* At the best outcome, the patient could eat a full serving size without reacting

    - *Safety:* Much lower risk of a scary reaction from accidental bites.

    - *Anxiety:* Less fear when going to restaurants or school: both for the patient and families.
  ],
  [
    - *EoE:* Around 3% (probably lower in toddlers): if it occurs we consider stopping OIT and involving our Gastroenterology specialists. (not sure if cause or association since EoE is more common in those with food allergies in general; in some select cases we elect to continue)

    - *Reactions:* Mild reactions (itchy mouth, mild hives) *are common and expected, especially during the build-up phase*. Severe reactions are rare especially in pre-schoolers but possible.
  ],
)

#place(bottom)[
  #warning-box(
    "Strict Food Avoidance Is Not “Risk Free” either:",
  )[
    Even with strict avoidance, accidental allergic reactions are possible (the author of this handout had two reactions to nuts in the past 5 years).
  ]
  #v(2pt)
]

#pagebreak()

= TOC

- Getting ready: equipment and how to use it

- Giving doses: checklist, how to give, when to increase

- What to expect from the first few weeks

- Troubleshooting

  - What to do when my child has a reaction

  - Sickness

  - Missed doses

  - Child dislikes taste

  - Other

- When to contact us

- Q and A for common questions

#pagebreak()

#align(center)[
  #text(size: 24pt, weight: "bold")[Getting Ready: Equipment]\
  #v(0.1pt)
  #text(
    size: 14pt,
    style: "italic",
  )[You need the right tools to measure small amounts of food and water safely.]
  \
  #line(length: 100%, stroke: 2pt)
]

== 1 ml Syringes
You need *1 mL disposable oral syringes* (no needles).
- Look for markings every *0.1 mL*.
- *Cleaning:* If used for liquid food (like milk), wash with hot soapy water and air dry. If used only for water, just air dry.
- *Examples:* BD eclipse 1mL oral syringes or Terumo 1mL oral tuberculin syringes (available on amazon.ca or local pharmacies)

== Digital Scale
- *Precision:* Must measure *0.01 grams* (two decimal places).
- *Calibration:* Buy one that comes with a calibration weight (a little metal weight to test the scale).
- *Cost:* Usually \$20 - \$30 online.

== Medicines
- *Epinephrine Auto-injector:* Must be up to date and nearby at each dose.
- *Non-drowsy antihistamine:* Optional but highly recommended. These can be bought over the counter.
  - Example: Reactine. For children under 2, give half of the smallest indicated dosage on the bottle. This usually is 2.5-5mg
  - Avoid Benadryl

= Measuring

== Measuring Solids (Powders, crushed food, thick liquids)
1. Turn on the scale.
2. Place a small cup/bowel or wax paper on the scale.
3. Press the *"Tare"* or "Zero" button so the scale reads `0.00`.
4. Slowly add the powder until you reach the target number.
5. Mix the powder with a wet food your child likes (applesauce, pudding, yogurt).

== Measuring Liquids (water, milks, etc.)
1. Push the plunger of the syringe all the way down.
2. Put the tip into the liquid.
3. Pull back slowly to the line matching your dose. If you pull too fast, too much air can enter the syringe.
4. Check for air bubbles. Flick the syringe to remove them.

#warning-box("Money Saving Tip")[
  *Non-dairy milks spoil fast*. You can freeze them!
  1. Pour liquid into an ice cube tray.
  2. Once frozen, store cubes in a ziploc bag.
  3. Thaw one cube at a time in the fridge to use for doses. Do not reuse the milk once thawed.
]

== Making dilutions
- for some foods you need to dilute to get the right dose. Show example of table

#table(
  // Define column widths. The mix column gets more space (2fr).
  columns: (auto, auto, auto, 2fr, auto, auto),

  // Align the columns: mostly centered, but the instructions are left-aligned
  align: (col, row) => (
    (center, center, center, left, center, center).at(col) + horizon
  ),

  // Add padding inside cells
  inset: 12pt,

  // Remove default stroke (borders)
  stroke: none,

  // Add the light gray background to the header row only
  fill: (col, row) => if row == 0 { rgb("e6e6e6") } else { none },

  // Header row
  table.header(
    [*Step*],
    [*Protein*],
    [*Method*],
    [*How to make mix*],
    [*Daily Amount*],
    [*Interval*],
  ),

  // Data rows
  [1], [1.0 mg], [DILUTE], [0.50 g food + 15.3 ml water], [1 ml], [2-4 weeks],
  [2], [2.5 mg], [DILUTE], [0.50 g food + 10.0 ml water], [1 ml], [2-4 weeks],
)

- measure x powder with scale then add the amount of water mix well etc.
- only a small amount of the dilution is given as the daily dose
- For some foods, it is natural to see sediment build up at the bottom. This occurs due to some of the powders having a higher fiber content. There is no harm to consuming the sediment.
- In the first few months of OIT, prepare the powder mixture away from patient if possible, avoid accidental inhalation of powder

= Daily Dosing Checklist

Doses should be given around 24h apart
No empty stomach
ALWAYS eat a snack prior to dose
keep food consistent

Before giving the dose every day, check these 5 things:

#rect(width: 100%, stroke: 1pt, radius: 4pt, inset: 12pt)[
  #set list(marker: check-box)
  - *Check the Label:* Is this the right food? Did the brand change?
  - *Severe sickness / fever*
  - *The "2-Hour Rule":* No heavy exercise (sweating) or hot showers/bathes 2 hours before and after the dose. Regular play is fine.
  - *Monitoring:* Someone can watch the patient for at least 2 hours after the dose?
]

== Minor side effects from dose
COMMON
Please see page XYZ for how to deal with them
- ensure good lip care to avoid quick absorption, consider petroleum jelly before and after each dose.
- Taking Reactine 1 hour before daily dose during build-up can minimize mild side effects.

Keep a diary of any reactions for follow-up.

*When to increase the dose?*
q2-4 weeks usually
rule of thumb: if on a dose for 2 weeks and no reactions => ok to move to the next step, otherwise stay on it longer

#pagebreak()

= Troubleshooting

== What if my child has a reaction?

Add diagram

== Sickness

Add diagram

== Missed doses

== Child dislikes the taste
- *Masking:* Mix the dose with strong flavors like chocolate pudding, apple sauce, cranberry juice.
- *Temperature:* Cold foods hide taste better.

== Other

= When to contact the clinic
- Epi or severe reactions
- missed >3d doses
- new, frequent heartburn or stomach pain.
- new uncontrolled asthma symptoms

= Frequently Asked Questions

*Q: Is OIT a cure?*
Not exactly. It is a treatment. If you stop taking the daily dose, the allergy may likely come back.

*Q: Why do I need to avoid exercise after the dose?*
May increase allergen absroption speed and also make it easier for the body to react. This is a very common cause of reactions in OIT.

*Q: Can I switch brands of food?*
A: Ask us first. Different brands of food can have slightly different amounts of protein or degrees of processing.

*Can multiple foods be treated together during OIT?*
Yes, many children undergo OIT to multiple foods at the same time.

*Eczema worse*?

- eczema more commonly worse from lots of non allergic triggers - dryness, irritants, stress, etc instead of food itself
- existing food tests like SPT or sIgE don't test for this
- benefits of OIT working tend to outweight any short term risk of flaring eczema

Spits up most of all of their dose
don't double dose, resume normal next day. if recurring contact team

#pagebreak()


