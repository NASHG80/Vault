<p align="center">
  <h1 align="center">🛡️ Vault</h1>
  <p align="center"><strong>Decentralized Financial Identity for India's 300 Million Gig Workers</strong></p>
  <p align="center">
    <em>Build verifiable credit histories. Access formal financial services. Own your data.</em>
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/FastAPI-0.100+-green?style=flat-square&logo=fastapi" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-darkgreen?style=flat-square&logo=mongodb" />
  <img src="https://img.shields.io/badge/IPFS-Pinata-yellow?style=flat-square&logo=ipfs" />
  <img src="https://img.shields.io/badge/MetaMask-Web3-orange?style=flat-square&logo=ethereum" />
  <img src="https://img.shields.io/badge/Groq-AI_Insights-purple?style=flat-square" />
</p>

---

## 🔥 The Problem

India has **300+ million gig workers** — delivery drivers, ride-share partners, freelance laborers — who collectively generate ₹12 lakh crore annually. Yet:

- ❌ **No credit history** — Banks can't assess their creditworthiness
- ❌ **No income proof** — Earnings are scattered across Uber, Zomato, Swiggy, and cash payments
- ❌ **No access to loans** — Formal financial services require payslips and ITR filings they don't have
- ❌ **No portable reputation** — 5-star ratings on one platform mean nothing to a lender

They are **financially invisible** in the formal economy.

---

## 💡 The Solution

**Vault** creates a **decentralized, verifiable financial identity** for gig workers by aggregating their fragmented earning history into a single, tamper-proof credential — powered by blockchain attestations, zero-knowledge proofs, and end-to-end encryption.

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│  Worker connects platforms via zkTLS (Uber, Zomato, etc.)   │
│                          ↓                                  │
│  Earnings data extracted → Encrypted with MetaMask wallet   │
│                          ↓                                  │
│  Stored on IPFS (Pinata) — only hashes on-chain             │
│                          ↓                                  │
│  EAS Certificate generated → Portable, verifiable proof     │
│                          ↓                                  │
│  Lenders assess creditworthiness → Approve micro-loans      │
│                          ↓                                  │
│  AI-powered insights → Govt. scheme eligibility + tips      │
└─────────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

### 🪪 Digital Identity Card

A premium, holographic ID card with real-time trust scores, KYC status, QR-scannable public profiles, and tier-based membership (Platinum/Gold/Silver). Shareable with lenders and hirers.

### 🔐 Encrypted Transaction Vault

Transactions are encrypted client-side using **AES-256-GCM** keys derived from MetaMask signatures. Data is stored on **IPFS via Pinata** — the backend never sees plaintext. Only the wallet owner can decrypt their own data.

### 🌐 zkTLS Data Import (Reclaim Protocol Simulation)

Workers can securely import their verified earning history from gig platforms (Uber, Zomato, Swiggy, Dunzo, Rapido) through a simulated **Reclaim Protocol / zkTLS** flow — complete with a Chrome-like browser shell UI for high-fidelity demo experience.

### 📜 EAS Certificates

Generate **Ethereum Attestation Service** certificates that bundle platform earnings, gig counts, and trust scores into a verifiable, on-chain credential. Publishable and shareable with a single click.

### 🏦 Decentralized Lending

Workers apply for micro-loans backed by their verified gig history. Lenders review applications with full EAS certificate data, and can approve/reject with detailed remarks — auto-populating required bank documents (Aadhaar, PAN, Form 13, etc.).

### 🤖 AI-Powered Insights (Groq LLM)

Real-time financial health analysis powered by **Groq's LLaMA 3.1-8B**:

- **Credit Score** estimation based on gig data
- **Loan Eligibility** assessment with max amounts
- **Government Scheme Matching** (E-Shram, PM SVANidhi, PMEGP, APY, PMJJBY, etc.)
- **Actionable Improvement Tips** prioritized by impact

### 🕵️ AI Fraud Detection

