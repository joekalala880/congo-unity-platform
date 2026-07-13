// The original 8 hardcoded gallery items, reshaped for congoGalleryItems.
// Used only by the one-time admin "seed" action in CongoGallery.jsx —
// not read anywhere else at runtime. Nothing here is deleted or replaced
// by later phases; new items get their own seed/entry, these stay put.
const SEED_ITEMS = [
  {
    slug: "fally-ipupa",
    name: "Fally Ipupa",
    category: "Music",
    shortDescription:
      "A modern Congolese music icon who brought Congolese sound to the world.",
    localImageKey: "fally-ipupa",
    keywords: ["musician", "singer", "rumba"],
    aliases: ["Fally"],
    active: true,
    featured: true,
    verified: true,
  },
  {
    slug: "koffi-olomide",
    name: "Koffi Olomidé",
    category: "Music",
    shortDescription:
      "One of the major voices of Congolese rumba and African music.",
    localImageKey: "koffi-olomide",
    keywords: ["musician", "rumba"],
    aliases: ["Koffi"],
    active: true,
    featured: false,
    verified: true,
  },
  {
    slug: "franco-luambo",
    name: "Franco Luambo",
    category: "Music",
    shortDescription:
      "A legendary figure whose music helped shape Congolese identity.",
    localImageKey: "franco-luambo",
    keywords: ["musician", "rumba", "tpok jazz"],
    aliases: ["Franco"],
    active: true,
    featured: false,
    verified: true,
  },
  {
    slug: "joseph-kabila",
    name: "Joseph Kabila",
    category: "History",
    subcategory: "Political Figure",
    shortDescription:
      "A political figure connected to an important chapter of Congo’s modern history.",
    localImageKey: "joseph-kabila",
    keywords: ["president", "politics"],
    aliases: [],
    active: true,
    featured: false,
    verified: true,
  },
  {
    slug: "kinshasa",
    name: "Kinshasa",
    category: "Cities",
    province: "Kinshasa",
    country: "DR Congo",
    shortDescription:
      "The capital city, full of energy, music, politics, creativity, and movement.",
    localImageKey: "kinshasa",
    keywords: ["capital", "city"],
    active: true,
    featured: true,
    verified: true,
  },
  {
    slug: "boulevard-du-30-juin",
    name: "Boulevard du 30 Juin",
    category: "Cities",
    city: "Kinshasa",
    country: "DR Congo",
    shortDescription:
      "One of Kinshasa’s most symbolic roads, representing movement and national life.",
    localImageKey: "boulevard-du-30-juin",
    keywords: ["boulevard", "30 juin", "kinshasa"],
    active: true,
    featured: false,
    verified: true,
  },
  {
    slug: "eastern-congo",
    name: "Eastern Congo",
    category: "History",
    subcategory: "Memory & Crisis",
    shortDescription:
      "A place of pain, resilience, and courage. Congo Unity remembers the East.",
    localImageKey: "eastern-congo",
    keywords: ["crisis", "kivu", "memory"],
    active: true,
    featured: false,
    verified: true,
  },
  {
    slug: "flag-of-the-drc",
    name: "Flag of the DRC",
    category: "Culture",
    subcategory: "National Symbol",
    shortDescription:
      "The flag reminds us that we are one people, even when everything tries to divide us.",
    localImageKey: "flag-of-the-drc",
    keywords: ["flag", "symbol", "national"],
    active: true,
    featured: true,
    verified: true,
  },
];

export default SEED_ITEMS;
