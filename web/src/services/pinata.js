/**
 * Pinata IPFS service — upload and fetch encrypted transaction payloads.
 *
 * CORS note: Dedicated Pinata gateways reject the `Authorization` header
 * during CORS preflight. Instead, authenticate via the `pinataGatewayToken`
 * query parameter which Pinata explicitly supports for dedicated gateways.
 */

const PINATA_API_URL = 'https://api.pinata.cloud';
const PINATA_GATEWAY = import.meta.env.VITE_PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs';
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;
// Optional: dedicated gateway access token (different from JWT).
// Set VITE_PINATA_GATEWAY_TOKEN in .env if required by your gateway.
const GATEWAY_TOKEN = import.meta.env.VITE_PINATA_GATEWAY_TOKEN;

/**
 * Upload an encrypted payload to IPFS via Pinata.
 * @param {object} encryptedPayload - { ciphertext, iv } from wallet.js
 * @param {object} metadata - Optional metadata (e.g., worker_id, timestamp)
 * @returns {string} IPFS CID (hash)
 */
export async function uploadToIPFS(encryptedPayload, metadata = {}) {
  if (!PINATA_JWT) {
    throw new Error('VITE_PINATA_JWT is not set. Add it to your .env file.');
  }

  const body = {
    pinataContent: encryptedPayload,
    pinataMetadata: {
      name: `VAULT-tx-${Date.now()}`,
      keyvalues: metadata,
    },
  };

  const res = await fetch(`${PINATA_API_URL}/pinning/pinJSONToIPFS`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${PINATA_JWT}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.details || `Pinata upload failed: ${res.status}`);
  }

  const data = await res.json();
  return data.IpfsHash; // This is the CID
}

/**
 * Fetch an encrypted payload from IPFS by its CID.
 *
 * Strategy (CORS-safe):
 *  1. Dedicated gateway with `pinataGatewayToken` query param (no auth header → no CORS issue)
 *  2. Dedicated gateway with no auth (public files)
 *  3. Pinata public gateway (no auth needed)
 *  4. Other public gateways as fallback
 *
 * @param {string} cid - The IPFS content identifier
 * @returns {object} The encrypted payload { ciphertext, iv }
 */
export async function fetchFromIPFS(cid) {
  const gatewayBase = PINATA_GATEWAY.replace(/\/$/, '');

  // ── 1. Dedicated gateway with gateway token as query param (CORS-safe) ──────
  if (GATEWAY_TOKEN) {
    try {
      const url = `${gatewayBase}/${cid}?pinataGatewayToken=${GATEWAY_TOKEN}`;
      const res = await fetch(url);
      if (res.ok) return res.json();
    } catch (e) {
      console.warn('[Pinata] Gateway token fetch failed:', e.message);
    }
  }

  // ── 2. Dedicated gateway without auth (works if file is public) ───────────
  try {
    const res = await fetch(`${gatewayBase}/${cid}`);
    if (res.ok) return res.json();
  } catch (e) {
    console.warn('[Pinata] Dedicated gateway (no auth) failed:', e.message);
  }

  // ── 3. Pinata public gateway (always CORS-safe, no auth header) ───────────
  try {
    const res = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`);
    if (res.ok) return res.json();
  } catch (e) {
    console.warn('[Pinata] Public gateway failed:', e.message);
  }

  // ── 4. Other public IPFS gateways ─────────────────────────────────────────
  const fallbacks = [
    `https://ipfs.io/ipfs/${cid}`,
    `https://cloudflare-ipfs.com/ipfs/${cid}`,
    `https://4everland.io/ipfs/${cid}`,
    `https://w3s.link/ipfs/${cid}`,
  ];

  for (const url of fallbacks) {
    try {
      const res = await fetch(url);
      if (res.ok) return res.json();
    } catch {
      continue;
    }
  }

  throw new Error(`Failed to fetch CID ${cid} from all IPFS gateways`);
}