Uploaded receipt images are scanned via **Sightengine API** to detect AI-generated or manipulated images. Fraudulent uploads are **automatically blocked** from submission — protecting the integrity of the financial identity system.

### 📱 OCR Receipt Verification

Tesseract.js-based OCR extracts amounts from uploaded payment screenshots and cross-verifies against user input — ensuring data accuracy at the point of entry.

### 🔔 WhatsApp Notifications

Automated hourly transaction reminders via **Twilio WhatsApp API**, ensuring workers maintain consistent earning records.

### 🌍 Multi-Language Support

Full i18n with `react-i18next` — supporting English, Hindi, and Marathi interfaces for accessibility across India.

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────┐
│                    FRONTEND (Vite + React 19)         │
│                                                      │
│  ┌──────────┐ ┌──────────┐ ┌────────┐ ┌───────────┐ │
│  │  Worker   │ │  Hirer   │ │ Lender │ │   Admin   │ │
│  │Dashboard │ │Discovery │ │  Loans │ │ KYC Review│ │
│  └────┬─────┘ └────┬─────┘ └───┬────┘ └─────┬─────┘ │
│       │             │           │             │       │
│  ┌────┴─────────────┴───────────┴─────────────┴────┐ │
│  │           Services Layer (api.js)               │ │
│  │      wallet.js (MetaMask) │ pinata.js (IPFS)    │ │
│  └─────────────────────┬───────────────────────────┘ │
└────────────────────────┼─────────────────────────────┘
                         │ REST API
┌────────────────────────┼─────────────────────────────┐
│                 BACKEND (FastAPI + Python)            │
│                                                      │
│  ┌─────┐ ┌──────┐ ┌───────┐ ┌─────┐ ┌───────────┐   │
│  │Auth │ │Worker│ │Loans  │ │Fraud│ │Analytics  │   │
│  │+OTP │ │+KYC  │ │+Lender│ │Check│ │+Groq AI   │   │
│  └──┬──┘ └──┬───┘ └───┬───┘ └──┬──┘ └─────┬─────┘   │
│     │       │         │        │           │         │
│  ┌──┴───────┴─────────┴────────┴───────────┴──────┐  │
│  │              MongoDB Atlas                     │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  External: Pinata (IPFS) │ Twilio │ Sightengine      │
└──────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **Python** 3.10+
- **MongoDB Atlas** account (connection string)
- **MetaMask** browser extension
- **Pinata** account (IPFS gateway + JWT)

### 1. Clone & Setup Backend

```bash
git clone https://github.com/your-repo/Genesis_Syn3rgy_JeetGharat.git
cd Genesis_Syn3rgy_JeetGharat/backend

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Fill in: MONGO_URI, JWT_SECRET, GROQ_API_KEY, TWILIO_*, SIGHTENGINE_*

# Run
python run.py
```

### 2. Setup Frontend

```bash
cd ../web

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Fill in: VITE_PINATA_JWT, VITE_PINATA_GATEWAY, VITE_PINATA_GATEWAY_TOKEN

# Run
npm run dev
```

### 3. Open

Navigate to `http://localhost:5173` — Connect MetaMask and start building your financial identity.

---

## 👥 User Roles

| Role       | Capabilities                                                                                                                                 |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Worker** | Register → KYC → Dashboard → Import earnings → Encrypt & store transactions → Generate EAS certificates → Apply for loans → View AI insights |
| **Hirer**  | Discover verified workers → Send job requests → View public profiles & certificates → Track hiring history                                   |
| **Lender** | Review loan applications → Verify EAS certificates → Approve/Reject with remarks → Track disbursement history                                |
| **Admin**  | Review KYC submissions → Approve/Reject with remarks → Manage users → Flag suspicious accounts                                               |

---

## 🔒 Privacy & Security Model

