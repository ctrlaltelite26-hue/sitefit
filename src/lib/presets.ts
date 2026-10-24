import type { Hop, Memo } from "@/types/deal";

export type Preset = {
  id: string;
  eyebrow: string;
  title: string;
  line: string;
  note: string;
  siteLabel: string;
  localityQuery: string;
  hops: Hop[];
  memo: Memo;
  ungroundedCopy: string;
  /** Hidden when a live run cannot resolve the concept. */
  onDesk?: boolean;
};

const westVillageHops: Hop[] = [
  {
    id: "wv-site-places",
    purpose: "Resolve site",
    filterType: "place",
    location: "West Village",
    entityCount: 8,
    duration: "1.2s",
    entities: [
      { name: "Via Carota", type: "place", affinity: 0.84 },
      { name: "I Sodi", type: "place", affinity: 0.79 },
      { name: "Dante", type: "place", affinity: 0.61 },
    ],
  },
  {
    id: "wv-concepts",
    purpose: "Resolve concepts",
    filterType: "place, brand",
    location: "anchors",
    entityCount: 4,
    duration: "0.8s",
    entities: [],
  },
  {
    id: "wv-brands",
    purpose: "Neighborhood taste",
    filterType: "brand",
    location: "West Village",
    entityCount: 8,
    duration: "1.4s",
    entities: [
      { name: "Natural wine label", type: "brand", affinity: 0.71 },
      { name: "Independent ceramics brand", type: "brand", affinity: 0.54 },
    ],
  },
  {
    id: "wv-artists",
    purpose: "Neighborhood taste",
    filterType: "artist",
    location: "West Village",
    entityCount: 6,
    duration: "1.1s",
    entities: [
      { name: "Neighborhood artist", type: "artist", affinity: 0.48 },
      { name: "Chamber film", type: "movie", affinity: 0.44 },
    ],
  },
  {
    id: "wv-score-a",
    purpose: "Score concept A",
    filterType: "place, brand",
    location: "West Village",
    entityCount: 3,
    duration: "1.6s",
    entities: [
      { name: "Via Carota", type: "place", affinity: 0.84, conceptId: "wv-a" },
      { name: "I Sodi", type: "place", affinity: 0.79, conceptId: "wv-a" },
      {
        name: "Natural wine label",
        type: "brand",
        affinity: 0.71,
        conceptId: "wv-a",
        explain: [{ inputId: "fixture:place:via-carota", inputName: "Via Carota", weight: 0.64 }],
      },
    ],
  },
  {
    id: "wv-score-b",
    purpose: "Score concept B",
    filterType: "place, brand",
    location: "West Village",
    entityCount: 2,
    duration: "1.5s",
    entities: [
      { name: "Sports-bar comp", type: "place", affinity: 0.28, conceptId: "wv-b" },
      { name: "Sports-bar brand", type: "brand", affinity: 0.22, conceptId: "wv-b" },
    ],
  },
  {
    id: "wv-memo",
    purpose: "Write memo",
    filterType: "memo",
    location: "West Village",
    entityCount: null,
    duration: "2.1s",
    entities: [],
  },
];

