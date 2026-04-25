/**
 * Wallet connection and encryption key derivation via MetaMask.
 * Signs a deterministic message to derive an AES-GCM key.
 */

const SIGN_MESSAGE = 'VAULT: Authorize transaction vault access. This signature is used to derive your encryption key and does not cost any gas.';

/**
 * Wait for MetaMask to inject window.ethereum (can take a moment after page load).
 */
function getEthereumProvider() {
  return new Promise((resolve, reject) => {
    // Already available
    if (window.ethereum) {
      return resolve(window.ethereum);
    }

    // Listen for the EIP-6963 event (modern wallets)
    window.addEventListener('eip6963:announceProvider', (event) => {
      if (event.detail?.provider) {
        resolve(event.detail.provider);
      }
    }, { once: true });
    window.dispatchEvent(new Event('eip6963:requestProvider'));

    // Fallback: poll for up to 3 seconds
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (window.ethereum) {
        clearInterval(interval);
        resolve(window.ethereum);
      } else if (attempts >= 30) {
        clearInterval(interval);
        reject(new Error(
          'MetaMask not detected. Please make sure:\n' +
          '1. MetaMask extension is installed and enabled\n' +
          '2. Refresh the page after installing\n' +
          '3. You are using Chrome, Edge, Firefox, or Brave'
        ));
      }
    }, 100);
  });
}

/**
 * Connect to MetaMask and return the signer address.
 */
export async function connectWallet() {
  const ethereum = await getEthereumProvider();
  const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
  if (!accounts || accounts.length === 0) {
    throw new Error('No accounts found. Please unlock MetaMask.');
  }
  return accounts[0];
}

/**
 * Get the currently connected wallet address (without prompting).
 */
export async function getConnectedWallet() {
  if (!window.ethereum) return null;
  const accounts = await window.ethereum.request({ method: 'eth_accounts' });
  return accounts?.[0] || null;
}

/**
 * Derive an AES-GCM CryptoKey from a MetaMask signature.
 * The same message + account always produces the same signature → same key.
 */
export async function deriveEncryptionKey(account) {
  // Sign a deterministic message
  const signature = await window.ethereum.request({
    method: 'personal_sign',
    params: [SIGN_MESSAGE, account],
  });

  // Hash the signature to get raw key material (SHA-256 → 32 bytes)
  const encoder = new TextEncoder();
  const sigBytes = encoder.encode(signature);
  const hashBuffer = await crypto.subtle.digest('SHA-256', sigBytes);

  // Import as AES-GCM key
  const key = await crypto.subtle.importKey(
    'raw',
    hashBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );

  return key;
}

/**
 * Encrypt a JSON-serializable object. Returns { ciphertext, iv } as base64 strings.
 */
export async function encryptData(key, data) {
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(JSON.stringify(data));

  // Random 12-byte IV for AES-GCM
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plaintext
  );

  return {
    ciphertext: bufferToBase64(cipherBuffer),
    iv: bufferToBase64(iv.buffer),
  };
}

/**
 * Decrypt a { ciphertext, iv } pair back to a JS object.
 */
export async function decryptData(key, encryptedPayload) {
  const cipherBuffer = base64ToBuffer(encryptedPayload.ciphertext);
  const iv = base64ToBuffer(encryptedPayload.iv);

  const plainBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    cipherBuffer
  );

  const decoder = new TextDecoder();
  return JSON.parse(decoder.decode(plainBuffer));
}

// ─── Helpers ────────────────────────────────────────────

function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function base64ToBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
