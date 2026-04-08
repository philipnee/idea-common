export type FireLevel = 0 | 1 | 2 | 3 | 4 | 5;
export type IdeaTagSource = "ai" | "fallback" | "mixed" | "seed";

export interface IdeaRecord {
  id: string;
  idea: string;
  details: string | null;
  externalLink: string | null;
  kind: string | null;
  topic: string | null;
  tagSource: IdeaTagSource | null;
  taggedAt: string | null;
  heat: number;
  heatDate: string | null;
  fireCount: number;
  submitKey: string;
  contentHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface FireRecord {
  id: string;
  ideaId: string;
  userFingerprint: string;
  createdAt: string;
}

export interface ViewRecord {
  id: string;
  ideaId: string;
  userFingerprint: string;
  createdAt: string;
}

export interface PostAttemptRecord {
  id: string;
  submitKey: string;
  contentHash: string | null;
  outcome:
    | "success"
    | "honeypot"
    | "invalid_token"
    | "too_fast"
    | "expired_token"
    | "rate_limited"
    | "duplicate"
    | "challenge_required"
    | "challenge_failed";
  createdAt: string;
}

export interface StoreShape {
  ideas: IdeaRecord[];
  fires: FireRecord[];
  views: ViewRecord[];
  postAttempts: PostAttemptRecord[];
}

export interface IdeaSummary {
  id: string;
  idea: string;
  excerpt: string | null;
  heat: number;
  fireLevel: FireLevel;
  createdAt: string;
  externalLink: string | null;
  kind: string | null;
  topic: string | null;
  tagSource: IdeaTagSource | null;
}

export interface IdeaDetail extends IdeaSummary {
  details: string | null;
  viewerCanFire: boolean;
  nextFireAt: string | null;
}

export interface CreateIdeaInput {
  idea: string;
  details?: string | null;
  externalLink?: string | null;
  postToken: string;
  website?: string | null;
  turnstileToken?: string | null;
}

export interface CreateIdeaResult {
  ok: boolean;
  status: number;
  message?: string;
  id?: string;
  challengeRequired?: boolean;
}

export interface FireIdeaResult {
  ok: boolean;
  status: number;
  cooldownActive?: boolean;
  fireLevel?: FireLevel;
  nextFireAt?: string | null;
}
