#!/bin/sh
# Runs from /docker-entrypoint.d/ before nginx starts: turns BACKEND_ORIGIN into the
# proxy_pass lines that docker/default.conf includes.
#
#   https://…  (e.g. Render)  — proxied via a *variable*, so nginx re-resolves the
#                               host's DNS every 30 s instead of pinning the IP it
#                               saw at boot. Needs a resolver; we reuse the container's.
#   http://…   (local/internal, e.g. http://host.docker.internal:8000 or a compose
#                               service) — resolved once at start-up the normal way,
#                               which honours /etc/hosts and Docker's own DNS (a
#                               resolver directive would ignore both).
set -eu

origin=$(printf '%s' "${BACKEND_ORIGIN:-}" | sed 's#/*$##')
if [ -z "$origin" ]; then
  echo "15-backend-proxy.sh: BACKEND_ORIGIN is not set (e.g. https://my-backend.onrender.com)" >&2
  exit 1
fi

case "$origin" in
  https://*)
    nameservers=$(awk '$1 == "nameserver" { if ($2 ~ ":") printf "[%s] ", $2; else printf "%s ", $2 }' /etc/resolv.conf)
    [ -n "$nameservers" ] || nameservers="1.1.1.1 8.8.8.8 "
    {
      echo "resolver ${nameservers}valid=30s ipv6=off;"
      echo "set \$backend \"$origin\";"
      echo "proxy_pass \$backend;"
    } > /etc/nginx/backend.inc
    echo "15-backend-proxy.sh: /api -> $origin (DNS re-resolved every 30s via ${nameservers% })"
    ;;
  *)
    echo "proxy_pass $origin;" > /etc/nginx/backend.inc
    echo "15-backend-proxy.sh: /api -> $origin (resolved once at start-up)"
    ;;
esac
