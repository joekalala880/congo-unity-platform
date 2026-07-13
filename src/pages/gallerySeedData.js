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

  // ---- Phase 2 additions below: no local photo exists for these 7, so
  // each uses a verified, freely-licensed image from Wikimedia Commons
  // instead (license + photographer checked individually, not assumed —
  // see sourceUrl/sourceName for attribution). Dates are only included
  // where a specific source confirmed them; left blank otherwise rather
  // than guessed.
  {
    slug: "werrason",
    name: "Werrason",
    category: "Music",
    subcategory: "Soukous / Ndombolo",
    shortDescription:
      "Congolese musician and bandleader of Wenge Musica Maison Mère, originally part of Wenge Musica; one of the leading soukous/ndombolo artists of the 1990s–2000s.",
    birthDate: "1965",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/8e/Werrason.jpg",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Werrason.jpg",
    sourceName: "Photo via Wikimedia Commons (CC BY-SA)",
    keywords: ["musician", "wenge musica", "soukous", "ndombolo"],
    aliases: [],
    active: true,
    featured: false,
    verified: true,
  },
  {
    slug: "papa-wemba",
    name: "Papa Wemba",
    category: "Music",
    subcategory: "Rumba Rock",
    shortDescription:
      "Congolese singer and a founding figure of \"Congolese rumba rock,\" closely associated with the Sape fashion movement; co-founded Zaiko Langa Langa before leading his own groups.",
    birthDate: "1949-06-14",
    deathDate: "2016-04-24",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/6/63/Papa_Wemba.jpg",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Papa_Wemba.jpg",
    sourceName: "Photo: Radio Okapi via Wikimedia Commons (CC BY 2.0)",
    keywords: ["musician", "zaiko langa langa", "sape", "rumba rock"],
    aliases: [],
    active: true,
    featured: false,
    verified: true,
  },
  {
    slug: "tabu-ley-rochereau",
    name: "Tabu Ley Rochereau",
    category: "Music",
    subcategory: "Rumba",
    shortDescription:
      "Legendary singer and bandleader (African Fiesta, later Afrisa International); one of the most important figures of Congolese rumba's golden era from the 1960s onward.",
    birthDate: "1940-11-13",
    deathDate: "2013-11-30",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/6/66/Press_photo_of_Tabu_Ley_Rochereau_in_San_Francisco_%281980%29.jpg",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Press_photo_of_Tabu_Ley_Rochereau_in_San_Francisco_(1980).jpg",
    sourceName: "Photo: Philip Gould / The Rosebud Agency, via Wikimedia Commons (public domain)",
    keywords: ["musician", "african fiesta", "afrisa international", "rumba"],
    aliases: ["Rochereau"],
    active: true,
    featured: false,
    verified: true,
  },
  {
    slug: "tshala-muana",
    name: "Tshala Muana",
    category: "Music",
    subcategory: "Mutuashi",
    shortDescription:
      "Celebrated singer and dancer known as the \"Queen of Mutuashi,\" a traditional Congolese dance she helped popularize internationally; prominent from the 1980s.",
    birthDate: "1958-03-13",
    deathDate: "2022-12-10",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/8c/Tshala_muana_2015.jpg",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Tshala_muana_2015.jpg",
    sourceName: "Photo via Wikimedia Commons (CC BY-SA 4.0)",
    keywords: ["musician", "dancer", "mutuashi"],
    aliases: [],
    active: true,
    featured: false,
    verified: true,
  },
  {
    slug: "mbilia-bel",
    name: "Mbilia Bel",
    category: "Music",
    subcategory: "Rumba",
    shortDescription:
      "Congolese singer, one of the most prominent female voices in Congolese rumba; rose to fame performing with Tabu Ley Rochereau's Afrisa International in the 1980s before a solo career.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/a/ae/Mbilia_Bel%2C_Zaire.jpg",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Mbilia_Bel,_Zaire.jpg",
    sourceName: "Photo via Wikimedia Commons (public domain, CC0)",
    keywords: ["musician", "afrisa international", "rumba"],
    aliases: ["M'bilia Bel"],
    active: true,
    featured: false,
    verified: true,
  },
  {
    slug: "ferre-gola",
    name: "Ferre Gola",
    category: "Music",
    subcategory: "Rumba / Ndombolo",
    shortDescription:
      "Congolese singer and former member of Wenge Musica BCBG, known for his vocal range; a prominent rumba/ndombolo artist since the 2000s.",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/f/f1/Ferr%C3%A9_Gola_2024_performance.jpg",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Ferr%C3%A9_Gola_2024_performance.jpg",
    sourceName: "Photo via Wikimedia Commons (CC BY 4.0)",
    keywords: ["musician", "wenge musica bcbg", "ndombolo"],
    aliases: ["Ferré Gola"],
    active: true,
    featured: false,
    verified: true,
  },
  {
    slug: "innossb",
    name: "Innoss'B",
    category: "Music",
    subcategory: "Afrobeat / Hip-Hop",
    shortDescription:
      "Contemporary Congolese singer, part of a newer generation blending Congolese rumba with Afrobeat and hip-hop influences.",
    birthDate: "1997-05-05",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/6/67/Innoss%27B_%2821600557166%29.jpg",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Innoss'B_(21600557166).jpg",
    sourceName: "Photo: Abel Kavanagh / MONUSCO, via Wikimedia Commons (CC BY-SA 2.0)",
    keywords: ["musician", "rapper", "afrobeat"],
    aliases: ["Innoss B", "Innocent Balume"],
    active: true,
    featured: false,
    verified: true,
  },
];

export default SEED_ITEMS;