const westVillageMemo: Memo = {
  winnerConceptId: "wv-a",
  summary:
    "Natural wine / small plates scores 82. A sports bar on the same corner scores 31. The block's places and brands line up with the wine room. They do not line up with the sports bar.",
  landlordPitch:
    "We would not put a sports bar on this corner. The cultural neighbors are small dining rooms and a wine brand, led by Via Carota at 0.84. A natural wine and small-plates concept fits the block. A sports bar does not. Sign the wine concept. Pass on the sports bar.",
  concepts: [
    {
      id: "wv-a",
      label: "Natural wine / small plates",
      role: "challenger",
      verdict: "go",
      fitScore: 82,
      headline: "The corner already eats like this.",
      reasons: [
        {
          text: "Nearby rooms over-index toward Via Carota and I Sodi.",
          hopId: "wv-score-a",
          entityName: "Via Carota",
          affinity: 0.84,
        },
        {
          text: "I Sodi sits in the same band.",
          hopId: "wv-score-a",
          entityName: "I Sodi",
          affinity: 0.79,
        },
        {
          text: "A natural-wine brand clears the block.",
          hopId: "wv-brands",
          entityName: "Natural wine label",
          affinity: 0.71,
        },
      ],
    },
    {
      id: "wv-b",
      label: "Sports bar",
      role: "control",
      verdict: "no-go",
      fitScore: 31,
      headline: "The block does not support this room.",
      reasons: [
        {
          text: "Place affinity on this corner peaks well below the wine room.",
          hopId: "wv-score-b",
          entityName: "Sports-bar comp",
          affinity: 0.28,
        },
        {
          text: "No sports-bar brand clears the locality.",
          hopId: "wv-score-b",
          entityName: "Sports-bar brand",
          affinity: 0.22,
        },
        {
          text: "Neighborhood taste returns restaurants, brands, and artists, not sports rooms.",
          hopId: "wv-artists",
          entityName: "Neighborhood artist",
          affinity: 0.48,
        },
      ],
    },
  ],
};