| Layer                      | Technology                         | Purpose                                               |
| -------------------------- | ---------------------------------- | ----------------------------------------------------- |
| **Client-side encryption** | AES-256-GCM via Web Crypto API     | Transaction data never leaves the browser unencrypted |
| **Key derivation**         | MetaMask `personal_sign` → SHA-256 | Deterministic key per wallet — no key storage needed  |
| **Decentralized storage**  | IPFS via Pinata                    | Backend stores only content hashes (CIDs), never data |
| **KYC verification**       | Aadhaar + PAN + OTP (Twilio)       | Multi-factor identity verification                    |
| **Fraud prevention**       | Sightengine GenAI Detection        | Blocks AI-generated fake receipts at upload           |
| **Attestations**           | EAS (Ethereum Attestation Service) | Tamper-proof, on-chain verifiable credentials         |

---

## 🛠️ Tech Stack

| Layer             | Technologies                                                          |
| ----------------- | --------------------------------------------------------------------- |
| **Frontend**      | React 19, Vite 8, TailwindCSS 4, Framer Motion, Lucide Icons          |
| **Backend**       | FastAPI, Uvicorn, Pydantic, Python-Jose (JWT)                         |
| **Database**      | MongoDB Atlas (PyMongo)                                               |
| **Storage**       | IPFS (Pinata Cloud)                                                   |
| **AI/ML**         | Groq LLaMA 3.1-8B (insights), Sightengine (fraud), Tesseract.js (OCR) |
| **Web3**          | MetaMask, Web Crypto API, EAS                                         |
| **Notifications** | Twilio WhatsApp API, FastAPI-Mail                                     |
| **i18n**          | react-i18next (EN, HI, MR)                                            |

---

## 📂 Project Structure

```
Genesis_Syn3rgy_JeetGharat/
├── backend/
│   ├── app/
│   │   ├── routes/         # 14 API route modules
│   │   │   ├── auth.py           # Registration + Email OTP
│   │   │   ├── worker.py         # Profile + ID Card
│   │   │   ├── transactions.py   # IPFS CID references
│   │   │   ├── certificates.py   # EAS certificate management
│   │   │   ├── loans.py          # Loan applications + actions
│   │   │   ├── analytics.py      # Groq AI insights
│   │   │   ├── fraud.py          # Image fraud detection
│   │   │   ├── kyc_manual.py     # KYC submission + OTP
│   │   │   └── ...
│   │   ├── db/mongo.py     # MongoDB connection + collections
│   │   ├── schemas/        # Pydantic models
│   │   └── main.py         # FastAPI app + middleware
│   ├── requirements.txt
│   └── .env
│
├── web/
│   ├── src/
│   │   ├── worker/         # Worker dashboard, transactions, certificates, analytics
│   │   ├── hirer/          # Hirer discovery + job history
│   │   ├── lender/         # Lender loan management
│   │   ├── admin/          # Admin KYC review panel
│   │   ├── common/         # Landing page, Login, Signup
│   │   ├── components/     # Shared UI (DigitalIDCard, Sidebars, Navbar)
│   │   ├── services/       # api.js, wallet.js, pinata.js
│   │   └── locales/        # i18n translations (en, hi, mr)
│   ├── package.json
│   └── .env
│
└── README.md
```

---

## 🌟 Impact

> _"In India, 93% of the workforce is informal. They have no payslips, no credit scores, no financial identity. GigTrust gives them one — verifiable, portable, and truly theirs."_

- **Financial Inclusion**: Enables 300M+ workers to access formal banking & micro-loans
- **Data Sovereignty**: Workers own and control their encrypted financial data
- **Trust Portability**: A 5-star Uber driver can prove their reliability to a bank
- **Policy Access**: AI matches workers with government welfare schemes they qualify for
- **Fraud Prevention**: Ensures data integrity with AI-powered receipt verification

---

## 🏆 Team GENESIS

---

<p align="center">
  <sub>Vault — Because every worker deserves a financial identity.</sub>
</p>
