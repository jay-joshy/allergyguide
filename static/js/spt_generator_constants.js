// possible allergens for drop down list 
export const ALLERGENS = {
  aeroallergens: {
    insects: [
      { name: "D. farinae", synonyms: ["dust mite"] },
      { name: "D. pteronyssinus", synonyms: ["dust mite"] },
      "cockroach"
    ],
    trees: [
      "ash", "birch", "black walnut", "box elder", "cedar",
      "cottonwood poplar", "elm", "maple", "oak", "sycamore",
      "tree mix", "western juniper", "white mulberry"
    ],
    grasses_weeds: [
      "grass mix", "timothy grass", "bermuda grass", "mugwort", "pigweed", "ragweed",
    ],
    fungi: [
      "alternaria", "aspergillus", "cladosporium (hormodendrum)",
      "mucor", "penicillium", "rhizopus"
    ],
    animals: [
      "cat", "dog", "feather", "horse", "rabbit"
    ]
  },
  foods: {
    nuts: [
      "almond", "almond butter", "brazil nut", "cashew", "cashew butter", "hazelnut", "macadamia",
      "peanut", "peanut butter", "pecan", "pine nut", "pistachio"
    ],
    egg_dairy: [
      "cow's milk", "egg-white", "goat's milk"
    ],
    seeds: [
      "chia", "hemp seeds", "poppy", "sesame", "tahini", "sunflower seed"
    ],
    shellfish: {
      crustaceans: ["crab", "lobster", "shrimp"],
      molluscs: ["clam", "mussel", "oyster", "scallop"]
    },
    fish: ["cod", "halibut", "salmon", "tuna"],
    meats: ["beef", "chicken", "lamb", "pork"],
    vegetables: [
      "barley", "bean", "bell pepper", "broccoli", "carrot", "celery",
      "corn", "cucumber", "eggplant", "garlic", "lettuce", "mushroom",
      "oat", "onion", "pea", "potato", "rice", "soy", "spinach", "squash",
      "tomato", "wheat"
    ],
    fruits: [
      "apple", "apricot", "banana", "cherry", "grape", "grapefruit",
      "kiwi", "lemon", "mango", "orange", "peach", "pear", "pineapple",
      "plum", "strawberry", "watermelon"
    ]
  },
  venoms: ["honeybee", "wasp", "white faced hornet", "yellow hornet", "yellow jacket"],
  drugs: {
    penicillins: ["amoxicillin", "pen G/V"]
  }
};

// you have to edit the html as well to add the buttons :).
export const TEMPLATES = {
  controls: ["(+) control", "(-) control"],
  Insects: ALLERGENS.aeroallergens.insects.map(item =>
    typeof item === 'object' ? item.name : item
  ),
  Plants: [
    ...ALLERGENS.aeroallergens.trees,
    ...ALLERGENS.aeroallergens.grasses_weeds,
  ],
  Fungi: ALLERGENS.aeroallergens.fungi,
  Animals: ALLERGENS.aeroallergens.animals,
  Nuts: ALLERGENS.foods.nuts,
  EggDairy: ALLERGENS.foods.egg_dairy,
  Seeds: ALLERGENS.foods.seeds,
  Shellfish: [...ALLERGENS.foods.shellfish.crustaceans, ...ALLERGENS.foods.shellfish.molluscs],
  Fish: ALLERGENS.foods.fish,
  Meats: ALLERGENS.foods.meats,
  Vegetables: ALLERGENS.foods.vegetables,
  Fruits: ALLERGENS.foods.fruits,
  Drugs: ALLERGENS.drugs.penicillins,
  Venoms: ALLERGENS.venoms,
  CustomA: [
    "(+) control", "(-) control",
    ...ALLERGENS.aeroallergens.animals,
    ...ALLERGENS.foods.shellfish.crustaceans,
  ]
};