export const PRESETS: Preset[] = [
  {
    id: "west-village-wine-vs-sports",
    eyebrow: "WEST VILLAGE, NYC",
    title: "Wine bar vs sports bar",
    line: "Natural wine / small plates  ·  Sports bar",
    note: "Quiet taste against a generic room, same corner.",
    siteLabel: "West Village corner",
    localityQuery: "West Village",
    hops: westVillageHops,
    memo: westVillageMemo,
    ungroundedCopy:
      "A natural wine bar feels like the quieter room for a West Village corner, and a sports bar feels like a louder import. This is a guess. No affinity was cited.",
  },
  {
    id: "williamsburg-athleisure-vs-outlet",
    eyebrow: "WILLIAMSBURG, BROOKLYN",
    title: "Athleisure vs outlet",
    line: "Contemporary apparel  ·  Off-price",
    note: "Tenant mix, not another restaurant.",
    siteLabel: "Williamsburg, N 6th",
    localityQuery: "Williamsburg",
    hops: [
      {
        id: "wb-places",
        purpose: "Resolve site",
        filterType: "place",
        location: "Williamsburg",
        entityCount: 8,
        duration: "1.1s",
        entities: [{ name: "Neighborhood boutique", type: "place", affinity: 0.66, conceptId: "wb-a" }],
      },
      {
        id: "wb-brands",
        purpose: "Neighborhood taste",
        filterType: "brand",
        location: "Williamsburg",
        entityCount: 7,
        duration: "1.3s",
        entities: [
          { name: "Contemporary apparel brand", type: "brand", affinity: 0.77, conceptId: "wb-a" },
          { name: "Off-price brand", type: "brand", affinity: 0.31, conceptId: "wb-b" },
        ],
      },
      {
        id: "wb-artists",
        purpose: "Neighborhood taste",
        filterType: "artist",
        location: "Williamsburg",
        entityCount: 5,
        duration: "1.0s",
        entities: [{ name: "Block artist", type: "artist", affinity: 0.42 }],
      },
      {
        id: "wb-memo",
        purpose: "Write memo",
        filterType: "memo",
        location: "Williamsburg",
        entityCount: null,
        duration: "1.8s",
        entities: [],
      },
    ],
    memo: {
      winnerConceptId: "wb-a",
      summary:
        "Contemporary apparel scores 76. Off-price on the same street scores 36. The block's brands line up with a contemporary tenant. They do not line up with an outlet.",
      landlordPitch:
        "Put the contemporary apparel concept on this street. The brand hop is led by a contemporary label at 0.77. An off-price brand sits at 0.31. Sign the contemporary tenant. Pass on the outlet.",
      concepts: [
        {
          id: "wb-a",
          label: "Contemporary apparel",
          role: "challenger",
          verdict: "go",
          fitScore: 76,
          headline: "The street already dresses like this.",
          reasons: [
            {
              text: "A contemporary apparel brand clears the block.",
              hopId: "wb-brands",
              entityName: "Contemporary apparel brand",
              affinity: 0.77,
            },
            {
              text: "A nearby boutique sits in the same band.",
              hopId: "wb-places",
              entityName: "Neighborhood boutique",
              affinity: 0.66,
            },
          ],
        },
        {
          id: "wb-b",
          label: "Off-price",
          role: "control",
          verdict: "no-go",
          fitScore: 36,
          headline: "Outlet product does not match this tenant mix.",
          reasons: [
            {
              text: "The off-price brand does not clear the locality.",
              hopId: "wb-brands",
              entityName: "Off-price brand",
              affinity: 0.31,
            },
            {
              text: "Neighborhood taste returns a boutique and an artist, not an outlet floor.",
              hopId: "wb-artists",
              entityName: "Block artist",
              affinity: 0.42,
            },
          ],
        },
      ],
    },
    ungroundedCopy:
      "Athleisure feels more like Williamsburg than an outlet store. This is a guess. No affinity was cited.",
  },
  {
    id: "silver-lake-natural-vs-chain",
    eyebrow: "SILVER LAKE, LA",
    title: "Coffee and wine vs fast casual",
    line: "Independent hybrid  ·  National chain",
    note: "A west-coast block, same question.",
    siteLabel: "Silver Lake, Sunset",
    localityQuery: "Silver Lake, Los Angeles",
    onDesk: false,
    hops: [
      {
        id: "sl-places",
        purpose: "Resolve site",
        filterType: "place",
        location: "Silver Lake",
        entityCount: 8,
        duration: "1.4s",
        entities: [{ name: "Independent wine café", type: "place", affinity: 0.8, conceptId: "sl-a" }],
      },
      {
        id: "sl-brands",
        purpose: "Neighborhood taste",
        filterType: "brand",
        location: "Silver Lake",
        entityCount: 6,
        duration: "1.2s",
        entities: [
          { name: "Small coffee roaster", type: "brand", affinity: 0.73, conceptId: "sl-a" },
          { name: "National fast-casual brand", type: "brand", affinity: 0.24, conceptId: "sl-b" },
        ],
      },
      {
        id: "sl-film",
        purpose: "Neighborhood taste",
        filterType: "movie",
        location: "Silver Lake",
        entityCount: 4,
        duration: "0.9s",
        entities: [{ name: "Neighborhood film", type: "movie", affinity: 0.46 }],
      },
      {
        id: "sl-memo",
        purpose: "Write memo",
        filterType: "memo",
        location: "Silver Lake",
        entityCount: null,
        duration: "1.7s",
        entities: [],
      },
    ],
    memo: {
      winnerConceptId: "sl-a",
      summary:
        "An independent coffee and wine hybrid scores 81. A national fast-casual chain on the same block scores 29. Places and brands line up with the hybrid. They do not line up with the chain.",
      landlordPitch:
        "Sign the independent hybrid. The place hop is led by an independent wine café at 0.80, and a small roaster clears 0.73. The national fast-casual brand sits at 0.24. Pass on the chain.",
      concepts: [
        {
          id: "sl-a",
          label: "Independent coffee + wine",
          role: "challenger",
          verdict: "go",
          fitScore: 81,
          headline: "The block already runs this hybrid.",
          reasons: [
            {
              text: "An independent wine café leads the place hop.",
              hopId: "sl-places",
              entityName: "Independent wine café",
              affinity: 0.8,
            },
            {
              text: "A small coffee roaster clears the brand hop.",
              hopId: "sl-brands",
              entityName: "Small coffee roaster",
              affinity: 0.73,
            },
          ],
        },
        {
          id: "sl-b",
          label: "National fast-casual chain",
          role: "control",
          verdict: "no-go",
          fitScore: 29,
          headline: "The chain does not match this block.",
          reasons: [
            {
              text: "The national fast-casual brand does not clear the locality.",
              hopId: "sl-brands",
              entityName: "National fast-casual brand",
              affinity: 0.24,
            },
            {
              text: "Neighborhood taste includes a film, not a chain dining room.",
              hopId: "sl-film",
              entityName: "Neighborhood film",
              affinity: 0.46,
            },
          ],
        },
      ],
    },
    ungroundedCopy:
      "An independent coffee and wine room feels more like Silver Lake than a national fast-casual chain. This is a guess. No affinity was cited.",
  },
];

