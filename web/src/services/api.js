const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Base fetch wrapper that handles auth headers and error responses.
 */
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Network error' }));
    throw new Error(error.detail || `Request failed with status ${res.status}`);
  }

  return res.json();
}

// ─── Auth API ───────────────────────────────────────────

// Step 1: Submit registration details → triggers OTP email
export async function registerUser({ name, email, password, role }) {
  return apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, role }),
  });
}

// Step 2: Submit OTP → account created + JWT issued
export async function verifyOtp({ email, otp }) {
  const data = await apiFetch('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  });
  localStorage.setItem('token', data.access_token);
  localStorage.setItem('user', JSON.stringify(data.user));
  return data;
}

export async function loginUser({ email, password }) {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  // Store token
  localStorage.setItem('token', data.access_token);
  localStorage.setItem('user', JSON.stringify(data.user));
  return data;
}

export async function getMe() {
  return apiFetch('/auth/me');
}

export function getStoredUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

export function getStoredToken() {
  return localStorage.getItem('token');
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function isAuthenticated() {
  return !!localStorage.getItem('token');
}

// ─── Worker API ─────────────────────────────────────────

export async function getWorkerProfile(workerId) {
  return apiFetch(`/worker/${workerId}`);
}

/**
 * PUBLIC — no auth token required.
 * Returns { id_card, certificate } for the QR profile page.
 */
export async function getWorkerPublicProfile(userId) {
  const res = await fetch(
    `${API_URL}/worker/public-profile/${userId}`
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Not found' }));
    throw new Error(err.detail || `Request failed with status ${res.status}`);
  }
  return res.json(); // { id_card, certificate }
}

export async function createWorkerProfile(data) {
  return apiFetch('/worker/create', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── Hirer API ──────────────────────────────────────────

export async function searchWorkers(query) {
  return apiFetch('/hirer/search', {
    method: 'POST',
    body: JSON.stringify(query),
  });
}

// ─── Job Requests API ───────────────────────────────────

export async function sendJobRequest(data) {
  return apiFetch('/requests/send', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getJobRequests(workerId) {
  return apiFetch(`/requests/worker/${workerId}`);
}

export async function getHirerHistory(hirerId) {
  return apiFetch(`/requests/hirer/${hirerId}`);
}

export async function updateJobRequest(data) {
  return apiFetch('/requests/update', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── Transactions (Off-chain References) ────────────────

export async function recordTransaction({ cid, wallet_address, tx_type }) {
  return apiFetch('/transactions/record', {
    method: 'POST',
    body: JSON.stringify({ cid, wallet_address, tx_type }),
  });
}

export async function getMyTransactions() {
  return apiFetch('/transactions/my');
}

// ─── Loan History (Lender/Hirer) ────────────────────────────────────

// All actioned loans (approved + rejected) for the payment history page
export async function getLoanHistory() {
  return apiFetch('/loans/history');
}


// ─── Certificates ────────────────────────────────────────

export async function saveCertificate({ wallet_address, proof_hash, encrypted_data, platform_tags, period, certificate_cid }) {
  return apiFetch('/certificates/save', {
    method: 'POST',
    body: JSON.stringify({ wallet_address, proof_hash, encrypted_data, platform_tags, period, certificate_cid }),
  });
}

export async function publishCertificate({ proof_hash, public_summary, platform_tags, period, certificate_cid }) {
  return apiFetch('/certificates/publish', {
    method: 'POST',
    body: JSON.stringify({ proof_hash, public_summary, platform_tags, period, certificate_cid }),
  });
}

export async function getMyCertificates() {
  return apiFetch('/certificates/my');
}

export async function getMyPublishedCertificate() {
  return apiFetch('/certificates/published/me');
}

export async function verifyCertificate(proofHash) {
  return apiFetch(`/certificates/verify/${proofHash}`);
}




// ─── Health ─────────────────────────────────────────────

export async function checkHealth() {
  return apiFetch('/health');
}

// ─── Manual KYC — OTP ───────────────────────────────────

export async function sendOTP(phone) {
  return apiFetch('/kyc/send-otp', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
}

export async function verifyOTP(phone, otp) {
  return apiFetch('/kyc/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ phone, otp }),
  });
}

// ─── File Upload ─────────────────────────────────────────

export async function uploadFile(file) {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_URL}/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
    // Do NOT set Content-Type — browser sets it with the correct boundary
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(err.detail || 'Upload failed');
  }
  return res.json(); // { url, filename }
}

// ─── Manual KYC — Form Submission ───────────────────────

export async function submitManualKYC(payload) {
  return apiFetch('/worker/kyc', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ─── Worker Status ───────────────────────────────────────

export async function getWorkerStatus(userId) {
  return apiFetch(`/worker/status/${userId}`);
}

export async function checkWorkerProfile(userId) {
  return apiFetch(`/worker/check-profile/${userId}`);
}

export async function getWorkerIDCard(workerId) {
  return apiFetch(`/worker/id-card/${workerId}`);
}

export async function getWorkerIDCardByUserId(userId) {
  return apiFetch(`/worker/id-card/${userId}`);
}

// ─── Admin KYC ───────────────────────────────────────────

export async function getPendingKYC() {
  return apiFetch('/admin/kyc/pending');
}

export async function getAllKYC() {
  return apiFetch('/admin/kyc/all');
}

export async function approveKYC(workerId) {
  return apiFetch('/admin/kyc/approve', {
    method: 'POST',
    body: JSON.stringify({ worker_id: workerId }),
  });
}

export async function rejectKYC(workerId, remark = '') {
  return apiFetch('/admin/kyc/reject', {
    method: 'POST',
    body: JSON.stringify({ worker_id: workerId, remark }),
  });
}

export async function getAllAdminUsers() {
  return apiFetch('/admin/users/all');
}

export async function flagUser({ user_id, role, flagged, reason = '' }) {
  return apiFetch('/admin/users/flag', {
    method: 'POST',
    body: JSON.stringify({ user_id, role, flagged, reason }),
  });
}

// ─── Loans API ──────────────────────────────────────────

export async function applyForLoan({ amount, duration, purpose }) {
  return apiFetch('/loans/apply', {
    method: 'POST',
    body: JSON.stringify({ amount, duration, purpose }),
  });
}

export async function getPendingLoans() {
  return apiFetch('/loans/pending');
}

export async function actionLoan({ loan_id, action, remark }) {
  return apiFetch('/loans/action', {
    method: 'POST',
    body: JSON.stringify({ loan_id, action, remark }),
  });
}

export async function getMyLoans() {
  return apiFetch('/loans/my');
}

// ─── Analytics & AI Insights ─────────────────────────────

/** Fetches full real-time worker stats snapshot from MongoDB */
export async function getWorkerAnalyticsData() {
  return apiFetch('/analytics/worker-data');
}

/** Triggers Groq AI insights generation based on MongoDB snapshot */
export async function getWorkerAIInsights() {
  return apiFetch('/analytics/ai-insights', { method: 'POST' });
}

// ─── Fraud Detection ──────────────────────────────────────

/** Sends an image file to the backend for AI-generated image detection */
export async function checkImageFraud(file) {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('media', file);

  const res = await fetch(`${API_URL}/fraud/check`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Fraud check failed' }));
    throw new Error(error.detail || 'Fraud check failed');
  }

  return res.json();
}
