#!/usr/bin/env bash
# RetailHub — Local Setup Script
# Run once after cloning: bash setup.sh

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()    { echo -e "${CYAN}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC}   $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
die()     { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

echo ""
echo "╔════════════════════════════════════╗"
echo "║        RetailHub Setup             ║"
echo "╚════════════════════════════════════╝"
echo ""

# ── 1. Check prerequisites ──────────────────────────────────────────────────
info "Checking prerequisites..."

command -v node >/dev/null 2>&1 || die "Node.js is not installed. Download from https://nodejs.org (v18+)"
command -v npm  >/dev/null 2>&1 || die "npm is not installed."

NODE_VER=$(node -e "process.stdout.write(process.versions.node)")
MAJOR=$(echo "$NODE_VER" | cut -d. -f1)
[ "$MAJOR" -ge 18 ] || die "Node.js v18+ required. Current: v$NODE_VER"

success "Node.js v$NODE_VER"
success "npm $(npm --version)"

# ── 2. Install dependencies ──────────────────────────────────────────────────
info "Installing monorepo dependencies..."
npm install
success "Dependencies installed"

# ── 3. Copy env files ────────────────────────────────────────────────────────
info "Creating .env files from examples..."

copy_env() {
  local src="$1" dst="$2"
  if [ -f "$dst" ]; then
    warn "$dst already exists — skipping"
  else
    cp "$src" "$dst"
    success "Created $dst"
  fi
}

copy_env "apps/storefront/.env.local.example" "apps/storefront/.env.local"
copy_env "apps/admin/.env.example"            "apps/admin/.env"
copy_env "apps/backend/.env.example"          "apps/backend/.env"
copy_env "apps/mobile-admin/.env.example"     "apps/mobile-admin/.env"

# ── 4. Check Firebase CLI ─────────────────────────────────────────────────────
info "Checking Firebase CLI..."
if command -v firebase >/dev/null 2>&1; then
  success "Firebase CLI $(firebase --version)"
else
  warn "Firebase CLI not found. Install it with:"
  echo "       npm install -g firebase-tools"
  echo "       firebase login"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  Setup complete! Next steps:                                   ║"
echo "║                                                                ║"
echo "║  1. Fill in your credentials in each .env file:               ║"
echo "║     - apps/storefront/.env.local  (Supabase, Paystack)        ║"
echo "║     - apps/admin/.env             (Supabase, API URL)         ║"
echo "║     - apps/backend/.env           (Supabase, Daily.co, etc.)  ║"
echo "║                                                                ║"
echo "║  2. Set up Supabase (see SETUP.md):                           ║"
echo "║     Run supabase/migrations/001_initial_schema.sql            ║"
echo "║     Then run supabase/seed.sql for sample data                ║"
echo "║                                                                ║"
echo "║  3. Run the apps (open 3 terminals):                          ║"
echo "║     cd apps/backend   && npm run dev   # port 4000            ║"
echo "║     cd apps/storefront && npm run dev  # port 3000            ║"
echo "║     cd apps/admin     && npm run dev   # port 3001            ║"
echo "║                                                                ║"
echo "║  4. Deploy to Firebase (after filling .firebaserc):           ║"
echo "║     firebase login                                            ║"
echo "║     firebase target:apply hosting storefront <SITE_ID>        ║"
echo "║     firebase target:apply hosting admin <SITE_ID>             ║"
echo "║     npm run build && firebase deploy                          ║"
echo "║                                                                ║"
echo "║  See SETUP.md for full details.                               ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
