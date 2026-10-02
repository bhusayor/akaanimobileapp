import { IMG } from './images';

export type MealType = 'breakfast' | 'lunch' | 'dinner';

export type Ingredient = { name: string; qty: string };
export type Step = { title: string; text: string; image?: string };

export type Meal = {
  id: string;
  name: string;
  description: string;
  image: string;
  mealType: MealType[];
  category: string;
  /** Cuisine id — see CUISINES ("travel through food"). */
  cuisine: string;
  /** Collection ids this meal belongs to — see COLLECTIONS ("explore"). */
  collections: string[];
  region: string;
  time: number; // minutes
  servings: number;
  // macros are PER SERVING
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  tags: string[];
  ingredients: Ingredient[];
  steps: Step[];
};

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const MEALS: Meal[] = [
  {
    id: 'jollof-rice',
    name: 'Party Jollof Rice',
    description:
      'Smoky, tomato-rich long grain rice cooked over an open flame flavour — the undisputed king of Nigerian parties.',
    image: img('photo-1604329760661-e71dc83f8f26'),
    mealType: ['lunch', 'dinner'],
    category: 'Rice Dishes',
    region: 'South West',
    time: 60,
    servings: 4,
    calories: 540,
    protein: 18,
    carbs: 78,
    fat: 16,
    fiber: 4,
    cuisine: 'west-african',
    collections: ['one-pot', 'family-style', 'party-platter', 'comfort-food', 'weeknight', 'kid-friendly', 'holiday-special'],
    tags: ['Smoky', 'Party classic', 'One pot', 'Crowd favourite'],
    ingredients: [
      { name: 'Long grain parboiled rice', qty: '4 cups' },
      { name: 'Plum tomatoes', qty: '6 large' },
      { name: 'Red bell peppers (tatashe)', qty: '3' },
      { name: 'Scotch bonnet (ata rodo)', qty: '2' },
      { name: 'Onions', qty: '2 large' },
      { name: 'Tomato paste', qty: '3 tbsp' },
      { name: 'Chicken stock', qty: '3 cups' },
      { name: 'Vegetable oil', qty: '1/3 cup' },
      { name: 'Bay leaves', qty: '3' },
      { name: 'Curry powder & thyme', qty: '1 tsp each' },
    ],
    steps: [
      {
        title: 'Blend the base',
        text: 'Blend tomatoes, tatashe, scotch bonnet and one onion until smooth. Boil the blend down until it loses half its water.',
        image: img('photo-1547592180-85f173990554', 900),
      },
      {
        title: 'Fry the stew',
        text: 'Heat oil, fry sliced onions, add tomato paste and fry for 5 minutes. Pour in the reduced blend and fry until the oil floats.',
        image: img('photo-1556910103-1c02745aae4d', 900),
      },
      {
        title: 'Cook the rice',
        text: 'Stir in washed rice, stock, bay leaves, curry and thyme. Cover with foil then the lid and cook on low for 30 minutes.',
        image: img('photo-1516684732162-798a0062be99', 900),
      },
      {
        title: 'Get the party smoke',
        text: 'Turn the heat up for the last 3 minutes to catch a light bottom-pot smokiness. Rest 10 minutes, fluff and serve.',
        image: img('photo-1504674900247-0877df9cc836', 900),
      },
    ],
  },
  {
    id: 'egusi-soup',
    name: 'Egusi Soup & Pounded Yam',
    description:
      'Ground melon seed soup, rich with leafy greens and assorted meat, served with smooth pounded yam.',
    image: img('photo-1547592166-23ac45744acd'),
    mealType: ['lunch', 'dinner'],
    category: 'Soups & Swallows',
    region: 'South West',
    time: 75,
    servings: 6,
    calories: 620,
    protein: 32,
    carbs: 58,
    fat: 30,
    fiber: 7,
    cuisine: 'west-african',
    collections: ['family-style', 'comfort-food', 'leafy-green', 'holiday-special', 'post-workout'],
    tags: ['Hearty', 'High protein', 'Swallow pairing', 'Sunday special'],
    ingredients: [
      { name: 'Egusi (melon seeds), ground', qty: '2 cups' },
      { name: 'Assorted meat & shaki', qty: '700 g' },
      { name: 'Stockfish & dried fish', qty: '200 g' },
      { name: 'Ugu (pumpkin leaves)', qty: '2 handfuls' },
      { name: 'Palm oil', qty: '1/2 cup' },
      { name: 'Ground crayfish', qty: '3 tbsp' },
      { name: 'Scotch bonnet', qty: '2' },
      { name: 'Onion', qty: '1' },
      { name: 'Yam (for pounding)', qty: '1 medium tuber' },
      { name: 'Seasoning cubes & salt', qty: 'to taste' },
    ],
    steps: [
      {
        title: 'Boil the proteins',
        text: 'Season assorted meat, shaki and stockfish with onion and seasoning cubes. Boil until tender, keeping the stock.',
        image: img('photo-1544025162-d76694265947', 900),
      },
      {
        title: 'Fry the egusi',
        text: 'Heat palm oil, add blended pepper and onion, then the ground egusi. Fry gently, stirring, until it curdles into lumps.',
        image: img('photo-1556909114-f6e7ad7d3136', 900),
      },
      {
        title: 'Bring it together',
        text: 'Add stock, meats, crayfish and dried fish. Simmer 15 minutes, then fold in ugu leaves and cook 3 more minutes.',
        image: img('photo-1547592180-85f173990554', 900),
      },
      {
        title: 'Pound the yam',
        text: 'Boil peeled yam chunks until soft, then pound until stretchy and smooth. Serve hot beside the soup.',
        image: img('photo-1490645935967-10de6ba17061', 900),
      },
    ],
  },
  {
    id: 'suya',
    name: 'Beef Suya Skewers',
    description:
      'Thin-cut beef skewers coated in spicy yaji peanut spice, grilled over open fire — Northern Nigeria street royalty.',
    image: img('photo-1555939594-58d7cb561ad1'),
    mealType: ['dinner'],
    category: 'Street Food',
    region: 'North',
    time: 40,
    servings: 3,
    calories: 410,
    protein: 38,
    carbs: 9,
    fat: 25,
    fiber: 2,
    cuisine: 'west-african',
    collections: ['spicy', 'party-platter', 'post-workout', 'paleo', 'date-night', 'snackable'],
    tags: ['Spicy', 'Grilled', 'High protein', 'Street classic'],
    ingredients: [
      { name: 'Beef sirloin, thin sliced', qty: '600 g' },
      { name: 'Yaji (suya spice)', qty: '5 tbsp' },
      { name: 'Groundnut oil', qty: '3 tbsp' },
      { name: 'Red onion', qty: '1, ringed' },
      { name: 'Tomatoes', qty: '2, sliced' },
      { name: 'Cabbage', qty: '1/4 head' },
      { name: 'Bamboo skewers', qty: '8' },
    ],
    steps: [
      {
        title: 'Spice the beef',
        text: 'Toss the beef slices in oil, then coat generously in yaji. Thread onto soaked skewers and rest for 30 minutes.',
        image: img('photo-1558030006-450675393462', 900),
      },
      {
        title: 'Grill hot and fast',
        text: 'Grill over high heat 4–5 minutes per side, brushing with oil, until the edges char and the spice crust darkens.',
        image: img('photo-1529193591184-b1d58069ecdd', 900),
      },
      {
        title: 'Dust and serve',
        text: 'Dust with extra yaji straight off the grill. Serve with onion rings, tomato and shredded cabbage.',
        image: img('photo-1544025162-d76694265947', 900),
      },
    ],
  },
  {
    id: 'moi-moi',
    name: 'Moi Moi',
    description:
      'Silky steamed bean pudding made from peeled beans, peppers and fish — a protein-packed classic.',
    image: img('photo-1512058564366-18510be2db19'),
    mealType: ['breakfast', 'lunch'],
    category: 'Beans & Pulses',
    region: 'South West',
    time: 70,
    servings: 6,
    calories: 310,
    protein: 21,
    carbs: 32,
    fat: 11,
    fiber: 9,
    cuisine: 'west-african',
    collections: ['pescatarian', 'meal-prep', 'gut-friendly', 'snackable', 'kid-friendly'],
    tags: ['Steamed', 'High fibre', 'Meal-prep friendly', 'Gluten free'],
    ingredients: [
      { name: 'Honey beans, peeled', qty: '3 cups' },
      { name: 'Red bell pepper', qty: '2' },
      { name: 'Scotch bonnet', qty: '1' },
      { name: 'Onion', qty: '1 large' },
      { name: 'Boiled eggs', qty: '3, halved' },
      { name: 'Smoked mackerel', qty: '150 g' },
      { name: 'Vegetable oil', qty: '1/4 cup' },
      { name: 'Crayfish, ground', qty: '2 tbsp' },
      { name: 'Ramekins or leaves', qty: '6' },
    ],
    steps: [
      {
        title: 'Blend smooth',
        text: 'Blend peeled beans with peppers, onion and a little water until completely smooth and airy.',
        image: img('photo-1556909114-f6e7ad7d3136', 900),
      },
      {
        title: 'Season and fill',
        text: 'Whisk in oil, crayfish and seasoning. Pour into oiled ramekins, tucking in egg halves and flaked mackerel.',
        image: img('photo-1482049016688-2d3e1b311543', 900),
      },
      {
        title: 'Steam gently',
        text: 'Steam covered for 45–55 minutes until firm and a knife comes out clean. Rest before unmoulding.',
        image: img('photo-1504674900247-0877df9cc836', 900),
      },
    ],
  },
  {
    id: 'akara-pap',
    name: 'Akara & Pap',
    description:
      'Crispy bean fritters with silky fermented corn pap — the Saturday-morning breakfast of champions.',
    image: img('photo-1484723091739-30a097e8f929'),
    mealType: ['breakfast'],
    category: 'Beans & Pulses',
    region: 'South West',
    time: 45,
    servings: 4,
    calories: 380,
    protein: 15,
    carbs: 48,
    fat: 15,
    fiber: 7,
    cuisine: 'west-african',
    collections: ['vegetarian', 'kid-friendly', 'snackable', 'comfort-food', 'family-style', 'pre-workout'],
    tags: ['Crispy', 'Weekend classic', 'Vegetarian option'],
    ingredients: [
      { name: 'Honey beans, peeled', qty: '2 cups' },
      { name: 'Onion, chopped', qty: '1/2' },
      { name: 'Scotch bonnet', qty: '1' },
      { name: 'Salt', qty: '1 tsp' },
      { name: 'Vegetable oil (frying)', qty: '3 cups' },
      { name: 'Ogi / pap (corn starch)', qty: '1.5 cups' },
      { name: 'Evaporated milk & sugar', qty: 'to taste' },
    ],
    steps: [
      {
        title: 'Whip the batter',
        text: 'Blend peeled beans with minimal water. Whisk vigorously for 5 minutes to trap air — this makes the akara fluffy.',
        image: img('photo-1556909114-f6e7ad7d3136', 900),
      },
      {
        title: 'Fry golden',
        text: 'Fold in onion and pepper. Scoop spoonfuls into hot oil and fry until deep golden, turning once.',
        image: img('photo-1541592106381-b31e9677c0e5', 900),
      },
      {
        title: 'Make the pap',
        text: 'Mix ogi with cold water, then pour on boiling water while stirring until it thickens and turns translucent. Sweeten and serve.',
        image: img('photo-1517673400267-0251440c45dc', 900),
      },
    ],
  },
  {
    id: 'pepper-soup',
    name: 'Catfish Pepper Soup',
    description:
      'Fiery, aromatic broth with fresh catfish, calabash nutmeg and scent leaves. Light, low-carb comfort.',
    image: img('photo-1547592180-85f173990554'),
    mealType: ['dinner'],
    category: 'Soups & Swallows',
    region: 'Niger Delta',
    time: 35,
    servings: 4,
    calories: 260,
    protein: 30,
    carbs: 6,
    fat: 13,
    fiber: 2,
    cuisine: 'west-african',
    collections: ['spicy', 'paleo', 'pescatarian', 'solo-meals', 'comfort-food', 'no-added-sugar'],
    tags: ['Spicy', 'Low carb', 'Light dinner', 'Comfort food'],
    ingredients: [
      { name: 'Fresh catfish, cut', qty: '800 g' },
      { name: 'Pepper soup spice mix', qty: '2 tbsp' },
      { name: 'Calabash nutmeg (ehuru)', qty: '3 seeds' },
      { name: 'Scotch bonnet', qty: '2' },
      { name: 'Scent leaves', qty: '1 handful' },
      { name: 'Onion', qty: '1' },
      { name: 'Seasoning & salt', qty: 'to taste' },
    ],
    steps: [
      {
        title: 'Clean the fish',
        text: 'Dip catfish pieces in hot water to firm the skin, then rinse in cold water to remove slime.',
        image: img('photo-1467003909585-2f8a72700288', 900),
      },
      {
        title: 'Build the broth',
        text: 'Simmer water with pepper soup spice, ground ehuru, blended pepper and onion for 10 minutes.',
        image: img('photo-1547592166-23ac45744acd', 900),
      },
      {
        title: 'Poach and finish',
        text: 'Lower in the fish and simmer gently 12 minutes without stirring. Tear in scent leaves and serve steaming.',
        image: img('photo-1476718406336-bb5a9690ee2a', 900),
      },
    ],
  },
  {
    id: 'yam-egg-sauce',
    name: 'Boiled Yam & Egg Sauce',
    description:
      'Soft boiled yam with a rich tomato-egg scramble — a fast, filling Nigerian breakfast staple.',
    image: img('photo-1482049016688-2d3e1b311543'),
    mealType: ['breakfast'],
    category: 'Yam & Plantain',
    region: 'Nationwide',
    time: 30,
    servings: 2,
    calories: 450,
    protein: 17,
    carbs: 62,
    fat: 16,
    fiber: 6,
    cuisine: 'west-african',
    collections: ['30-minute', 'weeknight', 'vegetarian', 'solo-meals', 'kid-friendly', 'comfort-food', 'pre-workout'],
    tags: ['Quick', '30 minutes', 'Budget friendly'],
    ingredients: [
      { name: 'Yam', qty: '1/2 tuber' },
      { name: 'Eggs', qty: '4' },
      { name: 'Tomatoes', qty: '3' },
      { name: 'Onion', qty: '1' },
      { name: 'Scotch bonnet', qty: '1' },
      { name: 'Vegetable oil', qty: '3 tbsp' },
      { name: 'Salt & seasoning', qty: 'to taste' },
    ],
    steps: [
      {
        title: 'Boil the yam',
        text: 'Peel, slice and boil yam in salted water for 15–20 minutes until fork tender.',
        image: img('photo-1490645935967-10de6ba17061', 900),
      },
      {
        title: 'Fry the sauce',
        text: 'Sauté onions, tomatoes and pepper until soft and jammy. Season well.',
        image: img('photo-1556910103-1c02745aae4d', 900),
      },
      {
        title: 'Scramble in the eggs',
        text: 'Pour whisked eggs over the sauce, let set slightly, then fold gently into soft curds. Serve over the yam.',
        image: img('photo-1525351484163-7529414344d8', 900),
      },
    ],
  },
  {
    id: 'ofada-stew',
    name: 'Ofada Rice & Ayamase',
    description:
      'Local unpolished rice with green pepper ofada stew (ayamase), bleached palm oil and assorted meats.',
    image: img('photo-1504674900247-0877df9cc836'),
    mealType: ['lunch'],
    category: 'Rice Dishes',
    region: 'South West',
    time: 80,
    servings: 5,
    calories: 640,
    protein: 28,
    carbs: 70,
    fat: 28,
    fiber: 5,
    cuisine: 'west-african',
    collections: ['spicy', 'family-style', 'holiday-special', 'comfort-food'],
    tags: ['Spicy', 'Local rice', 'Weekend cooking'],
    ingredients: [
      { name: 'Ofada rice', qty: '3 cups' },
      { name: 'Green bell peppers', qty: '5' },
      { name: 'Green scotch bonnets', qty: '4' },
      { name: 'Palm oil', qty: '3/4 cup' },
      { name: 'Assorted meats & ponmo', qty: '600 g' },
      { name: 'Locust beans (iru)', qty: '2 tbsp' },
      { name: 'Boiled eggs', qty: '4' },
      { name: 'Onions', qty: '2' },
    ],
    steps: [
      {
        title: 'Bleach the palm oil',
        text: 'Heat palm oil in a covered pot until it lightens in colour. Let it cool slightly — open windows, this gets smoky.',
        image: img('photo-1556910103-1c02745aae4d', 900),
      },
      {
        title: 'Fry the green blend',
        text: 'Blend green peppers and onions coarsely, boil off the water, then fry in the oil with iru until deep and dark.',
        image: img('photo-1547592180-85f173990554', 900),
      },
      {
        title: 'Add the meats',
        text: 'Fold in boiled assorted meats, ponmo and eggs. Simmer 15 minutes until the stew glistens.',
        image: img('photo-1544025162-d76694265947', 900),
      },
      {
        title: 'Cook the ofada',
        text: 'Wash ofada rice thoroughly and boil until tender. Serve wrapped in ewe eran leaves if you have them.',
        image: img('photo-1516684732162-798a0062be99', 900),
      },
    ],
  },
  {
    id: 'dodo-gizzard',
    name: 'Gizdodo',
    description:
      'Sweet fried plantain and peppered gizzards tossed in a rich pepper sauce — a party small-chop that eats like a meal.',
    image: img('photo-1414235077428-338989a2e8c0'),
    mealType: ['lunch', 'dinner'],
    category: 'Yam & Plantain',
    region: 'South West',
    time: 50,
    servings: 4,
    calories: 480,
    protein: 24,
    carbs: 46,
    fat: 23,
    fiber: 4,
    cuisine: 'west-african',
    collections: ['party-platter', 'snackable', 'spicy', 'kid-friendly', 'date-night'],
    tags: ['Sweet & spicy', 'Party favourite'],
    ingredients: [
      { name: 'Ripe plantains', qty: '4' },
      { name: 'Chicken gizzards', qty: '500 g' },
      { name: 'Red bell peppers', qty: '2' },
      { name: 'Scotch bonnet', qty: '1' },
      { name: 'Onion', qty: '1' },
      { name: 'Vegetable oil', qty: 'for frying' },
      { name: 'Green bell pepper, diced', qty: '1' },
    ],
    steps: [
      {
        title: 'Boil and fry gizzards',
        text: 'Season and boil gizzards until tender, then fry until golden with crisp edges.',
        image: img('photo-1544025162-d76694265947', 900),
      },
      {
        title: 'Fry the dodo',
        text: 'Cube ripe plantains and fry to a deep caramel gold. Drain well.',
        image: img('photo-1541592106381-b31e9677c0e5', 900),
      },
      {
        title: 'Toss in pepper sauce',
        text: 'Fry the pepper blend, then toss in gizzards and dodo with diced green pepper. Serve warm.',
        image: img('photo-1556910103-1c02745aae4d', 900),
      },
    ],
  },
  {
    id: 'efo-riro',
    name: 'Efo Riro',
    description:
      'Deeply savoury Yoruba spinach stew with palm oil, iru and assorted proteins. Pairs with any swallow or rice.',
    image: img('photo-1512621776951-a57141f2eefd'),
    mealType: ['lunch', 'dinner'],
    category: 'Soups & Swallows',
    region: 'South West',
    time: 55,
    servings: 5,
    calories: 390,
    protein: 26,
    carbs: 14,
    fat: 27,
    fiber: 6,
    cuisine: 'west-african',
    collections: ['leafy-green', 'superfoods', 'family-style', 'gut-friendly', 'paleo', 'post-workout'],
    tags: ['Leafy greens', 'Low carb', 'Iron rich'],
    ingredients: [
      { name: 'Efo shoko or spinach', qty: '4 handfuls' },
      { name: 'Red bell peppers', qty: '3' },
      { name: 'Scotch bonnet', qty: '2' },
      { name: 'Palm oil', qty: '1/2 cup' },
      { name: 'Assorted meat & fish', qty: '600 g' },
      { name: 'Locust beans (iru)', qty: '2 tbsp' },
      { name: 'Crayfish, ground', qty: '2 tbsp' },
      { name: 'Onion', qty: '1' },
    ],
    steps: [
      {
        title: 'Blanch the greens',
        text: 'Blanch washed greens in hot water for 30 seconds, drain and squeeze dry. This keeps them bright.',
        image: img('photo-1540420773420-3366772f4999', 900),
      },
      {
        title: 'Fry the pepper base',
        text: 'Fry coarsely blended peppers and onion in palm oil with iru until the rawness cooks off.',
        image: img('photo-1547592180-85f173990554', 900),
      },
      {
        title: 'Finish with proteins',
        text: 'Add meats, fish, crayfish and a splash of stock. Simmer, then fold in the greens for the last 3 minutes.',
        image: img('photo-1547592166-23ac45744acd', 900),
      },
    ],
  },
  {
    id: 'fried-rice',
    name: 'Nigerian Fried Rice',
    description:
      'Curry-scented fried rice loaded with liver, shrimp and mixed vegetables — the jollof rival at every owambe.',
    image: img('photo-1603133872878-684f208fb84b'),
    mealType: ['lunch', 'dinner'],
    category: 'Rice Dishes',
    region: 'Nationwide',
    time: 55,
    servings: 4,
    calories: 510,
    protein: 22,
    carbs: 68,
    fat: 17,
    fiber: 5,
    cuisine: 'west-african',
    collections: ['party-platter', 'family-style', 'one-pot', 'holiday-special', 'kid-friendly'],
    tags: ['Party classic', 'Colourful', 'One pot'],
    ingredients: [
      { name: 'Long grain rice', qty: '3 cups' },
      { name: 'Chicken stock', qty: '3 cups' },
      { name: 'Beef liver, diced', qty: '250 g' },
      { name: 'Shrimp', qty: '200 g' },
      { name: 'Carrots, peas, sweetcorn', qty: '2 cups mixed' },
      { name: 'Green beans', qty: '1 cup' },
      { name: 'Curry powder', qty: '2 tsp' },
      { name: 'Spring onions', qty: '3 stalks' },
    ],
    steps: [
      {
        title: 'Par-cook the rice',
        text: 'Cook rice in curry-spiced stock until just underdone. Spread out to cool and dry.',
        image: img('photo-1516684732162-798a0062be99', 900),
      },
      {
        title: 'Stir-fry the mix',
        text: 'Stir-fry liver, shrimp and vegetables in batches over high heat so nothing steams.',
        image: img('photo-1512058564366-18510be2db19', 900),
      },
      {
        title: 'Toss together',
        text: 'Combine rice with the stir-fry in a hot wok, tossing until every grain is coated and stained golden.',
        image: img('photo-1603133872878-684f208fb84b', 900),
      },
    ],
  },
  {
    id: 'okra-soup',
    name: 'Seafood Okra Soup',
    description:
      'Fresh okra with prawns, periwinkle and smoked fish in a light palm oil broth. Best with eba or fufu.',
    image: img('photo-1476718406336-bb5a9690ee2a'),
    mealType: ['dinner'],
    category: 'Soups & Swallows',
    region: 'Niger Delta',
    time: 40,
    servings: 4,
    calories: 340,
    protein: 27,
    carbs: 18,
    fat: 19,
    fiber: 6,
    cuisine: 'west-african',
    collections: ['pescatarian', 'leafy-green', '30-minute', 'weeknight', 'gut-friendly'],
    tags: ['Seafood', 'Draw soup', 'Quick'],
    ingredients: [
      { name: 'Fresh okra, grated', qty: '400 g' },
      { name: 'Prawns', qty: '300 g' },
      { name: 'Smoked fish', qty: '200 g' },
      { name: 'Periwinkle (optional)', qty: '1 cup' },
      { name: 'Palm oil', qty: '4 tbsp' },
      { name: 'Crayfish, ground', qty: '2 tbsp' },
      { name: 'Scotch bonnet', qty: '1' },
      { name: 'Garri or fufu (to serve)', qty: '2 cups' },
    ],
    steps: [
      {
        title: 'Start the broth',
        text: 'Simmer stock with palm oil, crayfish, pepper and smoked fish for 10 minutes.',
        image: img('photo-1547592166-23ac45744acd', 900),
      },
      {
        title: 'Add the okra',
        text: 'Stir in grated okra and cook uncovered 5–7 minutes to keep the draw and the green colour.',
        image: img('photo-1540420773420-3366772f4999', 900),
      },
      {
        title: 'Finish with seafood',
        text: 'Add prawns and periwinkle for the final 4 minutes. Serve immediately with hot eba.',
        image: img('photo-1467003909585-2f8a72700288', 900),
      },
    ],
  },
  {
    id: 'oats-agege',
    name: 'Agege Bread French Toast',
    description:
      'Thick-cut soft Agege bread soaked in spiced egg custard, pan-toasted golden. Nostalgia, upgraded.',
    image: img('photo-1567620905732-2d1ec7ab7445'),
    mealType: ['breakfast'],
    category: 'Street Food',
    region: 'Lagos',
    time: 20,
    servings: 2,
    calories: 420,
    protein: 16,
    carbs: 52,
    fat: 17,
    fiber: 3,
    cuisine: 'west-african',
    collections: ['kid-friendly', '30-minute', 'comfort-food', 'snackable', 'pre-workout', 'solo-meals'],
    tags: ['Quick', 'Sweet', '20 minutes'],
    ingredients: [
      { name: 'Agege bread, thick slices', qty: '6' },
      { name: 'Eggs', qty: '3' },
      { name: 'Milk', qty: '1/2 cup' },
      { name: 'Nutmeg & cinnamon', qty: '1/2 tsp each' },
      { name: 'Butter', qty: '2 tbsp' },
      { name: 'Honey (to serve)', qty: '2 tbsp' },
    ],
    steps: [
      {
        title: 'Make the custard',
        text: 'Whisk eggs, milk, nutmeg and cinnamon in a shallow dish.',
        image: img('photo-1525351484163-7529414344d8', 900),
      },
      {
        title: 'Soak and toast',
        text: 'Soak each slice 20 seconds per side, then toast in foaming butter until golden and puffed.',
        image: img('photo-1484723091739-30a097e8f929', 900),
      },
      {
        title: 'Serve warm',
        text: 'Stack, drizzle with honey and serve with hot tea — Lagos breakfast, elevated.',
        image: img('photo-1482049016688-2d3e1b311543', 900),
      },
    ],
  },
  /* ---------------- Mediterranean ---------------- */
  {
    id: 'greek-salad',
    name: 'Greek Village Salad',
    description:
      'Sun-ripe tomatoes, cucumber and feta dressed in nothing but good olive oil, oregano and sea salt. No cooking, no fuss.',
    image: IMG['greek-salad'],
    mealType: ['lunch'],
    category: 'Salads & Bowls',
    cuisine: 'mediterranean',
    collections: ['no-cook', 'vegetarian', 'leafy-green', '30-minute', 'solo-meals', 'gut-friendly', 'superfoods'],
    region: 'Greece',
    time: 15,
    servings: 2,
    calories: 290,
    protein: 11,
    carbs: 16,
    fat: 21,
    fiber: 5,
    tags: ['No cook', 'Fresh', 'Vegetarian'],
    ingredients: [
      { name: 'Ripe tomatoes', qty: '4 large' },
      { name: 'Cucumber', qty: '1' },
      { name: 'Red onion', qty: '1/2, sliced' },
      { name: 'Feta cheese', qty: '150 g' },
      { name: 'Kalamata olives', qty: '1/2 cup' },
      { name: 'Extra virgin olive oil', qty: '3 tbsp' },
      { name: 'Dried oregano & sea salt', qty: 'to taste' },
    ],
    steps: [
      {
        title: 'Cut everything chunky',
        text: 'Cut tomatoes into thick wedges and the cucumber into half-moons. Keep the pieces generous — this salad is not a fine dice.',
      },
      {
        title: 'Layer, do not toss',
        text: 'Pile tomatoes, cucumber, onion and olives into a shallow bowl. Lay the feta on top in one slab.',
      },
      {
        title: 'Dress and rest',
        text: 'Pour over the olive oil, shower with oregano and salt, then leave 10 minutes so the juices and oil become the dressing.',
      },
    ],
  },
  {
    id: 'seafood-paella',
    name: 'Seafood Paella',
    description:
      'Saffron rice cooked flat and undisturbed until it forms a toasted crust underneath, crowded with prawns and mussels.',
    image: IMG['seafood-paella'],
    mealType: ['lunch', 'dinner'],
    category: 'Rice Dishes',
    cuisine: 'mediterranean',
    collections: ['one-pot', 'pescatarian', 'family-style', 'date-night', 'holiday-special'],
    region: 'Spain',
    time: 55,
    servings: 4,
    calories: 520,
    protein: 31,
    carbs: 66,
    fat: 14,
    fiber: 4,
    tags: ['One pot', 'Seafood', 'Weekend cooking'],
    ingredients: [
      { name: 'Bomba or short grain rice', qty: '2 cups' },
      { name: 'Prawns', qty: '300 g' },
      { name: 'Mussels', qty: '400 g' },
      { name: 'Fish or shellfish stock', qty: '5 cups' },
      { name: 'Saffron threads', qty: 'a good pinch' },
      { name: 'Tomatoes, grated', qty: '2' },
      { name: 'Garlic & smoked paprika', qty: '3 cloves, 1 tsp' },
      { name: 'Olive oil', qty: '4 tbsp' },
    ],
    steps: [
      {
        title: 'Build the sofrito',
        text: 'Fry garlic in olive oil, add grated tomato and smoked paprika and cook down until jammy and darkened.',
      },
      {
        title: 'Add rice and stock',
        text: 'Stir the rice through the sofrito, pour in saffron-steeped stock and spread it flat. From here, do not stir.',
      },
      {
        title: 'Nest the seafood',
        text: 'After 12 minutes press in prawns and mussels. Cook until the liquid is gone, then raise the heat 90 seconds for the socarrat crust.',
      },
    ],
  },
  {
    id: 'ratatouille',
    name: 'Herbed Ratatouille',
    description:
      'Aubergine, courgette and peppers stewed slowly in tomato and thyme until everything melts together. Better on day two.',
    image: IMG['ratatouille'],
    mealType: ['lunch', 'dinner'],
    category: 'Vegetable Mains',
    cuisine: 'mediterranean',
    collections: ['vegan', 'vegetarian', 'one-pot', 'meal-prep', 'gut-friendly', 'no-added-sugar'],
    region: 'France',
    time: 50,
    servings: 4,
    calories: 210,
    protein: 5,
    carbs: 24,
    fat: 11,
    fiber: 8,
    tags: ['Vegan', 'Batch cook', 'No added sugar'],
    ingredients: [
      { name: 'Aubergine', qty: '1 large' },
      { name: 'Courgettes', qty: '2' },
      { name: 'Red & yellow peppers', qty: '2' },
      { name: 'Plum tomatoes', qty: '6' },
      { name: 'Onion & garlic', qty: '1, 4 cloves' },
      { name: 'Olive oil', qty: '4 tbsp' },
      { name: 'Thyme & bay leaf', qty: '4 sprigs, 1' },
    ],
    steps: [
      {
        title: 'Brown each vegetable alone',
        text: 'Fry the aubergine, then the courgette, then the peppers separately in olive oil. Set each aside as it colours.',
      },
      {
        title: 'Make the tomato base',
        text: 'Soften onion and garlic, add chopped tomatoes, thyme and bay, and simmer 15 minutes until thick.',
      },
      {
        title: 'Fold and stew',
        text: 'Return all the vegetables, cover and cook gently 20 minutes. Season, cool slightly and serve warm rather than hot.',
      },
    ],
  },

  /* ---------------- Mexican flavours ---------------- */
  {
    id: 'tinga-tacos',
    name: 'Chicken Tinga Tacos',
    description:
      'Shredded chicken simmered in smoky chipotle tomato sauce, piled into warm tortillas with onion and lime.',
    image: IMG['tinga-tacos'],
    mealType: ['lunch', 'dinner'],
    category: 'Street Food',
    cuisine: 'mexican',
    collections: ['spicy', 'weeknight', '30-minute', 'family-style', 'party-platter'],
    region: 'Mexico',
    time: 30,
    servings: 4,
    calories: 430,
    protein: 34,
    carbs: 38,
    fat: 15,
    fiber: 6,
    tags: ['Spicy', 'Quick', 'Crowd favourite'],
    ingredients: [
      { name: 'Cooked chicken, shredded', qty: '500 g' },
      { name: 'Chipotle in adobo', qty: '2 tbsp' },
      { name: 'Plum tomatoes', qty: '5' },
      { name: 'White onion', qty: '1' },
      { name: 'Corn tortillas', qty: '12' },
      { name: 'Lime & coriander', qty: '2, 1 handful' },
      { name: 'Oregano & cumin', qty: '1 tsp each' },
    ],
    steps: [
      {
        title: 'Blend the chipotle base',
        text: 'Blitz tomatoes, half the onion, chipotle, oregano and cumin into a smooth, deep-red sauce.',
      },
      {
        title: 'Simmer the chicken',
        text: 'Fry the sauce until it darkens, then fold in the shredded chicken and simmer 12 minutes until it drinks the sauce.',
      },
      {
        title: 'Warm and build',
        text: 'Char the tortillas directly over the flame. Fill, then finish with raw onion, coriander and a hard squeeze of lime.',
      },
    ],
  },
  {
    id: 'burrito-bowl',
    name: 'Black Bean Burrito Bowl',
    description:
      'Brown rice, cumin black beans, charred corn and avocado in one bowl — built for the fridge and the office.',
    image: IMG['burrito-bowl'],
    mealType: ['lunch', 'dinner'],
    category: 'Salads & Bowls',
    cuisine: 'mexican',
    collections: ['vegan', 'vegetarian', 'meal-prep', 'on-the-go', 'whole-grains', 'post-workout'],
    region: 'Mexico',
    time: 35,
    servings: 4,
    calories: 460,
    protein: 17,
    carbs: 68,
    fat: 14,
    fiber: 14,
    tags: ['Vegan', 'Meal prep', 'High fibre'],
    ingredients: [
      { name: 'Brown rice', qty: '2 cups' },
      { name: 'Black beans, cooked', qty: '3 cups' },
      { name: 'Sweetcorn', qty: '1.5 cups' },
      { name: 'Avocado', qty: '2' },
      { name: 'Red onion & lime', qty: '1, 2' },
      { name: 'Cumin & smoked paprika', qty: '2 tsp each' },
      { name: 'Olive oil', qty: '2 tbsp' },
    ],
    steps: [
      {
        title: 'Cook the grain',
        text: 'Simmer brown rice until tender with a little salt, then fork through lime juice and let it cool uncovered.',
      },
      {
        title: 'Season the beans',
        text: 'Warm the beans with cumin, paprika and a splash of their liquid until saucy rather than soupy.',
      },
      {
        title: 'Char and assemble',
        text: 'Blister the corn in a dry pan. Box rice, beans and corn together; keep avocado and lime separate until you eat.',
      },
    ],
  },
  {
    id: 'guacamole-chips',
    name: 'Guacamole & Plantain Chips',
    description:
      'Chunky lime-sharp guacamole with crisp fried plantain instead of tortilla chips. Ten minutes, zero heat needed for the dip.',
    image: IMG['guacamole'],
    mealType: ['lunch'],
    category: 'Small Chops',
    cuisine: 'mexican',
    collections: ['no-cook', 'snackable', 'party-platter', 'vegan', 'vegetarian', '30-minute'],
    region: 'Mexico',
    time: 20,
    servings: 4,
    calories: 260,
    protein: 4,
    carbs: 24,
    fat: 18,
    fiber: 7,
    tags: ['Snackable', 'Party', 'Vegan'],
    ingredients: [
      { name: 'Ripe avocados', qty: '3' },
      { name: 'Lime', qty: '2' },
      { name: 'Red onion, fine dice', qty: '1/2' },
      { name: 'Scotch bonnet or jalapeño', qty: '1' },
      { name: 'Coriander', qty: '1 handful' },
      { name: 'Green plantains', qty: '2' },
      { name: 'Salt & oil for frying', qty: 'to taste' },
    ],
    steps: [
      {
        title: 'Mash, do not purée',
        text: 'Fork the avocados coarsely with lime juice and salt so there are still lumps to find.',
      },
      {
        title: 'Fold in the sharp bits',
        text: 'Stir through onion, chilli and torn coriander. Taste and push the lime and salt further than feels right.',
      },
      {
        title: 'Fry the chips',
        text: 'Shave green plantain into thin coins and fry until they stop bubbling and turn crisp. Salt hot, serve immediately.',
      },
    ],
  },

  /* ---------------- Italian fusion ---------------- */
  {
    id: 'suya-ragu',
    name: 'Suya Beef Ragù Pappardelle',
    description:
      'A slow beef ragù seasoned with yaji instead of dried chilli — peanut, ginger and heat folded through ribbons of pasta.',
    image: IMG['suya-ragu'],
    mealType: ['dinner'],
    category: 'Pasta',
    cuisine: 'italian-fusion',
    collections: ['comfort-food', 'family-style', 'date-night', 'spicy'],
    region: 'Italy × Nigeria',
    time: 90,
    servings: 4,
    calories: 610,
    protein: 34,
    carbs: 62,
    fat: 25,
    fiber: 5,
    tags: ['Fusion', 'Slow cooked', 'Spicy'],
    ingredients: [
      { name: 'Beef chuck, diced', qty: '600 g' },
      { name: 'Yaji (suya spice)', qty: '3 tbsp' },
      { name: 'Tinned plum tomatoes', qty: '800 g' },
      { name: 'Onion, carrot, celery', qty: '1 each' },
      { name: 'Beef stock', qty: '2 cups' },
      { name: 'Pappardelle', qty: '400 g' },
      { name: 'Olive oil', qty: '3 tbsp' },
    ],
    steps: [
      {
        title: 'Sear hard',
        text: 'Brown the beef in batches in a heavy pot until properly dark. Crowding it here costs you the whole dish.',
      },
      {
        title: 'Bloom the yaji',
        text: 'Soften the diced vegetables, stir in the yaji for 30 seconds, then add tomatoes, stock and the beef.',
      },
      {
        title: 'Reduce, then marry',
        text: 'Simmer uncovered 70 minutes until glossy. Toss with just-drained pappardelle and a ladle of pasta water.',
      },
    ],
  },
  {
    id: 'egusi-pesto',
    name: 'Egusi Pesto Linguine',
    description:
      'Toasted melon seeds stand in for pine nuts in a bright basil-and-ugu pesto. Weeknight fast, unexpectedly Nigerian.',
    image: IMG['egusi-pesto'],
    mealType: ['lunch', 'dinner'],
    category: 'Pasta',
    cuisine: 'italian-fusion',
    collections: ['vegetarian', '30-minute', 'weeknight', 'solo-meals'],
    region: 'Italy × Nigeria',
    time: 25,
    servings: 3,
    calories: 520,
    protein: 18,
    carbs: 64,
    fat: 22,
    fiber: 6,
    tags: ['Fusion', 'Quick', 'Vegetarian'],
    ingredients: [
      { name: 'Linguine', qty: '300 g' },
      { name: 'Egusi (melon seeds)', qty: '1/2 cup' },
      { name: 'Basil', qty: '2 large handfuls' },
      { name: 'Ugu or spinach', qty: '1 handful' },
      { name: 'Parmesan, grated', qty: '60 g' },
      { name: 'Garlic & lemon', qty: '2 cloves, 1' },
      { name: 'Olive oil', qty: '1/2 cup' },
    ],
    steps: [
      {
        title: 'Toast the egusi',
        text: 'Dry-toast the melon seeds until they smell nutty and turn a shade darker. Cool completely before blending.',
      },
      {
        title: 'Blend the pesto',
        text: 'Blitz egusi, basil, greens, garlic, parmesan and lemon, streaming in olive oil until loose and glossy.',
      },
      {
        title: 'Toss off the heat',
        text: 'Drain the linguine, then fold the pesto through off the heat with pasta water so it stays green.',
      },
    ],
  },
  {
    id: 'jollof-arancini',
    name: 'Jollof Arancini',
    description:
      'Yesterday’s party jollof rolled around melting mozzarella, crumbed and fried to a crackling shell.',
    image: IMG['jollof-arancini'],
    mealType: ['lunch'],
    category: 'Small Chops',
    cuisine: 'italian-fusion',
    collections: ['party-platter', 'snackable', 'kid-friendly', 'holiday-special'],
    region: 'Italy × Nigeria',
    time: 45,
    servings: 5,
    calories: 380,
    protein: 14,
    carbs: 48,
    fat: 15,
    fiber: 3,
    tags: ['Fusion', 'Party', 'Leftover magic'],
    ingredients: [
      { name: 'Cold jollof rice', qty: '4 cups' },
      { name: 'Mozzarella, cubed', qty: '150 g' },
      { name: 'Eggs', qty: '2' },
      { name: 'Breadcrumbs', qty: '2 cups' },
      { name: 'Plain flour', qty: '1 cup' },
      { name: 'Oil for frying', qty: '3 cups' },
    ],
    steps: [
      {
        title: 'Shape around the cheese',
        text: 'Press a spoon of cold jollof flat, bury a mozzarella cube inside and roll into a tight ball. Chill 15 minutes.',
      },
      {
        title: 'Crumb in three stages',
        text: 'Roll each ball through flour, then beaten egg, then breadcrumbs. Do the crumb twice for a sturdier shell.',
      },
      {
        title: 'Fry and drain',
        text: 'Fry at a steady medium-high until deep golden all round. Drain standing up so the bases stay crisp.',
      },
    ],
  },

  /* ---------------- Middle Eastern ---------------- */
  {
    id: 'shakshuka',
    name: 'Shakshuka',
    description:
      'Eggs poached in a spiced pepper and tomato stew, eaten straight from the pan with bread for scooping.',
    image: IMG['shakshuka'],
    mealType: ['breakfast', 'dinner'],
    category: 'Egg Dishes',
    cuisine: 'middle-eastern',
    collections: ['one-pot', 'vegetarian', '30-minute', 'weeknight', 'solo-meals', 'spicy'],
    region: 'Levant',
    time: 30,
    servings: 2,
    calories: 340,
    protein: 19,
    carbs: 22,
    fat: 20,
    fiber: 6,
    tags: ['One pan', 'Brunch', 'Vegetarian'],
    ingredients: [
      { name: 'Eggs', qty: '4' },
      { name: 'Red peppers', qty: '2' },
      { name: 'Tinned tomatoes', qty: '400 g' },
      { name: 'Onion & garlic', qty: '1, 3 cloves' },
      { name: 'Cumin & smoked paprika', qty: '1 tsp each' },
      { name: 'Harissa or scotch bonnet', qty: '1 tbsp' },
      { name: 'Feta & parsley', qty: '80 g, to finish' },
    ],
    steps: [
      {
        title: 'Soften the peppers',
        text: 'Cook sliced peppers and onion in oil slowly for 10 minutes until sweet, then add garlic and the spices.',
      },
      {
        title: 'Reduce the sauce',
        text: 'Add tomatoes and harissa and simmer until thick enough to hold a channel when you drag a spoon through.',
      },
      {
        title: 'Poach the eggs',
        text: 'Make wells, crack in the eggs, cover and cook 6–8 minutes until whites set but yolks stay loose. Scatter feta and parsley.',
      },
    ],
  },
  {
    id: 'shawarma-bowl',
    name: 'Chicken Shawarma Bowl',
    description:
      'Spiced roast chicken thighs over bulgur with pickled onion and garlic sauce — the wrap, unwrapped for meal prep.',
    image: IMG['shawarma-bowl'],
    mealType: ['lunch', 'dinner'],
    category: 'Salads & Bowls',
    cuisine: 'middle-eastern',
    collections: ['on-the-go', 'meal-prep', 'post-workout', 'whole-grains'],
    region: 'Levant',
    time: 45,
    servings: 4,
    calories: 520,
    protein: 40,
    carbs: 45,
    fat: 20,
    fiber: 8,
    tags: ['High protein', 'Meal prep', 'Whole grain'],
    ingredients: [
      { name: 'Chicken thighs, boneless', qty: '700 g' },
      { name: 'Bulgur wheat', qty: '2 cups' },
      { name: 'Yoghurt & garlic', qty: '1 cup, 3 cloves' },
      { name: 'Red onion & vinegar', qty: '1, 3 tbsp' },
      { name: 'Cumin, coriander, turmeric', qty: '1 tsp each' },
      { name: 'Lemon & olive oil', qty: '1, 3 tbsp' },
      { name: 'Tomato & cucumber', qty: '2, 1' },
    ],
    steps: [
      {
        title: 'Marinate hard',
        text: 'Rub the thighs with the spices, lemon and oil and leave at least 30 minutes — overnight is better.',
      },
      {
        title: 'Roast then rest',
        text: 'Roast at high heat 25 minutes until the edges char. Rest 5 minutes, then slice against the grain.',
      },
      {
        title: 'Build the boxes',
        text: 'Bed of bulgur, chicken on top, quick-pickled onion and chopped salad beside. Garlic yoghurt in a separate pot.',
      },
    ],
  },
  {
    id: 'falafel-plate',
    name: 'Falafel & Hummus Plate',
    description:
      'Herb-green chickpea fritters with silky hummus, warm flatbread and a sharp tomato salad.',
    image: IMG['falafel-plate'],
    mealType: ['lunch', 'dinner'],
    category: 'Beans & Pulses',
    cuisine: 'middle-eastern',
    collections: ['vegan', 'vegetarian', 'snackable', 'party-platter', 'gut-friendly'],
    region: 'Levant',
    time: 50,
    servings: 4,
    calories: 470,
    protein: 18,
    carbs: 52,
    fat: 21,
    fiber: 13,
    tags: ['Vegan', 'High fibre', 'Sharing plate'],
    ingredients: [
      { name: 'Dried chickpeas, soaked overnight', qty: '2 cups' },
      { name: 'Parsley & coriander', qty: '1 bunch each' },
      { name: 'Onion & garlic', qty: '1, 4 cloves' },
      { name: 'Cumin & baking powder', qty: '2 tsp, 1 tsp' },
      { name: 'Tahini & lemon', qty: '1/3 cup, 2' },
      { name: 'Tinned chickpeas (hummus)', qty: '400 g' },
      { name: 'Oil for frying', qty: '3 cups' },
    ],
    steps: [
      {
        title: 'Blitz raw, never cooked',
        text: 'Pulse the soaked (not boiled) chickpeas with herbs, onion, garlic and cumin to a coarse, bright green rubble.',
      },
      {
        title: 'Rest and shape',
        text: 'Chill the mix 30 minutes, fold in baking powder, then shape small patties so they cook through before burning.',
      },
      {
        title: 'Fry and plate',
        text: 'Fry until deep brown and crisp. Serve on hummus whipped with tahini and lemon, with flatbread and tomato salad.',
      },
    ],
  },

  /* ---------------- Caribbean inspired ---------------- */
  {
    id: 'jerk-chicken',
    name: 'Jerk Chicken',
    description:
      'Chicken marinated in allspice, thyme and scotch bonnet, then grilled slowly until the skin blackens and blisters.',
    image: IMG['jerk-chicken'],
    mealType: ['dinner'],
    category: 'Grills',
    cuisine: 'caribbean',
    collections: ['spicy', 'paleo', 'family-style', 'post-workout', 'date-night'],
    region: 'Jamaica',
    time: 60,
    servings: 4,
    calories: 440,
    protein: 42,
    carbs: 8,
    fat: 26,
    fiber: 2,
    tags: ['Spicy', 'Grilled', 'High protein'],
    ingredients: [
      { name: 'Chicken thighs & drumsticks', qty: '1 kg' },
      { name: 'Scotch bonnet', qty: '3' },
      { name: 'Spring onions', qty: '6' },
      { name: 'Ground allspice', qty: '2 tbsp' },
      { name: 'Fresh thyme', qty: '6 sprigs' },
      { name: 'Ginger & garlic', qty: '30 g, 5 cloves' },
      { name: 'Soy sauce & lime', qty: '3 tbsp, 2' },
    ],
    steps: [
      {
        title: 'Blend the jerk paste',
        text: 'Blitz scotch bonnet, spring onion, allspice, thyme, ginger, garlic, soy and lime into a thick dark paste.',
      },
      {
        title: 'Marinate overnight',
        text: 'Score the chicken to the bone and work the paste in. Refrigerate at least 4 hours, ideally overnight.',
      },
      {
        title: 'Grill low, finish high',
        text: 'Cook over indirect medium heat 35 minutes, turning, then move over direct flame to char the skin.',
      },
    ],
  },
  {
    id: 'rice-and-peas',
    name: 'Rice & Peas',
    description:
      'Rice simmered in coconut milk with kidney beans, thyme and a whole scotch bonnet left to perfume, never burst.',
    image: IMG['rice-and-peas'],
    mealType: ['lunch', 'dinner'],
    category: 'Rice Dishes',
    cuisine: 'caribbean',
    collections: ['one-pot', 'vegan', 'vegetarian', 'family-style', 'whole-grains', 'kid-friendly', 'pre-workout'],
    region: 'Jamaica',
    time: 45,
    servings: 5,
    calories: 400,
    protein: 11,
    carbs: 68,
    fat: 10,
    fiber: 9,
    tags: ['One pot', 'Vegan', 'Sunday staple'],
    ingredients: [
      { name: 'Long grain rice', qty: '3 cups' },
      { name: 'Kidney beans, cooked', qty: '2 cups' },
      { name: 'Coconut milk', qty: '400 ml' },
      { name: 'Spring onion & thyme', qty: '4, 5 sprigs' },
      { name: 'Scotch bonnet (whole)', qty: '1' },
      { name: 'Garlic & allspice berries', qty: '3 cloves, 6' },
    ],
    steps: [
      {
        title: 'Flavour the liquid first',
        text: 'Simmer coconut milk with bean liquor, thyme, spring onion, garlic and allspice for 10 minutes.',
      },
      {
        title: 'Add rice and the pepper',
        text: 'Stir in rice and beans, lay the whole scotch bonnet on top and cover. Do not let it burst.',
      },
      {
        title: 'Steam and fluff',
        text: 'Cook 20 minutes on low, then rest off the heat 10 minutes. Lift out the pepper and fork the rice apart.',
      },
    ],
  },
  {
    id: 'ackee-saltfish',
    name: 'Ackee & Saltfish',
    description:
      'Silky ackee folded through flaked salt cod with peppers and thyme — Jamaica’s national breakfast.',
    image: IMG['ackee-saltfish'],
    mealType: ['breakfast', 'lunch'],
    category: 'Fish',
    cuisine: 'caribbean',
    collections: ['pescatarian', 'no-added-sugar', 'weeknight', '30-minute'],
    region: 'Jamaica',
    time: 30,
    servings: 4,
    calories: 320,
    protein: 24,
    carbs: 12,
    fat: 20,
    fiber: 4,
    tags: ['Pescatarian', 'Savoury breakfast', 'Quick'],
    ingredients: [
      { name: 'Salt cod', qty: '400 g' },
      { name: 'Ackee (tinned or fresh)', qty: '540 g' },
      { name: 'Onion & bell pepper', qty: '1 each' },
      { name: 'Tomato', qty: '2' },
      { name: 'Scotch bonnet', qty: '1' },
      { name: 'Thyme & black pepper', qty: '4 sprigs, to taste' },
    ],
    steps: [
      {
        title: 'Draw out the salt',
        text: 'Soak the cod overnight, then boil briefly and taste. Flake it, discarding skin and bones.',
      },
      {
        title: 'Sauté the base',
        text: 'Fry onion, pepper, tomato, thyme and chilli until soft and fragrant, about 8 minutes.',
      },
      {
        title: 'Fold, never stir',
        text: 'Add ackee and fish and fold gently a few times only — ackee breaks into mush if you work it.',
      },
    ],
  },

  /* ---------------- East African ---------------- */
  {
    id: 'doro-wat',
    name: 'Doro Wat & Injera',
    description:
      'Ethiopian chicken stew built on a mountain of slow-cooked onion and berbere, served on sour injera.',
    image: IMG['doro-wat'],
    mealType: ['dinner'],
    category: 'Stews',
    cuisine: 'east-african',
    collections: ['spicy', 'family-style', 'comfort-food', 'holiday-special'],
    region: 'Ethiopia',
    time: 100,
    servings: 5,
    calories: 520,
    protein: 38,
    carbs: 40,
    fat: 22,
    fiber: 7,
    tags: ['Spicy', 'Slow cooked', 'Celebration dish'],
    ingredients: [
      { name: 'Chicken drumsticks', qty: '1 kg' },
      { name: 'Red onions', qty: '6 large' },
      { name: 'Berbere spice', qty: '4 tbsp' },
      { name: 'Niter kibbeh or butter', qty: '4 tbsp' },
      { name: 'Garlic & ginger', qty: '6 cloves, 40 g' },
      { name: 'Boiled eggs', qty: '5' },
      { name: 'Injera', qty: 'to serve' },
    ],
    steps: [
      {
        title: 'Cook the onions dry',
        text: 'Sweat the sliced onions in a dry pot for 25 minutes until collapsed and jammy before any fat goes in.',
      },
      {
        title: 'Bloom the berbere',
        text: 'Add the spiced butter, garlic, ginger and berbere and fry 10 minutes until the oil runs red.',
      },
      {
        title: 'Simmer with eggs',
        text: 'Add chicken and a little water, simmer 45 minutes, then slip in scored boiled eggs for the last 10.',
      },
    ],
  },
  {
    id: 'nyama-choma',
    name: 'Nyama Choma',
    description:
      'Kenyan roast goat or beef, salted simply and grilled slowly over coals, served with kachumbari.',
    image: IMG['nyama-choma'],
    mealType: ['dinner'],
    category: 'Grills',
    cuisine: 'east-african',
    collections: ['paleo', 'post-workout', 'party-platter', 'family-style'],
    region: 'Kenya',
    time: 90,
    servings: 4,
    calories: 480,
    protein: 46,
    carbs: 6,
    fat: 30,
    fiber: 2,
    tags: ['High protein', 'Grilled', 'Low carb'],
    ingredients: [
      { name: 'Goat or beef ribs', qty: '1.2 kg' },
      { name: 'Coarse salt', qty: '2 tbsp' },
      { name: 'Lemon', qty: '2' },
      { name: 'Tomatoes & red onion', qty: '3, 1' },
      { name: 'Coriander & chilli', qty: '1 handful, 1' },
    ],
    steps: [
      {
        title: 'Salt and wait',
        text: 'Salt the meat generously and leave it at room temperature for 40 minutes. That is the whole marinade.',
      },
      {
        title: 'Grill slow over coals',
        text: 'Cook over medium coals for an hour, turning every 10 minutes, until the outside is crusted and the inside gives.',
      },
      {
        title: 'Make kachumbari',
        text: 'Toss diced tomato, onion, chilli, coriander and lemon. Rest the meat, chop it, and eat with the salad.',
      },
    ],
  },
  {
    id: 'sukuma-wiki',
    name: 'Sukuma Wiki',
    description:
      'Collard greens braised down with tomato and onion — the everyday East African green that stretches the week.',
    image: IMG['sukuma-wiki'],
    mealType: ['lunch', 'dinner'],
    category: 'Vegetable Mains',
    cuisine: 'east-african',
    collections: ['leafy-green', 'vegan', 'vegetarian', '30-minute', 'weeknight', 'superfoods', 'gut-friendly'],
    region: 'Kenya',
    time: 25,
    servings: 4,
    calories: 160,
    protein: 6,
    carbs: 14,
    fat: 9,
    fiber: 7,
    tags: ['Leafy greens', 'Vegan', 'Budget friendly'],
    ingredients: [
      { name: 'Collard greens or kale', qty: '600 g' },
      { name: 'Onion', qty: '1' },
      { name: 'Tomatoes', qty: '3' },
      { name: 'Garlic', qty: '3 cloves' },
      { name: 'Vegetable oil', qty: '3 tbsp' },
      { name: 'Salt & black pepper', qty: 'to taste' },
    ],
    steps: [
      {
        title: 'Shred fine',
        text: 'Stack the leaves, roll them tight and slice into thin ribbons so they cook evenly and quickly.',
      },
      {
        title: 'Build the base',
        text: 'Fry onion until golden, add garlic and tomato and cook down 6 minutes until it turns saucy.',
      },
      {
        title: 'Braise briefly',
        text: 'Add the greens with a splash of water, cover and cook 8 minutes. They should stay green, not grey.',
      },
    ],
  },

  /* ---------------- West African (beyond Nigeria) ---------------- */
  {
    id: 'thieboudienne',
    name: 'Thieboudienne',
    description:
      'Senegal’s one-pot broken rice with stuffed fish and vegetables, cooked in a deep tomato and tamarind broth.',
    image: IMG['thieboudienne'],
    mealType: ['lunch', 'dinner'],
    category: 'Rice Dishes',
    cuisine: 'west-african',
    collections: ['one-pot', 'pescatarian', 'family-style', 'comfort-food'],
    region: 'Senegal',
    time: 90,
    servings: 6,
    calories: 560,
    protein: 30,
    carbs: 72,
    fat: 17,
    fiber: 7,
    tags: ['One pot', 'Seafood', 'National dish'],
    ingredients: [
      { name: 'Broken rice', qty: '4 cups' },
      { name: 'Grouper or snapper steaks', qty: '1 kg' },
      { name: 'Parsley, garlic, chilli (rof)', qty: '1 bunch, 6 cloves, 1' },
      { name: 'Tomato paste', qty: '4 tbsp' },
      { name: 'Cassava, carrot, cabbage', qty: '1 each' },
      { name: 'Tamarind & dried fish', qty: '2 tbsp, 100 g' },
      { name: 'Palm or vegetable oil', qty: '1/2 cup' },
    ],
    steps: [
      {
        title: 'Stuff the fish',
        text: 'Pound parsley, garlic and chilli into a paste and push it into slits cut in each fish steak.',
      },
      {
        title: 'Fry, then broth',
        text: 'Sear the fish, set aside, then fry tomato paste in the oil until dark. Add water, tamarind and dried fish.',
      },
      {
        title: 'Vegetables, fish, rice',
        text: 'Poach the vegetables and fish in the broth and lift out. Cook the rice in what remains until it drinks it all.',
      },
    ],
  },
  {
    id: 'waakye',
    name: 'Waakye',
    description:
      'Ghanaian rice and beans stained deep red-brown with sorghum leaves, eaten with shito and salad.',
    image: IMG['waakye'],
    mealType: ['breakfast', 'lunch'],
    category: 'Rice Dishes',
    cuisine: 'west-african',
    collections: ['whole-grains', 'one-pot', 'family-style', 'gut-friendly', 'meal-prep', 'pre-workout'],
    region: 'Ghana',
    time: 70,
    servings: 6,
    calories: 430,
    protein: 14,
    carbs: 78,
    fat: 6,
    fiber: 12,
    tags: ['High fibre', 'Street classic', 'Batch cook'],
    ingredients: [
      { name: 'Black-eyed beans', qty: '2 cups' },
      { name: 'Long grain rice', qty: '3 cups' },
      { name: 'Dried sorghum leaves', qty: '6 leaves' },
      { name: 'Bicarbonate of soda', qty: '1/4 tsp' },
      { name: 'Salt', qty: 'to taste' },
      { name: 'Shito (to serve)', qty: '4 tbsp' },
    ],
    steps: [
      {
        title: 'Boil beans with the leaves',
        text: 'Simmer the beans with sorghum leaves and a pinch of bicarb until the water turns a deep red-brown.',
      },
      {
        title: 'Fish out the leaves',
        text: 'Remove the leaves once the colour is set. Keep the coloured liquid — it is the whole point.',
      },
      {
        title: 'Cook the rice in',
        text: 'Add rinsed rice and enough of the liquid to cover. Cover and steam 25 minutes until tender.',
      },
    ],
  },
  {
    id: 'attieke-tilapia',
    name: 'Attiéké & Grilled Tilapia',
    description:
      'Fermented cassava couscous with whole grilled tilapia and a fierce onion-tomato relish. Light and sharp.',
    image: IMG['attieke'],
    mealType: ['lunch', 'dinner'],
    category: 'Fish',
    cuisine: 'west-african',
    collections: ['pescatarian', '30-minute', 'gut-friendly', 'weeknight', 'no-added-sugar'],
    region: "Côte d'Ivoire",
    time: 35,
    servings: 2,
    calories: 420,
    protein: 34,
    carbs: 46,
    fat: 11,
    fiber: 5,
    tags: ['Pescatarian', 'Fermented', 'Light'],
    ingredients: [
      { name: 'Whole tilapia', qty: '2' },
      { name: 'Attiéké', qty: '400 g' },
      { name: 'Onion & tomato', qty: '2, 3' },
      { name: 'Maggi & ginger', qty: '1 cube, 20 g' },
      { name: 'Chilli & lemon', qty: '1, 2' },
      { name: 'Vegetable oil', qty: '2 tbsp' },
    ],
    steps: [
      {
        title: 'Season and score',
        text: 'Score the fish, rub with ginger, chilli, crumbled stock cube and lemon, and leave 15 minutes.',
      },
      {
        title: 'Steam the attiéké',
        text: 'Sprinkle the attiéké with a little water and steam 10 minutes until fluffy and separate.',
      },
      {
        title: 'Grill and dress',
        text: 'Grill the fish 6 minutes a side until the skin lifts away. Serve with raw onion-tomato relish and lemon.',
      },
    ],
  },

  /* ---------------- Global fusion ---------------- */
  {
    id: 'jollof-quinoa',
    name: 'Jollof Quinoa Bowl',
    description:
      'The jollof pepper base, cooked into quinoa instead of rice, with roast vegetables and a lime-herb drizzle.',
    image: IMG['quinoa-bowl'],
    mealType: ['lunch', 'dinner'],
    category: 'Salads & Bowls',
    cuisine: 'global-fusion',
    collections: ['whole-grains', 'meal-prep', 'post-workout', 'vegan', 'vegetarian', 'superfoods'],
    region: 'Global',
    time: 40,
    servings: 4,
    calories: 410,
    protein: 15,
    carbs: 56,
    fat: 14,
    fiber: 11,
    tags: ['Vegan', 'High fibre', 'Meal prep'],
    ingredients: [
      { name: 'Quinoa', qty: '2 cups' },
      { name: 'Red peppers & tomatoes', qty: '2, 4' },
      { name: 'Scotch bonnet & onion', qty: '1, 1' },
      { name: 'Tomato paste', qty: '2 tbsp' },
      { name: 'Courgette & sweet potato', qty: '1, 1' },
      { name: 'Curry powder & thyme', qty: '1 tsp each' },
      { name: 'Lime & parsley', qty: '2, 1 handful' },
    ],
    steps: [
      {
        title: 'Reduce the pepper base',
        text: 'Blend peppers, tomatoes, onion and chilli, then boil down hard until it loses half its volume.',
      },
      {
        title: 'Cook the quinoa in it',
        text: 'Fry tomato paste and spices, add the base and the rinsed quinoa, and simmer covered 18 minutes.',
      },
      {
        title: 'Roast and top',
        text: 'Roast the diced vegetables until the edges catch, pile over the quinoa and finish with lime and parsley.',
      },
    ],
  },
  {
    id: 'suya-caesar-wrap',
    name: 'Suya Chicken Caesar Wrap',
    description:
      'Yaji-rubbed chicken, crunchy lettuce and a lemony caesar dressing rolled tight for eating with one hand.',
    image: IMG['caesar-wrap'],
    mealType: ['lunch'],
    category: 'Sandwiches',
    cuisine: 'global-fusion',
    collections: ['on-the-go', '30-minute', 'solo-meals', 'weeknight'],
    region: 'Global',
    time: 25,
    servings: 2,
    calories: 480,
    protein: 36,
    carbs: 42,
    fat: 19,
    fiber: 5,
    tags: ['Fusion', 'Quick', 'On the go'],
    ingredients: [
      { name: 'Chicken breast', qty: '400 g' },
      { name: 'Yaji (suya spice)', qty: '2 tbsp' },
      { name: 'Large tortillas', qty: '2' },
      { name: 'Romaine lettuce', qty: '1 head' },
      { name: 'Yoghurt & mayo', qty: '3 tbsp each' },
      { name: 'Parmesan, lemon, garlic', qty: '30 g, 1, 1 clove' },
    ],
    steps: [
      {
        title: 'Spice and sear',
        text: 'Rub the chicken in yaji and oil, sear 4 minutes a side, then rest before slicing.',
      },
      {
        title: 'Whisk the dressing',
        text: 'Mix yoghurt, mayo, grated parmesan, lemon juice and crushed garlic until pourable and sharp.',
      },
      {
        title: 'Roll it tight',
        text: 'Dress the lettuce, lay it with the chicken just off centre, fold the sides in and roll hard. Cut on the diagonal.',
      },
    ],
  },
  {
    id: 'plantain-poke',
    name: 'Plantain Poke Bowl',
    description:
      'Marinated raw salmon over rice with sweet fried plantain, avocado and a sesame-soy dressing.',
    image: IMG['poke-bowl'],
    mealType: ['lunch', 'dinner'],
    category: 'Salads & Bowls',
    cuisine: 'global-fusion',
    collections: ['pescatarian', 'no-cook', 'superfoods', 'date-night', '30-minute'],
    region: 'Global',
    time: 25,
    servings: 2,
    calories: 520,
    protein: 32,
    carbs: 54,
    fat: 20,
    fiber: 6,
    tags: ['Pescatarian', 'Fresh', 'Fusion'],
    ingredients: [
      { name: 'Sashimi-grade salmon', qty: '300 g' },
      { name: 'Sushi rice, cooked', qty: '2 cups' },
      { name: 'Ripe plantain', qty: '1' },
      { name: 'Avocado & cucumber', qty: '1, 1/2' },
      { name: 'Soy sauce & sesame oil', qty: '3 tbsp, 1 tbsp' },
      { name: 'Lime, ginger, spring onion', qty: '1, 15 g, 2' },
    ],
    steps: [
      {
        title: 'Cube and marinate',
        text: 'Cut the salmon into even 2 cm cubes and dress with soy, sesame oil, ginger and lime. Rest 10 minutes, no longer.',
      },
      {
        title: 'Fry the plantain',
        text: 'Fry ripe plantain cubes until caramelised at the edges, then drain — this is the only heat in the bowl.',
      },
      {
        title: 'Build cold',
        text: 'Room-temperature rice, then salmon, plantain, avocado and cucumber in sections. Spring onion over the top.',
      },
    ],
  },
  {
    id: 'overnight-oats',
    name: 'Overnight Oats & Banana',
    description:
      'Oats soaked overnight in milk with chia and cinnamon, topped with banana and peanuts. Made the night before, eaten cold.',
    image: IMG['overnight-oats'],
    mealType: ['breakfast'],
    category: 'Breakfast Bowls',
    cuisine: 'global-fusion',
    collections: ['no-cook', 'pre-workout', 'meal-prep', 'whole-grains', 'kid-friendly', 'gut-friendly', 'vegetarian', 'on-the-go'],
    region: 'Global',
    time: 10,
    servings: 2,
    calories: 340,
    protein: 13,
    carbs: 52,
    fat: 10,
    fiber: 9,
    tags: ['No cook', 'Make ahead', 'Pre workout'],
    ingredients: [
      { name: 'Rolled oats', qty: '1 cup' },
      { name: 'Milk or plant milk', qty: '1.5 cups' },
      { name: 'Chia seeds', qty: '2 tbsp' },
      { name: 'Banana', qty: '2' },
      { name: 'Peanuts or groundnuts', qty: '3 tbsp' },
      { name: 'Cinnamon & honey', qty: '1 tsp, to taste' },
    ],
    steps: [
      {
        title: 'Soak the night before',
        text: 'Stir oats, chia, milk and cinnamon together in a jar. Seal and refrigerate at least 6 hours.',
      },
      {
        title: 'Loosen in the morning',
        text: 'It will be thick — stir through a splash more milk until it falls slowly off the spoon.',
      },
      {
        title: 'Top and go',
        text: 'Sliced banana, crushed peanuts and a thread of honey. Eat cold, straight from the jar.',
      },
    ],
  },
  {
    id: 'peanut-smoothie-bowl',
    name: 'Peanut Protein Smoothie Bowl',
    description:
      'Frozen banana whipped with groundnut butter and milk into something thick enough to eat with a spoon.',
    image: IMG['smoothie-bowl'],
    mealType: ['breakfast'],
    category: 'Breakfast Bowls',
    cuisine: 'global-fusion',
    collections: ['no-cook', 'post-workout', 'snackable', '30-minute', 'vegetarian', 'superfoods', 'pre-workout'],
    region: 'Global',
    time: 10,
    servings: 1,
    calories: 390,
    protein: 24,
    carbs: 44,
    fat: 14,
    fiber: 7,
    tags: ['Post workout', 'No cook', 'High protein'],
    ingredients: [
      { name: 'Frozen banana', qty: '2' },
      { name: 'Groundnut (peanut) butter', qty: '2 tbsp' },
      { name: 'Milk or plant milk', qty: '1/2 cup' },
      { name: 'Protein powder or milk powder', qty: '1 scoop' },
      { name: 'Cocoa & dates', qty: '1 tbsp, 2' },
      { name: 'Granola & seeds', qty: 'to top' },
    ],
    steps: [
      {
        title: 'Blend thick',
        text: 'Blitz frozen banana, groundnut butter, cocoa, dates and protein with only as much milk as it takes to move.',
      },
      {
        title: 'Check the spoon test',
        text: 'It should hold a peak. Too runny means more frozen banana, not more powder.',
      },
      {
        title: 'Top with texture',
        text: 'Scrape into a cold bowl and cover with granola and seeds for the crunch it lacks.',
      },
    ],
  },

  /* ---------------- East Asian fusion ---------------- */
  {
    id: 'salmon-donburi',
    name: 'Teriyaki Salmon Donburi',
    description:
      'Glazed salmon over hot rice with pickled cucumber and sesame — a whole dinner in one bowl, in half an hour.',
    image: IMG['salmon-donburi'],
    mealType: ['dinner'],
    category: 'Salads & Bowls',
    cuisine: 'east-asian',
    collections: ['pescatarian', '30-minute', 'solo-meals', 'weeknight', 'post-workout'],
    region: 'Japan',
    time: 30,
    servings: 2,
    calories: 540,
    protein: 38,
    carbs: 58,
    fat: 18,
    fiber: 4,
    tags: ['Pescatarian', 'Quick', 'High protein'],
    ingredients: [
      { name: 'Salmon fillets', qty: '2' },
      { name: 'Short grain rice', qty: '1.5 cups' },
      { name: 'Soy sauce & mirin', qty: '4 tbsp, 3 tbsp' },
      { name: 'Sugar & ginger', qty: '1 tbsp, 15 g' },
      { name: 'Cucumber & rice vinegar', qty: '1, 2 tbsp' },
      { name: 'Sesame seeds & spring onion', qty: '1 tbsp, 2' },
    ],
    steps: [
      {
        title: 'Quick-pickle the cucumber',
        text: 'Slice thin, toss with vinegar and a pinch of salt and leave while everything else cooks.',
      },
      {
        title: 'Sear skin-side down',
        text: 'Cook the salmon skin-down in a hot dry pan until crisp, flip briefly, then pour in soy, mirin, sugar and ginger.',
      },
      {
        title: 'Glaze and bowl up',
        text: 'Spoon the reducing sauce over until it lacquers the fish. Sit it on hot rice with the pickles and sesame.',
      },
    ],
  },
  {
    id: 'kimchi-fried-rice',
    name: 'Kimchi Fried Rice',
    description:
      'Day-old rice fried hard with kimchi and gochujang, finished with a runny fried egg on top.',
    image: IMG['kimchi-fried-rice'],
    mealType: ['lunch', 'dinner'],
    category: 'Rice Dishes',
    cuisine: 'east-asian',
    collections: ['one-pot', 'spicy', '30-minute', 'gut-friendly', 'solo-meals', 'vegetarian'],
    region: 'Korea',
    time: 20,
    servings: 2,
    calories: 470,
    protein: 16,
    carbs: 62,
    fat: 17,
    fiber: 5,
    tags: ['Spicy', 'Fermented', 'Leftover magic'],
    ingredients: [
      { name: 'Cold cooked rice', qty: '3 cups' },
      { name: 'Kimchi, chopped', qty: '1.5 cups' },
      { name: 'Gochujang', qty: '2 tbsp' },
      { name: 'Eggs', qty: '2' },
      { name: 'Spring onions & garlic', qty: '3, 2 cloves' },
      { name: 'Sesame oil & soy', qty: '1 tbsp, 1 tbsp' },
    ],
    steps: [
      {
        title: 'Fry the kimchi first',
        text: 'Cook the chopped kimchi in oil for 4 minutes until the edges caramelise, then stir in gochujang and garlic.',
      },
      {
        title: 'Press the rice in',
        text: 'Add cold rice and press it flat against the hot pan. Leave it to catch before you toss — that crust is the flavour.',
      },
      {
        title: 'Egg on top',
        text: 'Finish with sesame oil and soy. Fry the eggs hard-edged and runny-yolked and slide one onto each bowl.',
      },
    ],
  },
  {
    id: 'gyoza',
    name: 'Pan-fried Gyoza',
    description:
      'Pork and cabbage dumplings crisped on one side and steamed on the other, with a black vinegar dip.',
    image: IMG['gyoza'],
    mealType: ['dinner'],
    category: 'Small Chops',
    cuisine: 'east-asian',
    collections: ['snackable', 'party-platter', 'kid-friendly', 'family-style'],
    region: 'Japan',
    time: 60,
    servings: 4,
    calories: 360,
    protein: 20,
    carbs: 36,
    fat: 15,
    fiber: 3,
    tags: ['Sharing plate', 'Party', 'Make ahead'],
    ingredients: [
      { name: 'Gyoza wrappers', qty: '40' },
      { name: 'Pork mince', qty: '400 g' },
      { name: 'Cabbage, finely chopped', qty: '250 g' },
      { name: 'Garlic, ginger, spring onion', qty: '3 cloves, 20 g, 3' },
      { name: 'Soy, sesame oil', qty: '2 tbsp, 1 tbsp' },
      { name: 'Black vinegar & chilli oil', qty: 'to serve' },
    ],
    steps: [
      {
        title: 'Salt the cabbage',
        text: 'Salt the chopped cabbage for 15 minutes then squeeze it bone dry. Wet filling means burst dumplings.',
      },
      {
        title: 'Fill and pleat',
        text: 'Mix filling ingredients, spoon a teaspoon onto each wrapper, wet the rim and pleat one side only.',
      },
      {
        title: 'Fry, steam, fry',
        text: 'Fry flat-side down 2 minutes, add a splash of water and cover 6 minutes, then uncover to re-crisp the base.',
      },
    ],
  },

  /* ---------------- Southeast Asian flavours ---------------- */
  {
    id: 'pad-thai',
    name: 'Pad Thai',
    description:
      'Rice noodles tossed in tamarind, fish sauce and palm sugar with prawns, egg and a heap of crushed peanuts.',
    image: IMG['pad-thai'],
    mealType: ['lunch', 'dinner'],
    category: 'Noodles',
    cuisine: 'southeast-asian',
    collections: ['30-minute', 'weeknight', 'pescatarian', 'date-night', 'solo-meals'],
    region: 'Thailand',
    time: 30,
    servings: 2,
    calories: 560,
    protein: 27,
    carbs: 72,
    fat: 18,
    fiber: 5,
    tags: ['Quick', 'Sweet & sour', 'Street classic'],
    ingredients: [
      { name: 'Flat rice noodles', qty: '200 g' },
      { name: 'Prawns', qty: '250 g' },
      { name: 'Tamarind paste', qty: '3 tbsp' },
      { name: 'Fish sauce & palm sugar', qty: '3 tbsp, 2 tbsp' },
      { name: 'Eggs', qty: '2' },
      { name: 'Beansprouts & garlic chives', qty: '2 cups, 1 handful' },
      { name: 'Peanuts & lime', qty: '1/2 cup, 1' },
    ],
    steps: [
      {
        title: 'Soak, do not boil',
        text: 'Soak the noodles in warm water until pliable but still firm — they finish cooking in the wok.',
      },
      {
        title: 'Mix the sauce first',
        text: 'Stir tamarind, fish sauce and palm sugar until dissolved. Taste: sour first, then salty, then sweet.',
      },
      {
        title: 'Wok it fast',
        text: 'Fry prawns and garlic, push aside and scramble the eggs, then add noodles, sauce and beansprouts. Two minutes, no more.',
      },
    ],
  },
  {
    id: 'green-curry',
    name: 'Thai Green Curry',
    description:
      'Coconut curry sharpened with lime leaf and basil, hot enough to make you notice, built in one pot.',
    image: IMG['green-curry'],
    mealType: ['dinner'],
    category: 'Stews',
    cuisine: 'southeast-asian',
    collections: ['one-pot', 'spicy', '30-minute', 'weeknight', 'comfort-food'],
    region: 'Thailand',
    time: 30,
    servings: 4,
    calories: 450,
    protein: 28,
    carbs: 20,
    fat: 30,
    fiber: 5,
    tags: ['Spicy', 'One pot', 'Coconut'],
    ingredients: [
      { name: 'Green curry paste', qty: '4 tbsp' },
      { name: 'Coconut milk', qty: '800 ml' },
      { name: 'Chicken thigh or tofu', qty: '600 g' },
      { name: 'Thai aubergines & beans', qty: '200 g, 150 g' },
      { name: 'Fish sauce & palm sugar', qty: '2 tbsp, 1 tbsp' },
      { name: 'Kaffir lime leaves & basil', qty: '4, 1 handful' },
    ],
    steps: [
      {
        title: 'Crack the coconut cream',
        text: 'Boil the thick top of the coconut milk until the oil separates, then fry the paste in it for 3 minutes.',
      },
      {
        title: 'Simmer the protein',
        text: 'Add the chicken or tofu and the rest of the coconut milk. Simmer 12 minutes with the lime leaves.',
      },
      {
        title: 'Season at the end',
        text: 'Add vegetables for the final 5 minutes, then fish sauce, sugar and basil off the heat.',
      },
    ],
  },
  {
    id: 'summer-rolls',
    name: 'Vietnamese Summer Rolls',
    description:
      'Rice paper rolled around prawns, herbs and vermicelli — nothing cooked but the noodles, dipped in peanut sauce.',
    image: IMG['summer-rolls'],
    mealType: ['lunch'],
    category: 'Small Chops',
    cuisine: 'southeast-asian',
    collections: ['no-cook', 'snackable', 'party-platter', 'on-the-go', 'pescatarian', 'leafy-green'],
    region: 'Vietnam',
    time: 30,
    servings: 3,
    calories: 280,
    protein: 18,
    carbs: 36,
    fat: 7,
    fiber: 4,
    tags: ['Fresh', 'No cook', 'Light'],
    ingredients: [
      { name: 'Rice paper wrappers', qty: '12' },
      { name: 'Cooked prawns, halved', qty: '250 g' },
      { name: 'Rice vermicelli', qty: '150 g' },
      { name: 'Lettuce, mint, coriander', qty: '1 head, 2 handfuls' },
      { name: 'Carrot & cucumber', qty: '1, 1' },
      { name: 'Peanut butter & hoisin', qty: '3 tbsp, 2 tbsp' },
    ],
    steps: [
      {
        title: 'Prep everything first',
        text: 'Soak the vermicelli, julienne the vegetables and line the herbs up. Once you start rolling there is no stopping.',
      },
      {
        title: 'Dip the paper briefly',
        text: 'Two seconds in warm water is enough — it keeps softening on the board. Any longer and it tears.',
      },
      {
        title: 'Roll prawn-side down',
        text: 'Lay prawns pink-side down first so they show through, add the filling, fold the sides and roll tight.',
      },
    ],
  },

  /* ---------------- South Asian ---------------- */
  {
    id: 'chana-masala',
    name: 'Chana Masala',
    description:
      'Chickpeas simmered in a dark onion-tomato masala with amchur for sourness. Cheap, filling, gets better overnight.',
    image: IMG['chana-masala'],
    mealType: ['lunch', 'dinner'],
    category: 'Beans & Pulses',
    cuisine: 'south-asian',
    collections: ['vegan', 'vegetarian', 'one-pot', 'gut-friendly', 'meal-prep', 'weeknight', 'spicy'],
    region: 'North India',
    time: 40,
    servings: 4,
    calories: 330,
    protein: 15,
    carbs: 48,
    fat: 9,
    fiber: 13,
    tags: ['Vegan', 'High fibre', 'Batch cook'],
    ingredients: [
      { name: 'Chickpeas, cooked', qty: '3 cups' },
      { name: 'Onions', qty: '2' },
      { name: 'Tomatoes', qty: '4' },
      { name: 'Ginger & garlic paste', qty: '2 tbsp' },
      { name: 'Cumin, coriander, garam masala', qty: '2 tsp, 2 tsp, 1 tsp' },
      { name: 'Amchur or lemon', qty: '1 tsp, or 1' },
      { name: 'Green chilli & coriander', qty: '2, 1 handful' },
    ],
    steps: [
      {
        title: 'Brown the onions properly',
        text: 'Fry the onions 15 minutes until genuinely brown, not golden. This is where the colour of the dish comes from.',
      },
      {
        title: 'Cook out the masala',
        text: 'Add ginger-garlic and ground spices, then tomatoes. Fry until the oil separates at the edges.',
      },
      {
        title: 'Simmer and sour',
        text: 'Add chickpeas with a cup of water and simmer 15 minutes, mashing a few. Finish with amchur, chilli and coriander.',
      },
    ],
  },
  {
    id: 'chicken-biryani',
    name: 'Chicken Biryani',
    description:
      'Marinated chicken layered under saffron rice and sealed to steam in its own perfume. A celebration in a pot.',
    image: IMG['biryani'],
    mealType: ['lunch', 'dinner'],
    category: 'Rice Dishes',
    cuisine: 'south-asian',
    collections: ['family-style', 'holiday-special', 'comfort-food', 'party-platter', 'one-pot'],
    region: 'Hyderabad',
    time: 95,
    servings: 6,
    calories: 620,
    protein: 34,
    carbs: 76,
    fat: 20,
    fiber: 5,
    tags: ['Celebration dish', 'Layered', 'Crowd favourite'],
    ingredients: [
      { name: 'Basmati rice', qty: '4 cups' },
      { name: 'Chicken, bone in', qty: '1.2 kg' },
      { name: 'Yoghurt', qty: '1.5 cups' },
      { name: 'Fried onions (birista)', qty: '2 cups' },
      { name: 'Saffron in warm milk', qty: 'a pinch in 1/4 cup' },
      { name: 'Biryani masala & chilli', qty: '3 tbsp, 2 tsp' },
      { name: 'Mint & coriander', qty: '1 bunch each' },
    ],
    steps: [
      {
        title: 'Marinate in yoghurt',
        text: 'Coat the chicken in yoghurt, masala, half the fried onions and the herbs. Rest at least 2 hours.',
      },
      {
        title: 'Par-cook the rice',
        text: 'Boil the basmati with whole spices to 70% done — it should still snap. Drain immediately.',
      },
      {
        title: 'Layer and seal',
        text: 'Chicken below, rice above, saffron milk and onions on top. Seal the lid with dough and steam 40 minutes on low.',
      },
    ],
  },
  {
    id: 'palak-paneer',
    name: 'Palak Paneer',
    description:
      'Blanched spinach blended smooth and green, with cubes of paneer folded through at the last minute.',
    image: IMG['palak-paneer'],
    mealType: ['lunch', 'dinner'],
    category: 'Vegetable Mains',
    cuisine: 'south-asian',
    collections: ['vegetarian', 'leafy-green', 'superfoods', '30-minute', 'comfort-food'],
    region: 'North India',
    time: 35,
    servings: 4,
    calories: 350,
    protein: 19,
    carbs: 16,
    fat: 24,
    fiber: 6,
    tags: ['Vegetarian', 'Leafy greens', 'Iron rich'],
    ingredients: [
      { name: 'Spinach', qty: '600 g' },
      { name: 'Paneer, cubed', qty: '400 g' },
      { name: 'Onion & tomato', qty: '1, 2' },
      { name: 'Ginger, garlic, green chilli', qty: '20 g, 4 cloves, 2' },
      { name: 'Cumin & garam masala', qty: '1 tsp each' },
      { name: 'Cream or yoghurt', qty: '3 tbsp' },
    ],
    steps: [
      {
        title: 'Blanch and shock',
        text: 'Boil the spinach 90 seconds then drop it into iced water. This is what keeps the curry green instead of khaki.',
      },
      {
        title: 'Blend, then build',
        text: 'Purée the spinach with chilli. Separately fry cumin, onion, ginger-garlic and tomato until thick.',
      },
      {
        title: 'Fold in late',
        text: 'Stir the purée into the masala, warm through 4 minutes only, then fold in paneer and cream off the heat.',
      },
    ],
  },
];

