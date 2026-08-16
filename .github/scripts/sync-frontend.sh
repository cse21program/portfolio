#!/usr/bin/env bash
set -euo pipefail

: "${BUCKET:?FRONTEND_BUCKET is required}"
: "${DISTRIBUTION_ID:?CLOUDFRONT_DISTRIBUTION_ID is required}"
DIST_DIR="${1:-dist}"

aws s3 sync "${DIST_DIR}" "s3://${BUCKET}" --delete --only-show-errors \
  --cache-control "public,max-age=31536000,immutable" \
  --exclude "*.html"

aws s3 sync "${DIST_DIR}" "s3://${BUCKET}" --only-show-errors \
  --cache-control "no-cache,must-revalidate" \
  --exclude "*" --include "*.html"

INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id "${DISTRIBUTION_ID}" \
  --paths "/*" \
  --query "Invalidation.Id" \
  --output text)

echo "Invalidation ${INVALIDATION_ID} submitted for ${DISTRIBUTION_ID}"
