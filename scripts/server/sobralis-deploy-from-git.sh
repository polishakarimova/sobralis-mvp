#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/sobralis-mvp"
RELEASES_DIR="$APP_DIR/releases"
CURRENT_LINK="$APP_DIR/current"
REPO_URL="https://github.com/polishakarimova/sobralis-mvp.git"
BRANCH="main"
KEEP_RELEASES="${KEEP_RELEASES:-3}"
LOG_FILE="/var/log/sobralis-git-deploy.log"
LOCK_FILE="/var/lock/sobralis-git-deploy.lock"

mkdir -p "$(dirname "$LOG_FILE")" "$RELEASES_DIR"
exec >> "$LOG_FILE" 2>&1
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  echo "---- $(date -Is) deploy skipped: another deploy is running ----"
  exit 0
fi

echo "---- $(date -Is) git deploy check started ----"

remote_sha="$(git ls-remote "$REPO_URL" "refs/heads/$BRANCH" | awk '{print $1}')"
if [ -z "$remote_sha" ]; then
  echo "ERROR: cannot resolve remote sha"
  exit 1
fi

current_release="$(readlink -f "$CURRENT_LINK" 2>/dev/null || true)"
current_sha=""
if [ -n "$current_release" ] && [ -f "$current_release/.release-sha" ]; then
  current_sha="$(cat "$current_release/.release-sha")"
fi

echo "Remote sha: $remote_sha"
echo "Current sha: ${current_sha:-none}"

if [ "$remote_sha" = "$current_sha" ]; then
  echo "No changes."
  echo "---- $(date -Is) git deploy check finished ----"
  exit 0
fi

new_release="$RELEASES_DIR/$(date +%Y%m%d%H%M%S)-${remote_sha:0:7}"
echo "New release: $new_release"

git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$new_release"
rm -rf "$new_release/.git"

if [ -n "$current_release" ] && [ -f "$current_release/.env" ]; then
  cp "$current_release/.env" "$new_release/.env"
else
  echo "ERROR: current .env not found"
  exit 1
fi

for p in data public/uploads uploads storage; do
  if [ -n "$current_release" ] && [ -e "$current_release/$p" ]; then
    mkdir -p "$(dirname "$new_release/$p")"
    cp -a "$current_release/$p" "$new_release/$p"
  fi
done

cd "$new_release"
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
printf '%s\n' "$remote_sha" > "$new_release/.release-sha"

ln -sfn "$new_release" "$CURRENT_LINK"
systemctl restart sobralis.service
systemctl is-active sobralis.service

if [ -x /usr/local/sbin/sobralis-clean-releases.sh ]; then
  KEEP_RELEASES="$KEEP_RELEASES" /usr/local/sbin/sobralis-clean-releases.sh || true
fi

echo "DEPLOYED $remote_sha"
echo "---- $(date -Is) git deploy finished ----"