export type Collection = { id: string; name: string; blurb: string; image: string };
export type Cuisine = { id: string; name: string; blurb: string; image: string };

/** "Explore" — the way people actually shop for a meal: mood, diet, occasion. */
export const COLLECTIONS: Collection[] = [
  { id: 'whole-grains', name: 'Whole Grains', blurb: 'Brown rice, oats, bulgur, quinoa', image: IMG['c-whole-grains'] },
  { id: 'superfoods', name: 'Superfoods', blurb: 'Nutrient-dense, every bite counts', image: IMG['c-superfoods'] },
  { id: 'leafy-green', name: 'Leafy-Green Rich', blurb: 'Ugu, spinach, kale, collards', image: IMG['c-leafy'] },
  { id: 'spicy', name: 'Spicy', blurb: 'For people who reach for more pepper', image: IMG['c-spicy'] },
  { id: 'no-added-sugar', name: 'No Added Sugar', blurb: 'Sweetness only where it grew', image: IMG['c-nosugar'] },
  { id: 'one-pot', name: 'One-Pot Meal', blurb: 'One pot in, one pot to wash', image: IMG['c-onepot'] },
  { id: 'no-cook', name: 'No Cook', blurb: 'Nothing goes on the fire', image: IMG['c-nocook'] },
  { id: 'kid-friendly', name: 'Kid Friendly', blurb: 'Mild, familiar, actually eaten', image: IMG['c-kid'] },
  { id: 'comfort-food', name: 'Comfort Food', blurb: 'The ones that taste like home', image: IMG['c-comfort'] },
  { id: 'solo-meals', name: 'Solo Meals', blurb: 'Cooking for exactly one', image: IMG['c-solo'] },
  { id: '30-minute', name: '30-Minute Meals', blurb: 'On the table before you give up', image: IMG['c-30min'] },
  { id: 'weeknight', name: 'Weeknight Friendly', blurb: 'Low effort, Tuesday-proof', image: IMG['c-weeknight'] },
  { id: 'family-style', name: 'Family Style', blurb: 'Big pots, shared plates', image: IMG['c-family'] },
  { id: 'holiday-special', name: 'Holiday Special', blurb: 'Worth the whole afternoon', image: IMG['c-holiday'] },
  { id: 'party-platter', name: 'Party Platter', blurb: 'Small chops and crowd feeders', image: IMG['c-party'] },
  { id: 'date-night', name: 'Date Night', blurb: 'Cook to impress someone', image: IMG['c-date'] },
  { id: 'vegan', name: 'Vegan', blurb: 'Nothing from an animal', image: IMG['c-vegan'] },
  { id: 'vegetarian', name: 'Vegetarian', blurb: 'Meat-free, flavour-full', image: IMG['c-vegetarian'] },
  { id: 'pescatarian', name: 'Pescatarian', blurb: 'Fish and seafood forward', image: IMG['c-pescatarian'] },
  { id: 'paleo', name: 'Paleo', blurb: 'Protein and produce, no grains', image: IMG['c-paleo'] },
  { id: 'gut-friendly', name: 'Gut Friendly', blurb: 'Fibre, ferments and easy digestion', image: IMG['c-gut'] },
  { id: 'snackable', name: 'Snackable', blurb: 'Eat standing up', image: IMG['c-snack'] },
  { id: 'meal-prep', name: 'Meal Prep Friendly', blurb: 'Cook Sunday, eat all week', image: IMG['c-mealprep'] },
  { id: 'on-the-go', name: 'On-the-Go', blurb: 'Travels in a box or a hand', image: IMG['c-onthego'] },
  { id: 'post-workout', name: 'Post Workout', blurb: 'Protein to rebuild with', image: IMG['c-post'] },
  { id: 'pre-workout', name: 'Pre Workout', blurb: 'Light carbs, no heaviness', image: IMG['c-pre'] },
];

