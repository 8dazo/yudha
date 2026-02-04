#!/usr/bin/env bash
# Deploy ArcTreasury to Sepolia. Loads env from ai-backend/.env.
# Ensure deployer 0xF0D40805e33f1BAD8B24A1BeD9777fb7E23faffE has ~0.003 Sepolia ETH.

set -e
cd "$(dirname "$0")"

if [ -f ../ai-backend/.env ]; then
  set -a
  source ../ai-backend/.env
  set +a
fi

RPC_URL="${RPC_URL:-https://ethereum-sepolia-rpc.publicnode.com}"
echo "Deployer: 0xF0D40805e33f1BAD8B24A1BeD9777fb7E23faffE"
echo "Balance:  $(cast balance 0xF0D40805e33f1BAD8B24A1BeD9777fb7E23faffE --rpc-url "$RPC_URL" 2>/dev/null || echo '?') wei"
echo "RPC:      $RPC_URL"
echo ""
forge script script/DeployYudha.s.sol:DeployYudha --rpc-url "$RPC_URL" --broadcast "$@"
echo ""
echo "► Set ARC_TREASURY_ADDRESS in ai-backend/.env to the deployed contract address above."
