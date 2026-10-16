def compare(previous, current):
    changes = {}
    for key in current:
        old = previous.get(key)
        if old != current[key]: changes[key] = {'before': old, 'after': current[key]}
    return changes

def evaluate_proposal_risks(previous_terms: dict | None, current_terms: dict) -> list[dict]:
    """
    Deterministic risk intelligence engine.
    Detects scope creep, pricing imbalance, timeline compression, and revision obligations
    by comparing proposal versions objectively.
    """
    risks = []
    curr_amount = current_terms.get('amount_cents', 0)
    curr_days = current_terms.get('delivery_days', 1)
    curr_rev = current_terms.get('revisions', 0)
    curr_deliv = current_terms.get('deliverables', [])
    curr_excl = current_terms.get('exclusions', [])

    if not previous_terms:
        # Initial proposal sanity checks
        if curr_rev > 4:
            risks.append({
                'title': 'High Initial Revision Allowance',
                'category': 'revision_risk',
                'severity': 'medium',
                'explanation': f'Offering {curr_rev} revision rounds creates a risk of prolonged, unpaid review cycles.',
                'fields': ['revisions'],
                'recommendation': 'Consider capping standard revisions to 1 or 2 rounds, charging hourly for extras.'
            })
        if not curr_excl:
            risks.append({
                'title': 'Missing Project Exclusions',
                'category': 'missing_deliverables',
                'severity': 'low',
                'explanation': 'No explicit exclusions are stated (e.g. hosting, third-party API fees, content creation).',
                'fields': ['exclusions'],
                'recommendation': 'Specify what is out of scope to prevent boundary disagreements.'
            })
        return risks

    prev_amount = previous_terms.get('amount_cents', 0)
    prev_days = previous_terms.get('delivery_days', 1)
    prev_rev = previous_terms.get('revisions', 0)
    prev_deliv = previous_terms.get('deliverables', [])
    prev_excl = previous_terms.get('exclusions', [])

    amount_delta = curr_amount - prev_amount
    deliv_count_delta = len(curr_deliv) - len(prev_deliv)
    days_delta = curr_days - prev_days
    rev_delta = curr_rev - prev_rev

    # 1. Pricing Imbalance & Scope Creep
    if amount_delta < 0 and deliv_count_delta > 0:
        pct_price_drop = round(abs(amount_delta) / prev_amount * 100) if prev_amount else 0
        risks.append({
            'title': 'Severe Pricing Imbalance & Scope Creep',
            'category': 'pricing_imbalance',
            'severity': 'high',
            'explanation': (
                f'Proposed price decreased by ${abs(amount_delta)/100:.2f} (-{pct_price_drop}%) '
                f'while deliverables increased from {len(prev_deliv)} to {len(curr_deliv)} items (+{deliv_count_delta}).'
            ),
            'fields': ['amount_cents', 'deliverables'],
            'recommendation': 'Do not accept increased scope with reduced compensation. Propose maintaining the original budget or scaling down deliverables.'
        })
    elif amount_delta < 0:
        pct_price_drop = round(abs(amount_delta) / prev_amount * 100) if prev_amount else 0
        if pct_price_drop >= 20:
            risks.append({
                'title': 'Significant Price Reduction',
                'category': 'pricing_imbalance',
                'severity': 'medium',
                'explanation': f'Price reduced by ${abs(amount_delta)/100:.2f} (-{pct_price_drop}%) without corresponding scope reductions.',
                'fields': ['amount_cents'],
                'recommendation': 'Adjust project scope or deliverables to match the lower budget.'
            })
    elif deliv_count_delta > 0:
        risks.append({
            'title': 'Scope Expansion',
            'category': 'scope_creep',
            'severity': 'medium',
            'explanation': f'Deliverables increased by {deliv_count_delta} item(s) without a price increase.',
            'fields': ['deliverables'],
            'recommendation': 'Ensure additional deliverables are accounted for in timeline and payment.'
        })

    # 2. Timeline Pressure
    if days_delta < 0 and deliv_count_delta >= 0:
        risks.append({
            'title': 'Timeline Compression Under Equal or Higher Scope',
            'category': 'timeline_pressure',
            'severity': 'high' if deliv_count_delta > 0 else 'medium',
            'explanation': (
                f'Delivery timeline reduced by {abs(days_delta)} day(s) (from {prev_days} to {curr_days} days) '
                f'while managing {len(curr_deliv)} deliverable(s).'
            ),
            'fields': ['delivery_days', 'deliverables'],
            'recommendation': 'Counter with a realistic delivery schedule or request a rush fee for expedited delivery.'
        })

    # 3. Revision Risk
    if rev_delta > 0 or curr_rev >= 4:
        risks.append({
            'title': 'Increased Revision Obligations',
            'category': 'revision_risk',
            'severity': 'high' if curr_rev >= 4 else 'medium',
            'explanation': f'Revisions set to {curr_rev} rounds (+{rev_delta} from previous). Excessive revision rounds inflate delivery cycles.',
            'fields': ['revisions'],
            'recommendation': 'Limit free revisions to 2 rounds and state that additional rounds require written change requests.'
        })

    # 4. Exclusions Protection
    removed_excl = set(prev_excl) - set(curr_excl)
    if removed_excl:
        risks.append({
            'title': 'Removed Project Exclusions',
            'category': 'scope_creep',
            'severity': 'medium',
            'explanation': f'Previously excluded items were removed: {", ".join(removed_excl)}.',
            'fields': ['exclusions'],
            'recommendation': 'Re-insert explicit boundary exclusions to avoid assuming external costs.'
        })

    return risks

