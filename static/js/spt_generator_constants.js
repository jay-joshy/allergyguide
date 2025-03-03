// possible allergens for drop down list 
export const ALLERGENS = {
  aeroallergens: {
    insects: ["D. farinae", "D. pteronyssinus", "cockroach"],
    trees: ["ash", "birch", "black walnut", "box elder", "cedar", "cottonwood poplar", "elm", "maple", "oak", "sycamore", "tree mix", "western juniper", "white mulberry"],
    grasses_weeds: ["grass mix", "mugwort", "pigweed", "ragweed", "timothy grass", "bermuda grass"],
    fungi: ["alternaria", "aspergillus", "cladosporium (hormodendrum)", "mucor", "penicillium", "rhizopus"],
    animals: ["cat", "dog", "feather", "horse", "rabbit"]
  },
  foods: {
    seeds: ["chia", "hemp seeds", "poppy", "sesame", "sunflower seed"],
    nuts: ["almond", "brazil nut", "cashew", "hazelnut", "macadamia", "peanut", "pecan", "pine nut", "pistachio"],
    egg_dairy: ["cow's milk", "egg-white", "goat's milk"],
    shellfish: {
      crustaceans: ["crab", "lobster", "shrimp"],
      molluscs: ["clam", "mussel", "oyster", "scallop"]
    },
    fish: ["cod", "halibut", "salmon", "tuna"],
    meats: ["beef", "chicken", "lamb", "pork"],
    vegetables: ["barley", "bean", "bell pepper", "broccoli", "carrot", "celery", "corn", "cucumber", "eggplant", "garlic", "lettuce", "mushroom", "oat", "onion", "pea", "potato", "rice", "soy", "spinach", "squash", "tomato", "wheat"],
    fruits: ["apple", "apricot", "banana", "cherry", "grape", "grapefruit", "kiwi", "lemon", "mango", "orange", "peach", "pear", "pineapple", "plum", "strawberry", "watermelon"],
  },
  venoms: ["honeybee", "wasp", "white faced hornet", "yellow hornet", "yellow jacket"],
};

export const TEMPLATES = {
  controls: ["(+) control", "(-) control"],
  commonNuts: ALLERGENS.foods.nuts,
  commonFruits: ALLERGENS.foods.fruits,
};
