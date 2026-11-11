#!/usr/bin/env bash
# Stop-hook WARN when a backend contract (GraphQL SDL or OpenAPI schema) is newer than the
# generated frontend/app clients (replaces watchtower agent).
# Graceful no-op until phase 0b creates these artifacts.
warn=0

# GraphQL SDL → generated TS/Dart clients.
graphql_schema="backend/schema.graphql"
if [ -f "$graphql_schema" ]; then
  for gen in frontend/src/gql/graphql.ts app/lib/gen/schema.gql.dart; do
    if [ -f "$gen" ] && [ "$graphql_schema" -nt "$gen" ]; then
      echo "WARN (check-contract-sync): $graphql_schema is newer than $gen — run GraphQL codegen before handing off." >&2
      warn=1
    fi
  done
fi

# OpenAPI schema (DRF REST edge) → generated TS/Dart clients.
for openapi_schema in backend/schema.yaml backend/schema.yml backend/openapi.yaml backend/openapi.json; do
  [ -f "$openapi_schema" ] || continue
  for gen in frontend/src/gql/openapi.ts app/lib/gen/openapi.dart; do
    if [ -f "$gen" ] && [ "$openapi_schema" -nt "$gen" ]; then
      echo "WARN (check-contract-sync): $openapi_schema is newer than $gen — run OpenAPI codegen before handing off." >&2
      warn=1
    fi
  done
  break
done

exit 0
