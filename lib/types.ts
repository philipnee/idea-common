export type FireState = "none" | "warm" | "hot" | "on_fire";

export interface IdeaRecord {
  id: string;
  idea: string;
  details: string | null;
  heat: number;
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
  postAttempts: PostAttemptRecord[];
}

export interface IdeaSummary {
  id: string;
  idea: string;
  heat: number;
  fireState: FireState;
  createdAt: string;
}

export interface IdeaDetail extends IdeaSummary {
  details: string | null;
  viewerHasFired: boolean;
}

export interface CreateIdeaInput {
  idea: string;
  details?: string | null;
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
  alreadyFired?: boolean;
  fireState?: FireState;
}

