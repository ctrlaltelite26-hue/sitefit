// Back-test cases researched Oct 23, 2026. Our own data; no Qloo payloads.
// Outcome fields are for scoring AFTER the blind run; never pass them to the agent.
export type BacktestCase = {
  id: string;
  locality: string;
  survivor: { label: string; anchorQueries: string[] };
  closed: { label: string; anchorQueries: string[]; closedYear: number };
  sources: string[];
};

export type AgentBacktestInput = {
  id: string;
  locality: string;
  concepts: { label: string; anchorQueries: string[] }[];
};

/** Locality and concept names only. Omits closedYear, sources, and which side survived. */
export function toAgentInput(testCase: BacktestCase): AgentBacktestInput {
  return {
    id: testCase.id,
    locality: testCase.locality,
    concepts: [testCase.survivor, testCase.closed].map((concept) => ({
      label: concept.label,
      anchorQueries: concept.anchorQueries,
    })),
  };
}

export const BACKTEST_CASES: BacktestCase[] = [
  {
    id: "wv-buvette-vs-windsor",
    locality: "West Village",
    survivor: {
      label: "Buvette (wine bar / small plates, 42 Grove St, opened 2011)",
      anchorQueries: ["Buvette"],
    },
    closed: {
      label: "The Windsor (upscale sports bar, 234 W 4th St, 2010–2015)",
      anchorQueries: ["The Windsor"],
      closedYear: 2015,
    },
    sources: [
      "https://ilovebuvette.com/eat-drink-newyork-location",
      "https://www.grubstreet.com/2011/01/buvette.html",
      "https://ny.eater.com/2011/2/1/6699295/opening-alert",
      "https://www.grubstreet.com/2010/10/first_look_at_the_windsor_the.html",
      "https://ny.eater.com/2010/10/27/6712899/nightlife-opening-report-the-windsor-snap-and-more",
      "https://ny.eater.com/2015/3/4/8148903/upscale-sports-bar-the-windsor-temporarily-shuts-its-doors-in-the",
      "https://ny.eater.com/2015/4/23/8478709/the-final-remains-of-posh-sports-bar-the-windsor-auctioned-off",
    ],
  },
  {
    id: "wv-fairfax-vs-riviera",
    locality: "West Village",
    survivor: {
      label: "Fairfax (all-day café / wine bar, 234 W 4th St, opened 2017)",
      anchorQueries: ["Fairfax"],
    },
    closed: {
      label: "Riviera Cafe & Sports Bar (225 W 4th St, c.1969–2017)",
      anchorQueries: ["Riviera Cafe"],
      closedYear: 2017,
    },
    sources: [
      "https://www.fairfax.nyc/location/fairfax/",
      "https://ny.eater.com/2017/8/1/16078330/fairfax-wine-bar-open-west-village-gabriel-stulman",
      "https://www.grubstreet.com/2017/08/gabriel-stulman-opens-fairfax.html",
      "https://www.happycookingnyc.com/our-story/",
      "https://gothamist.com/food/riviera-cafe-will-shut-down-after-48-years-in-the-west-village",
      "https://www.grubstreet.com/2017/08/nycs-rivieria-caf-and-sports-bar-will-close.html",
      "https://ny.eater.com/2018/3/8/17097872/john-fraser-riviera-cafe-west-village",
      "https://westviewnews.org/2022/06/04/in-and-out-69/gcapsis/",
    ],
  },
  {
    id: "wb-madewell-vs-urban-outfitters",
    locality: "Williamsburg",
    survivor: {
      label: "Madewell Williamsburg (contemporary apparel, N 6th St, opened 2014)",
      anchorQueries: ["Madewell"],
    },
    closed: {
      label: "Urban Outfitters / Space Ninety 8 (98 N 6th St, 2014–2024)",
      anchorQueries: ["Urban Outfitters"],
      closedYear: 2024,
    },
    sources: [
      "https://www.madewell.com/store-locator/store/madewell/3024/",
      "https://www.brownstoner.com/brooklyn-life/madewell-opens-in-its-williamsburg-store-wednesday/",
      "https://www.brownstoner.com/brooklyn-life/urban-outfitters-williamsburg-store-closes-98-north-6th-street/",
      "https://www.brooklynpaper.com/urban-outfitters-shutters-williamsburg-store/",
    ],
  },
  {
    id: "wb-lululemon-vs-aland",
    locality: "Williamsburg",
    survivor: {
      label: "Lululemon Williamsburg (athleisure, 129 N 6th St, opened 2017)",
      anchorQueries: ["Lululemon"],
    },
    closed: {
      label: "Aland flagship (Korean fast-fashion multi-brand, 92 N 6th St, 2018–c.2023)",
      anchorQueries: ["Aland"],
      closedYear: 2023,
    },
    sources: [
      "https://shop.lululemon.com/stores/us/brooklyn/williamsburg",
      "https://www.bkmag.com/2017/07/19/lululemon-open-new-store-williamsburg/",
      "https://www.amny.com/entertainment/things-to-do/lululemon-opening-new-stores-in-midtown-williamsburg-on-july-21-1-13807896/",
      "https://therealdeal.com/new-york/2017/01/12/lululemon-korean-retailer-ink-leases-on-wburgs-ascending-north-6th-st/",
      "https://www.brownstoner.com/real-estate-market/brooklyn-retail-real-estate-store-openings-williamsburg-warby-parker-everlane-madewell-mens/",
      "https://www.l3capital.com/property-portfolio/92-94-n-6th-st/",
      "https://www.brownstoner.com/brooklyn-life/urban-outfitters-williamsburg-store-closes-98-north-6th-street/",
      "https://www.alandusa.com/pages/store-location",
    ],
  },
  {
    id: "sl-seco-vs-shake-shack",
    locality: "Silver Lake, Los Angeles",
    survivor: {
      label:
        "Seco / Barr Seco (café by day, natural wine bar by night, 3820 Sunset Blvd, opened 2024)",
      anchorQueries: ["Seco", "Barr Seco"],
    },
    closed: {
      label: "Shake Shack Silver Lake (3903 W Sunset Blvd, 2022–2024)",
      anchorQueries: ["Shake Shack"],
      closedYear: 2024,
    },
    sources: [
      "https://la.eater.com/2024/9/4/24236191/barr-seco-silver-lake-wine-bar-restaurant-los-angeles",
      "https://resy.com/cities/los-angeles-ca/venues/seco-silverlake",
      "https://www.yelp.com/biz/seco-los-angeles",
      "https://www.theeastsiderla.com/eastsider_on_the_go/restaurants_and_bars/35-japanese-breakfast-take-home-turkey-dinners-shake-shack-silver-lake-opens/article_ed30198c-65d8-11ed-ba20-372574037cf6.html",
      "https://whatnow.com/los-angeles/restaurants/shake-shack-opening-in-silver-lake-by-end-of-the-year/",
      "https://abc7.com/post/shake-shack-closing-9-underperforming-locations-including-5-los-angeles/15244525/",
    ],
  },
  {
    id: "sl-bandini-vs-starbucks-mohawk",
    locality: "Echo Park",
    survivor: {
      label: "Bar Bandini (natural wine + craft beer, 2150 W Sunset Blvd, opened 2015)",
      anchorQueries: ["Bar Bandini"],
    },
    closed: {
      label: "Starbucks Sunset Blvd & Mohawk (2134 W Sunset Blvd, 2018–2025)",
      anchorQueries: ["Starbucks"],
      closedYear: 2025,
    },
    sources: [
      "https://www.barbandini.com/",
      "https://la.eater.com/2015/10/8/9481661/bandini-wine-bar-in-echo-park",
      "https://www.starbuckseverywhere.net/StarbucksPossibleClosures_Sep2025.htm",
      "https://www.foxla.com/news/starbucks-list-store-closures-california",
    ],
  },
];
