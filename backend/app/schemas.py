from typing import Annotated, Literal
from pydantic import BaseModel, ConfigDict, Field, StringConstraints
Text = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=2000)]
Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
class Strict(BaseModel):
    model_config = ConfigDict(extra='forbid')
class DealCreate(Strict):
    title: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=160)]
    client: Name
    freelancer: Name
    asking_cents: int = Field(gt=0, le=100000000, strict=True)
    minimum_cents: int = Field(ge=0, le=100000000, strict=True)
class Terms(Strict):
    deliverables: list[Text] = Field(min_length=1, max_length=30)
    exclusions: list[Text] = Field(max_length=30)
    amount_cents: int = Field(gt=0, le=100000000, strict=True)
    currency: Literal['USD'] = 'USD'
    delivery_days: int = Field(gt=0, le=365, strict=True)
    revisions: int = Field(ge=0, le=20, strict=True)
    payment_terms: Literal['Full payment upfront; work starts after payment.'] = 'Full payment upfront; work starts after payment.'
class OfferCreate(Strict):
    expected_version: int = Field(ge=0)
    terms: Terms
class VersionAction(Strict):
    version: int = Field(gt=0)
class Message(Strict):
    text: Text
class Extraction(Strict):
    title: str | None
    description: str
    deliverables: list[str]
    budget_usd: float | None = Field(ge=0, le=1000000)
    deadline: str | None
    requirements: list[str]
    missing_information: list[str]
    assumptions: list[str]
class RiskItem(Strict):
    title: str
    category: Literal[
        'scope_creep',
        'pricing_imbalance',
        'timeline_pressure',
        'revision_risk',
        'payment_ambiguity',
        'missing_deliverables',
        'contradictory_terms',
        'agreement_uncertainty'
    ]
    severity: Literal['low', 'medium', 'high']
    explanation: str
    fields: list[str]
    recommendation: str

class CounterofferOption(Strict):
    name: str
    strategy: Literal['maintain_scope', 'maintain_budget', 'balanced_compromise']
    summary: str
    amount_cents: int = Field(gt=0, le=100000000)
    delivery_days: int = Field(gt=0, le=365)
    revisions: int = Field(ge=0, le=20)
    deliverables: list[str]
    exclusions: list[str]
    reasoning: str

class RiskAnalysis(Strict):
    overall_assessment: str
    risks: list[RiskItem]
    options: list[CounterofferOption]
    provider: str

class Suggestion(Strict):
    recommendation: str
    tradeoffs: list[str]
    questions: list[str]
    overall_assessment: str = ''
    risks: list[RiskItem] = Field(default_factory=list)
    options: list[CounterofferOption] = Field(default_factory=list)
    provider: str = 'DealPilot Engine'

