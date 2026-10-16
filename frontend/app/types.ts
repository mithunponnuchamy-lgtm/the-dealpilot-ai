export type Terms = {
  deliverables: string[];
  exclusions: string[];
  amount_cents: number;
  currency: 'USD';
  delivery_days: number;
  revisions: number;
  payment_terms: string;
};

export type Offer = {
  id: string;
  version: number;
  terms: Terms;
  author: string;
  rejected: boolean;
  approvals: string[];
  changes: Record<string, { before: unknown; after: unknown }>;
};

export type Deal = {
  id: string;
  title: string;
  client: string;
  freelancer: string;
  asking_cents: number;
  minimum_cents?: number;
  role: string;
  status: string;
  frozen: boolean;
  cancelled: boolean;
  requirements: string;
  extraction: {
    description: string;
    deliverables: string[];
    budget_usd: number | null;
    deadline: string | null;
    missing_information: string[];
    assumptions: string[];
  } | null;
  offers: Offer[];
  payment: {
    status: string;
    order_id: string | null;
    capture_id: string | null;
    offer_id: string;
    paid_at: string | null;
    approval_url?: string | null;
  } | null;
  events: { role: string; message: string; created_at: string }[];
};

export type RiskItem = {
  title: string;
  category: string;
  severity: 'low' | 'medium' | 'high';
  explanation: string;
  fields: string[];
  recommendation: string;
};

export type CounterofferOption = {
  name: string;
  strategy: 'maintain_scope' | 'maintain_budget' | 'balanced_compromise';
  summary: string;
  amount_cents: number;
  delivery_days: number;
  revisions: number;
  deliverables: string[];
  exclusions: string[];
  reasoning: string;
};

export type RiskAnalysis = {
  overall_assessment: string;
  risks: RiskItem[];
  options: CounterofferOption[];
  provider: string;
};

export type Suggestion = {
  recommendation: string;
  tradeoffs: string[];
  questions: string[];
  overall_assessment?: string;
  risks?: RiskItem[];
  options?: CounterofferOption[];
  provider?: string;
};
