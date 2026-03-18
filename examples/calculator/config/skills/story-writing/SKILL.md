# Story Writing — User Stories and Requirements

> Domain knowledge about writing effective user stories, acceptance criteria, and decomposing epics.
> Use this skill to ground requirements analysis in structured, proven formats.

---

## User Story Format

Every user story follows this structure:

```
As a [role],
I want [capability],
So that [benefit].
```

### Rules

- **Role** must be specific: not "user" but "warehouse operator", "finance clerk", "system administrator", "API consumer"
- **Capability** describes the action the user wants to perform — one action per story
- **Benefit** explains why this matters — what value does the user gain?
- A story without a clear benefit is a task, not a story — rephrase or merge it

### Example (for the distributed-playground domain)

```
As a finance clerk,
I want to generate an invoice for a delivered order,
So that I can bill the customer and track revenue.
```

Not:

```
As a user,                              ← too vague — who specifically?
I want invoicing to work,              ← too vague — what action?
So that the system is complete.        ← no real benefit stated
```

---

## INVEST Principles

Every story should satisfy all six criteria. Use this as a validation checklist.

### I — Independent

Stories should be implementable in any order. Minimize dependencies between stories.

- **Good**: "Generate invoice for delivered order" and "View invoice details" can be built in either order
- **Bad**: "Create invoice schema" is not a story — it's a technical task with no user value. Fold it into the first story that needs the schema
- **When dependencies are unavoidable**: make them explicit ("This story requires Story X to be completed first because...")

### N — Negotiable

Stories are not contracts — the details (how) are negotiable while the intent (what and why) is fixed.

- The story describes the goal; the team decides implementation details
- Acceptance criteria define the boundaries, not the implementation
- Technical constraints belong in the Architect's analysis, not in the story itself

### V — Valuable

Every story must deliver identifiable value to a specific user or stakeholder.

- **Valuable**: "As a finance clerk, I want to see all unpaid invoices, so that I can follow up on overdue payments"
- **Not valuable on its own**: "Create the Invoice database table" — this is infrastructure, not value. Bundle it with the first user-facing story that needs it
- **Test**: can you explain to a non-technical stakeholder why this story matters? If not, it's not a story

### E — Estimable

The team should be able to estimate the effort required.

- Stories must be clear enough that a developer can roughly size the work
- If a story can't be estimated, it's too vague — decompose it or add a research spike
- Acceptance criteria help estimation by bounding the scope

### S — Small

A story should be completable within a single sprint iteration (typically 1-5 days of work).

- **Too large**: "Implement the entire Invoicing bounded context" — this is an epic
- **Right size**: "Generate an invoice when an order is delivered" — concrete, bounded
- **Too small**: "Add InvoiceId field to Order entity" — this is a task, not a story

### T — Testable

Every story must have verifiable acceptance criteria that a tester can check.

- If you can't write a test for a criterion, the criterion is too vague
- Acceptance criteria define the pass/fail boundary
- Both happy path and key error scenarios should be covered

---

## Acceptance Criteria

### Format Options

**Given/When/Then** (preferred for behavioral criteria):

```
Given an order in "Delivered" status with grand total EUR 150.00 and CustomerId "abc-123"
When the system processes the order for invoicing
Then an invoice is created with:
  - OrderId matching the delivered order
  - CustomerId = "abc-123"
  - TotalAmount = EUR 150.00
  - Status = "Draft"
  - GeneratedAt = current timestamp
```

**Checklist format** (for simpler validations):

```
Acceptance Criteria:
- [ ] Invoice is created only for orders in "Delivered" status
- [ ] Invoice TotalAmount equals the order's GrandTotal at time of delivery
- [ ] Invoice has a unique ID (Guid)
- [ ] InvoiceGenerated event is published with InvoiceId, OrderId, CustomerId, Amount
- [ ] Attempting to invoice a non-delivered order returns 400 Bad Request
```

### Acceptance Criteria Quality Rules

| Rule | Good | Bad |
|------|------|-----|
| **Specific** | "Returns HTTP 404 with body `{ error: 'Order not found' }`" | "Handles missing orders" |
| **Measurable** | "Response time < 200ms for orders with up to 50 lines" | "Fast enough" |
| **Testable** | "Given an order in Cancelled status, When POST /invoice, Then 400 with error 'Cannot invoice cancelled order'" | "Invalid orders are rejected" |
| **Complete** | Covers happy path + at least 2 error scenarios | Only describes the happy path |
| **Independent** | Each criterion can be verified on its own | Criteria depend on execution order |

