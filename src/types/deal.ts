export type Verdict = "go" | "caution" | "no-go";

export type Reason = {
  text: string;
  hopId: string;
  entityName: string;
  affinity: number;
};

export type ConceptView = {
  id: string;
  label: string;
  role: "challenger" | "control";
  verdict: Verdict | null;
  fitScore: number | null;
  headline: string;
  reasons: Reason[];
};

export type Memo = {
  winnerConceptId: string;
  summary: string;
  concepts: ConceptView[];
  landlordPitch: string;
  risks?: string[];
};

export type HopExplain = {
  inputId: string;
  inputName?: string;
  weight: number;
};

export type HopEntity = {
  entityId?: string;
  name: string;
  type: string;
  affinity: number | null;
  conceptId?: string;
  explain?: HopExplain[];
};

export type Hop = {
  id: string;
  purpose: string;
  filterType: string;
  location: string;
  entityCount: number | null;
  duration: string;
  entities: HopEntity[];
  warning?: string;
};

export type AnchorQuery = {
  query: string;
  type: string;
  entityId?: string;
};

export type DealConcept = {
  id: string;
  label: string;
  role: "challenger" | "control";
  anchorQueries: AnchorQuery[];
};

export type Deal = {
  id: string;
  presetId?: string;
  siteLabel: string;
  localityQuery: string;
  createdAt: string;
  ungrounded: boolean;
  insufficient: boolean;
  concepts: DealConcept[];
  hops: Hop[];
  memo: Memo | null;
  ungroundedCopy: string;
  qlooSource: "fixture" | "live" | "none";
};