export type PresetAnchor = {
  conceptId: string;
  role: "challenger" | "control";
  query: string;
  type: "urn:entity:place" | "urn:entity:brand";
  entityId?: string;
};

/** Names resolved on the hackathon host. entityId is the exact-name hit, not a saved response. */
export const PRESET_ANCHORS: Record<string, PresetAnchor[]> = {
  "west-village-wine-vs-sports": [
    {
      conceptId: "wv-a",
      role: "challenger",
      query: "Via Carota",
      type: "urn:entity:place",
      entityId: "3F659C60-D199-4E55-9B72-62DEEFB6AA11",
    },
    {
      conceptId: "wv-a",
      role: "challenger",
      query: "I Sodi",
      type: "urn:entity:place",
      entityId: "A156C577-7C0A-4276-9282-763DDCDAF139",
    },
    {
      conceptId: "wv-b",
      role: "control",
      query: "The Windsor",
      type: "urn:entity:place",
      entityId: "A14B7643-447A-4130-BE22-ED9D7148757D",
    },
    {
      conceptId: "wv-b",
      role: "control",
      query: "Buffalo Wild Wings",
      type: "urn:entity:brand",
      entityId: "D9E4D872-7E4D-4E5A-B94F-FFD25B7D98C2",
    },
  ],
  "williamsburg-athleisure-vs-outlet": [
    {
      conceptId: "wb-a",
      role: "challenger",
      query: "Madewell",
      type: "urn:entity:brand",
      entityId: "632FE105-DF1C-4279-85BD-5E86858E5981",
    },
    {
      conceptId: "wb-a",
      role: "challenger",
      query: "Lululemon",
      type: "urn:entity:brand",
      entityId: "D9B9B404-7B35-4E4B-A0CE-4CAB8155FE9E",
    },
    {
      conceptId: "wb-b",
      role: "control",
      query: "T.J. Maxx",
      type: "urn:entity:brand",
      entityId: "A94FC7B6-34D3-4970-9EA5-2D17C49E84B6",
    },
    {
      conceptId: "wb-b",
      role: "control",
      query: "Marshalls",
      type: "urn:entity:brand",
      entityId: "A7E4F56C-19A7-4166-A4EA-EC77A59C3DC9",
    },
  ],
  "silver-lake-natural-vs-chain": [
    { conceptId: "sl-a", role: "challenger", query: "Seco", type: "urn:entity:place" },
    { conceptId: "sl-a", role: "challenger", query: "Barr Seco", type: "urn:entity:place" },
    {
      conceptId: "sl-b",
      role: "control",
      query: "Shake Shack",
      type: "urn:entity:brand",
      entityId: "AB3A329B-CF72-468C-A5EE-9CCB29C17EF8",
    },
    {
      conceptId: "sl-b",
      role: "control",
      query: "Chipotle",
      type: "urn:entity:brand",
      entityId: "4CFF9589-5168-48BD-88F0-D0826466F37D",
    },
  ],
};

export function getPreset(id: string) {
  return PRESETS.find((preset) => preset.id === id);
}

export function conceptsForPreset(presetId: string) {
  const preset = getPreset(presetId);
  const anchors = PRESET_ANCHORS[presetId];
  if (!preset || !anchors) return null;
  return preset.memo.concepts.map((concept) => ({
    id: concept.id,
    label: concept.label,
    role: concept.role,
    anchorQueries: anchors
      .filter((anchor) => anchor.conceptId === concept.id)
      .map((anchor) => ({ query: anchor.query, type: anchor.type, entityId: anchor.entityId })),
  }));
}