/** "Travel through food" — the same appetite, a different passport. */
export const CUISINES: Cuisine[] = [
  { id: 'mediterranean', name: 'Mediterranean', blurb: 'Olive oil, lemon, sea salt', image: IMG['x-mediterranean'] },
  { id: 'mexican', name: 'Mexican Flavours', blurb: 'Chilli, lime and charred corn', image: IMG['x-mexican'] },
  { id: 'italian-fusion', name: 'Italian Fusion', blurb: 'Pasta with a Nigerian accent', image: IMG['x-italian'] },
  { id: 'middle-eastern', name: 'Middle Eastern', blurb: 'Warm spice, herbs and tahini', image: IMG['x-middleeast'] },
  { id: 'caribbean', name: 'Caribbean Inspired', blurb: 'Allspice, coconut, scotch bonnet', image: IMG['x-caribbean'] },
  { id: 'east-african', name: 'East African', blurb: 'Berbere, coals and greens', image: IMG['x-eastafrican'] },
  { id: 'west-african', name: 'West African', blurb: 'Home ground — jollof to attiéké', image: IMG['x-westafrican'] },
  { id: 'global-fusion', name: 'Global Fusion', blurb: 'Borders ignored, on purpose', image: IMG['x-globalfusion'] },
  { id: 'east-asian', name: 'East Asian Fusion', blurb: 'Soy, sesame and fermentation', image: IMG['x-eastasian'] },
  { id: 'southeast-asian', name: 'Southeast Asian Flavours', blurb: 'Sour, sweet, hot, salty', image: IMG['x-southeastasian'] },
  { id: 'south-asian', name: 'South Asian', blurb: 'Masala built from the base up', image: IMG['x-southasian'] },
];

