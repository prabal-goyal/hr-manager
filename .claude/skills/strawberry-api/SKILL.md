---
name: strawberry-api
description: Use when creating or modifying the Naveya GraphQL API (strawberry-django types, resolvers, mutations, DataLoaders, permissions, pagination) or the DRF REST edge. Enforces tenant scoping, the mandatory DataLoader N+1 rule, wonder-woman auth, and no-PII-in-logs. Replaces the deprecated graphene-django skill.
---

# strawberry-django API + DRF REST edge

Naveya's primary API is **strawberry-django GraphQL**. A thin **DRF REST edge** exists only for surfaces GraphQL can't serve well (file up/download, webhooks/callbacks from vendors, statutory-portal round-trips, health checks, third-party clients that need plain REST). Cyborg owns both.

## When to Use
- Creating or modifying strawberry-django types, queries, or mutations in `backend/`
- Implementing DataLoaders for N+1 prevention (required by `guard-missing-dataloader`)
- Adding Relay/offset pagination to list queries
- Adding a REST endpoint on the DRF edge (webhook receiver, file endpoint, vendor callback)
- Any resolver or view that touches a tenant-owned model — every query MUST be scoped to `tenant_id`

## Non-negotiables (Naveya)
1. **Tenancy:** every query on a tenant-owned model is scoped to `tenant_id` via the tenant-scoped default manager. Never `Model.objects.all()`. Postgres RLS is the backstop, not the excuse — resolvers still scope. (See the `rls-model` skill.)
2. **Auth:** permissions come from wonder-woman's auth layer (field/mutation extensions, DRF permission classes). Never hand-roll a check (`guard-hand-rolled-auth`).
3. **No PII in logs:** never log resolver args, query results, or exceptions that carry PII — PAN / Aadhaar / UAN / ESIC / bank / salary / DOB / phone (`guard-pii-logging`).
4. **DataLoaders are mandatory** for every nested relation resolver (see rule below).
5. **Money is `Decimal`, never float**; statutory rates come from versioned `StatutoryConfig`, never hardcoded (payroll fields are read-only through the API unless the mutation is a maker-checker step — see `payroll-statutory`).
6. **Service layer:** business logic lives in services, not resolvers/views. Resolvers stay thin.

## strawberry-django Type Patterns

```python
import strawberry
import strawberry_django
from strawberry_django import auth
from .models import Employee, LeaveRequest

@strawberry_django.type(Employee)
class EmployeeType:
    id: strawberry.ID
    employee_code: strawberry.auto
    display_name: strawberry.auto
    # Never expose PII fields (pan, aadhaar, bank_account, salary) on the default
    # type — gate them behind a permission-extended field or a separate type.

@strawberry_django.type(LeaveRequest)
class LeaveRequestType:
    id: strawberry.ID
    status: strawberry.auto
    from_date: strawberry.auto
    to_date: strawberry.auto
```

### Query type — tenant-scoped, paginated

```python
@strawberry.type
class Query:
    # strawberry-django's field() honours the model's tenant-scoped default
    # manager. Relay connection for cursor pagination:
    leave_requests: strawberry_django.relay.ListConnectionWithTotalCount[
        LeaveRequestType
    ] = strawberry_django.connection()

    @strawberry_django.field
    def employees(self, info: strawberry.Info) -> list[EmployeeType]:
        # Tenant scoping is never optional. The default manager filters by the
        # request tenant; resolvers must never bypass it with .objects.all().
        return Employee.objects.for_tenant(info.context.request.tenant)
```

### Mutation — auth via wonder-woman, service does the work

```python
@strawberry.type
class Mutation:
    @strawberry_django.mutation(extensions=[auth.IsAuthenticated()])
    def approve_leave(self, info: strawberry.Info, request_id: strawberry.ID) -> LeaveRequestType:
        # Permission check lives in wonder-woman's extension/decorator layer,
        # never hand-rolled here (guard-hand-rolled-auth).
        tenant = info.context.request.tenant
        actor = info.context.request.user
        return LeaveService.approve(tenant=tenant, actor=actor, request_id=request_id)
```

## DataLoader Pattern (MANDATORY — N+1 rule)

**Every field that resolves a nested relation (FK, reverse FK, M2M) across a list MUST go through a DataLoader.** A resolver that issues one query per parent row is a `guard-missing-dataloader` block, not a warning. This is the single most common review failure.

```python
from strawberry.dataloader import DataLoader
from collections import defaultdict

def build_leaves_by_employee_loader(tenant) -> DataLoader:
    async def batch(employee_ids: list[int]) -> list[list[LeaveRequest]]:
        rows = LeaveRequest.objects.for_tenant(tenant).filter(employee_id__in=employee_ids)
        by_emp: dict[int, list] = defaultdict(list)
        async for r in rows:
            by_emp[r.employee_id].append(r)
        return [by_emp.get(eid, []) for eid in employee_ids]
    return DataLoader(load_fn=batch)

# Loaders live on context (one instance per request, tenant-bound):
@strawberry_django.field
def leaves(self, info: strawberry.Info) -> list[LeaveRequestType]:
    return info.context.loaders.leaves_by_employee.load(self.id)
```

- One DataLoader instance **per request** (never module-global — it would leak across tenants and cache stale rows).
- The batch query is itself **tenant-scoped**.
- Prefer `strawberry_django`'s automatic `select_related`/`prefetch_related` optimization hints for simple joins; reach for a hand-written DataLoader when the relation is computed, cross-app, or needs its own scoping.

## DRF REST edge conventions

Use the REST edge **only** where GraphQL is a poor fit. Everything else is GraphQL.

- Router-registered `ViewSet`/`APIView` under `backend/api/rest/`. One app-owned module per surface.
- **Tenant + auth:** reuse the same tenancy middleware and wonder-woman DRF permission classes as GraphQL — never a bespoke auth path. Every queryset is tenant-scoped.
- **Serializers** validate input; business logic still lives in services, not the view.
- **Vendor webhooks/callbacks** (razorpay, msg91/gupshup, EPFO/ESIC/TRACES callbacks) land here, verify signatures, then hand to the integration broker/outbox (see `vendor-adapter`) — never inline processing in the view.
- **Money is `Decimal`**; serialize as string, never float. Never echo PII in error bodies or logs.
- Version the edge (`/api/v1/…`) so the GraphQL schema and REST edge can evolve independently.

## Frontend codegen note
When the GraphQL schema changes, the Next.js dashboard needs regenerated types/operations: `cd frontend && npm run codegen` then `npm run typecheck`. Flag schema changes in your report so green-lantern runs codegen when frontend catches up.

## Checklist Before Reporting
1. Every type with nested relations has DataLoaders — no per-row queries (`guard-missing-dataloader` blocks otherwise).
2. Every mutation/view checks permission via wonder-woman's layer, never hand-rolled (`guard-hand-rolled-auth`).
3. Every resolver/queryset on a tenant-owned model is scoped to `tenant_id` — no bare `Model.objects.all()`.
4. Pagination present on all list queries (Relay connection or explicit offset).
5. No PII in logs, exceptions, or serialized errors (`guard-pii-logging`).
6. Money is `Decimal`; no hardcoded statutory rates.
7. Business logic in services, not resolvers/views.
8. Tests written against the spec's Acceptance Criteria (invoke `superpowers:test-driven-development` first).
9. Migration clean: `cd backend && uv run python manage.py makemigrations --check`.
10. Tests pass: `cd backend && uv run pytest`.
11. If schema changed, note that `cd frontend && npm run codegen` is needed.
