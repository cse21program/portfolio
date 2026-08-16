#!/usr/bin/env bash
set -euo pipefail

ROOT="${ROOT:-/opt/portfolio}"
COMPOSE_FILE="${ROOT}/docker-compose.prod.yml"
WAIT_SECONDS="${WAIT_SECONDS:-120}"

log() {
  printf '[%s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"
}

registry_host() {
  local image="$1"
  local first="${image%%/*}"
  if [[ "$first" == *.* || "$first" == *:* ]]; then
    printf '%s\n' "$first"
  fi
}

cd "$ROOT"

if [[ ! -f .env ]]; then
  log "ERROR: missing ${ROOT}/.env"
  exit 1
fi

REQUESTED_TAG="${IMAGE_TAG:-}"
REQUESTED_IMAGE="${DOCKER_IMAGE:-}"

set -a
# shellcheck disable=SC1091
source .env
set +a

IMAGE_TAG="${REQUESTED_TAG:-${IMAGE_TAG:-latest}}"
DOCKER_IMAGE="${REQUESTED_IMAGE:-${DOCKER_IMAGE:?DOCKER_IMAGE is required}}"
export IMAGE_TAG DOCKER_IMAGE

log "Releasing ${DOCKER_IMAGE}:${IMAGE_TAG}"
chmod +x "${ROOT}/deploy/"*.sh

if [[ -n "${DOCKER_PASSWORD:-}" ]]; then
  REGISTRY="${DOCKER_REGISTRY:-$(registry_host "${DOCKER_IMAGE}")}"
  if [[ -n "${REGISTRY}" ]]; then
    echo "${DOCKER_PASSWORD}" | docker login "${REGISTRY}" -u "${DOCKER_USERNAME:?}" --password-stdin
  else
    echo "${DOCKER_PASSWORD}" | docker login -u "${DOCKER_USERNAME:?}" --password-stdin
  fi
fi

docker compose -f "${COMPOSE_FILE}" pull
docker compose -f "${COMPOSE_FILE}" up -d --remove-orphans --wait --wait-timeout "${WAIT_SECONDS}"
docker image prune -f --filter "dangling=true" >/dev/null

docker compose -f "${COMPOSE_FILE}" exec -T nginx wget -qO- http://127.0.0.1/healthz >/dev/null
log "Healthy"
docker compose -f "${COMPOSE_FILE}" ps