export function collectionById(id: string): Collection | undefined {
  return COLLECTIONS.find((c) => c.id === id);
}

export function cuisineById(id: string): Cuisine | undefined {
  return CUISINES.find((c) => c.id === id);
}

export function mealsInCollection(id: string): Meal[] {
  return MEALS.filter((m) => m.collections.includes(id));
}

export function mealsInCuisine(id: string): Meal[] {
  return MEALS.filter((m) => m.cuisine === id);
}

/** How many meals sit under a collection — shown on the explore cards. */
export function collectionCount(id: string): number {
  return mealsInCollection(id).length;
}

export function cuisineCount(id: string): number {
  return mealsInCuisine(id).length;
}

const DAY_MEALS: Record<number, { breakfast: string; lunch: string; dinner: string }> = {
  0: { breakfast: 'akara-pap', lunch: 'jollof-rice', dinner: 'pepper-soup' },
  1: { breakfast: 'yam-egg-sauce', lunch: 'burrito-bowl', dinner: 'efo-riro' },
  2: { breakfast: 'overnight-oats', lunch: 'fried-rice', dinner: 'green-curry' },
  3: { breakfast: 'moi-moi', lunch: 'shawarma-bowl', dinner: 'suya' },
  4: { breakfast: 'shakshuka', lunch: 'dodo-gizzard', dinner: 'salmon-donburi' },
  5: { breakfast: 'oats-agege', lunch: 'chana-masala', dinner: 'jerk-chicken' },
  6: { breakfast: 'peanut-smoothie-bowl', lunch: 'egusi-soup', dinner: 'okra-soup' },
};

export function mealById(id: string): Meal | undefined {
  return MEALS.find((m) => m.id === id);
}

/**
 * The plan for one weekday. `weekOffset` rotates the table so a later week is
 * not a carbon copy of this one — a stand-in until plans are generated per
 * user; every caller that omits it gets exactly the plan it always got.
 */
export function planForDay(
  weekday: number,
  weekOffset = 0
): { breakfast: Meal; lunch: Meal; dinner: Meal } {
  const shifted = (((weekday + weekOffset * 3) % 7) + 7) % 7;
  const plan = DAY_MEALS[shifted] ?? DAY_MEALS[0];
  const pick = (id: string, type: MealType) =>
    mealById(id) ?? MEALS.find((m) => m.mealType.includes(type))!;
  return {
    breakfast: pick(plan.breakfast, 'breakfast'),
    lunch: pick(plan.lunch, 'lunch'),
    dinner: pick(plan.dinner, 'dinner'),
  };
}

export function currentMealType(date = new Date()): MealType {
  const h = date.getHours();
  if (h < 11) return 'breakfast';
  if (h < 17) return 'lunch';
  return 'dinner';
}