### Minimum Per Story

- At least **2 acceptance criteria** per story (one happy path, one error/edge)
- Preferably **3-5 criteria** covering: happy path, input validation, error handling, edge cases
- For complex stories: up to 8 criteria, but consider splitting the story if more are needed

---

## Epic Decomposition

When a topic is too large for a single story, decompose it into an epic with multiple stories.

### Decomposition Strategy

1. **Identify the user roles**: who interacts with this feature?
2. **Map the workflows**: what are the main user flows from start to finish?
3. **Split by capability**: each distinct action the user performs is a story candidate
4. **Validate independence**: can each story deliver value on its own?
5. **Order by value**: which stories deliver the most value earliest?

### Decomposition Patterns

| Pattern | When to use | Example |
|---------|------------|---------|
| **By workflow step** | Feature has a clear sequence | Create invoice → View invoice → Send invoice → Mark as paid |
| **By user role** | Different roles have different needs | Finance clerk views invoices, System auto-generates them, Admin adjusts them |
| **By data variation** | Different inputs require different handling | Invoice for domestic order, Invoice for international order (different tax rules) |
| **By CRUD operation** | Simple data management features | Create, Read, Update, Delete invoice |
| **By happy path / edge case** | Core flow first, then error handling | Generate invoice (happy) → Handle duplicate invoice attempt → Handle missing order |

### Example: "Implement Invoicing" Epic Decomposition

```
Epic: Implement the Invoicing bounded context

Story 1: Auto-generate invoice on order delivery
  As a finance clerk, I want an invoice to be automatically generated
  when an order is delivered, so that billing starts without manual action.

Story 2: View invoice details
  As a finance clerk, I want to view the details of a generated invoice,
  so that I can verify the amounts before sending it to the customer.

Story 3: List invoices with filtering
  As a finance clerk, I want to see a list of all invoices filtered by status,
  so that I can track which invoices are pending, sent, or paid.

Story 4: Handle duplicate invoice prevention
  As a finance clerk, I want the system to prevent duplicate invoices
  for the same order, so that customers are not billed twice.

Story 5: Cancel an invoice
  As a finance clerk, I want to cancel an invoice that was generated in error,
  so that incorrect billing is corrected before it reaches the customer.
```

### Decomposition Anti-Patterns

| Anti-pattern | Problem | Fix |
|-------------|---------|-----|
| **Technical slicing** ("Create DB schema", "Add API endpoint", "Wire MassTransit") | No story delivers user value alone | Slice by user capability instead — each story includes all technical layers needed |
| **Too thin** ("Add InvoiceId field") | Not a story — it's a task | Fold into the story that needs InvoiceId |
| **Too thick** ("Implement invoicing") | Can't be estimated or completed in one iteration | Decompose using the patterns above |
| **Dependent chain** (Story 2 can't start until Story 1 is 100% done) | Blocks parallel work | Re-slice to maximize independence; if unavoidable, make dependency explicit |

---

## Story Writing Checklist

Before finalizing a set of stories, verify:

- [ ] Every story follows "As a [specific role], I want [action], So that [benefit]"
- [ ] Every story satisfies INVEST (Independent, Negotiable, Valuable, Estimable, Small, Testable)
- [ ] Every story has at least 2 acceptance criteria (happy path + error scenario)
- [ ] Acceptance criteria are specific, measurable, and testable
- [ ] No story is a technical task disguised as a story (e.g., "Create database table")
- [ ] The set of stories covers the full scope of the epic/topic
- [ ] Edge cases are covered — not just the happy path
- [ ] Dependencies between stories are explicit where they exist
- [ ] Stories are ordered by value delivery (most valuable first)
- [ ] Each story can be completed within a single sprint iteration

---

## Roles in the Distributed Playground Domain

When writing stories for this system, consider these user roles:

| Role | Who they are | What they care about |
|------|-------------|---------------------|
| **Warehouse operator** | Manages order fulfillment | Order status, shipping, delivery tracking |
| **Finance clerk** | Handles billing and payments | Invoices, payment tracking, revenue reporting |
| **Customer service rep** | Handles customer inquiries | Order lookups, customer data, issue resolution |
| **System administrator** | Manages infrastructure | Service health, configuration, monitoring |
| **API consumer** | External system or frontend | Endpoint availability, response contracts, error codes |
| **Data analyst** | Derives business insights | Projections, aggregations, reporting queries |

Avoid generic "user" or "admin" — use the specific role that gains value from the story.