def generate_compromise_options(previous_terms: dict | None, current_terms: dict) -> list[dict]:
    """
    Generate three structured, balanced counteroffer options:
    - Option A: Maintain Scope (longer timeline & appropriate price)
    - Option B: Maintain Budget (reduced scope & revisions)
    - Option C: Balanced Compromise (middle-ground price, scope, and timeline)
    """
    curr_amount = current_terms.get('amount_cents', 25000)
    curr_days = current_terms.get('delivery_days', 7)
    curr_rev = current_terms.get('revisions', 2)
    curr_deliv = list(current_terms.get('deliverables', []))
    curr_excl = list(current_terms.get('exclusions', []))

    if not previous_terms:
        # Standard balanced variations for an initial proposal
        return [
            {
                'name': 'Option A — Full Scope & Premium Delivery',
                'strategy': 'maintain_scope',
                'summary': f'Deliver all {len(curr_deliv)} items with generous delivery time and 2 revisions.',
                'amount_cents': round(curr_amount * 1.15),
                'delivery_days': max(curr_days, 10),
                'revisions': 2,
                'deliverables': curr_deliv,
                'exclusions': curr_excl or ['Hosting and domain fees'],
                'reasoning': 'Provides a safe margin for high-quality delivery with complete deliverables.'
            },
            {
                'name': 'Option B — Lean & Fast MVP',
                'strategy': 'maintain_budget',
                'summary': f'Core deliverables focused on fast delivery.',
                'amount_cents': curr_amount,
                'delivery_days': curr_days,
                'revisions': 1,
                'deliverables': curr_deliv[:max(1, len(curr_deliv)-1)],
                'exclusions': curr_excl or ['Hosting and domain fees', 'Custom animations'],
                'reasoning': 'Keeps budget tight by deferring non-essential deliverables to a second phase.'
            },
            {
                'name': 'Option C — Standard Balance',
                'strategy': 'balanced_compromise',
                'summary': 'Balanced scope, timeline, and budget.',
                'amount_cents': curr_amount,
                'delivery_days': curr_days,
                'revisions': min(curr_rev, 2),
                'deliverables': curr_deliv,
                'exclusions': curr_excl or ['Hosting and domain fees'],
                'reasoning': 'The standard industry compromise between delivery speed and scope.'
            }
        ]

    prev_amount = previous_terms.get('amount_cents', curr_amount)
    prev_days = previous_terms.get('delivery_days', curr_days)
    prev_deliv = list(previous_terms.get('deliverables', []))
    prev_excl = list(previous_terms.get('exclusions', []))

    # Option A: Maintain Scope (keep current requested deliverables, but demand fair compensation & timeline)
    opt_a_price = max(prev_amount, round(prev_amount * (len(curr_deliv) / max(1, len(prev_deliv)))))
    opt_a_days = max(prev_days, round(prev_days * 1.25))
    opt_a = {
        'name': 'Option A — Maintain Scope with Proportional Price',
        'strategy': 'maintain_scope',
        'summary': f'Keep all {len(curr_deliv)} requested items; adjust price to ${opt_a_price/100:.2f} and timeline to {opt_a_days} days.',
        'amount_cents': opt_a_price,
        'delivery_days': opt_a_days,
        'revisions': 2,
        'deliverables': curr_deliv,
        'exclusions': prev_excl or curr_excl,
        'reasoning': 'Protects work quality by ensuring expanded deliverables have adequate budget and delivery time.'
    }

    # Option B: Maintain Budget (accept the client budget, but scale back scope to fit)
    target_count = max(1, round(len(prev_deliv) * (curr_amount / max(1, prev_amount))))
    opt_b_deliv = curr_deliv[:target_count] if len(curr_deliv) >= target_count else prev_deliv[:target_count]
    opt_b = {
        'name': 'Option B — Maintain Client Budget with Focused Scope',
        'strategy': 'maintain_budget',
        'summary': f'Accept the ${curr_amount/100:.2f} budget; reduce deliverables to {len(opt_b_deliv)} core items in {curr_days} days.',
        'amount_cents': curr_amount,
        'delivery_days': max(prev_days, curr_days),
        'revisions': 1,
        'deliverables': opt_b_deliv,
        'exclusions': list(set(curr_excl + prev_excl + ['Secondary revisions', 'Third-party integrations'])),
        'reasoning': 'Meets the client’s exact budget constraint without causing uncompensated scope creep.'
    }

    # Option C: Balanced Compromise (middle price, middle scope, realistic timeline)
    compromise_price = round((prev_amount + curr_amount) / 2)
    compromise_days = round((prev_days + curr_days) / 2)
    compromise_count = max(1, round((len(prev_deliv) + len(curr_deliv)) / 2))
    opt_c_deliv = curr_deliv[:compromise_count] if len(curr_deliv) >= compromise_count else curr_deliv
    opt_c = {
        'name': 'Option C — Balanced Mutual Compromise',
        'strategy': 'balanced_compromise',
        'summary': f'Propose ${compromise_price/100:.2f}, {len(opt_c_deliv)} deliverables, {compromise_days} days delivery, 2 revisions.',
        'amount_cents': compromise_price,
        'delivery_days': max(1, compromise_days),
        'revisions': 2,
        'deliverables': opt_c_deliv,
        'exclusions': list(set(curr_excl or prev_excl)),
        'reasoning': 'A fair midpoint that shares concessions equally between price, scope, and timeline.'
    }

    return [opt_a, opt_b, opt_c]
