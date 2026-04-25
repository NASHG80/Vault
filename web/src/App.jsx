import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

// Common pages
import LandingPage from './common/LandingPage'
import Login from './common/Login'
import Signup from './common/Signup'

// Layout shells
import Layout from './components/Layout'

// Worker pages
import WorkerDashboard from './worker/dashboard'
import TransactionPage from './worker/transaction'
import CertificatePage from './worker/certificate'
import JobRequest from './worker/jobrequest'
import KYCManual from './worker/kyc-manual'
import KYCStatus from './worker/kyc-status'
import WorkerPublicProfile from './worker/profile'
import WorkerAnalytics from './worker/analytics'

// Admin pages
import AdminKYCReview from './admin/kyc-review'

// Lender pages
import LenderDashboard from './lender/dashboard'
import LenderHistory from './lender/history'

// Hirer pages
import Discovery from './hirer/discovery'
import HirerHistory from './hirer/history'

import { getStoredUser, getWorkerStatus } from './services/api'

// ── KYC Guard: protects dashboard/transactions/certificates ──────────
// If a worker navigates directly to /worker/dashboard before KYC approved,
// this bounces them to the right page.
function WorkerKYCGuard({ children }) {
  const [ready, setReady] = useState(false)
  const [allowed, setAllowed] = useState(false)
  const [redirect, setRedirect] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const user = getStoredUser()
    if (!user || user.role !== 'worker') {
      // Not logged in or not a worker — let other guards handle it
      setAllowed(true)
      setReady(true)
      return
    }

    getWorkerStatus(user.id)
      .then((kyc) => {
        if (kyc.status === 'approved') {
          setAllowed(true)
        } else if (kyc.status === 'pending' || kyc.status === 'rejected') {
          setRedirect('/worker/kyc-status')
        } else {
          setRedirect('/worker/kyc-manual')
        }
      })
      .catch(() => {
        setRedirect('/worker/kyc-manual')
      })
      .finally(() => setReady(true))
  }, [])

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-10 h-10 border-4 border-outline/20 border-t-black rounded-full animate-spin" />
      </div>
    )
  }

  if (redirect) return <Navigate to={redirect} replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public Routes ── */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* ── Public Worker Profile (no auth, scannable via QR) ── */}
        <Route path="/worker/profile/:userId" element={<WorkerPublicProfile />} />

        {/* ── Worker KYC flow (no guard — always accessible for workers) ── */}
        <Route path="/worker/kyc-manual" element={<KYCManual />} />
        <Route path="/worker/kyc-status" element={<KYCStatus />} />

        {/* ── Worker Routes (guarded by KYC approval) ── */}
        <Route path="/worker" element={<WorkerKYCGuard><Layout><WorkerDashboard /></Layout></WorkerKYCGuard>} />
        <Route path="/worker/dashboard" element={<WorkerKYCGuard><Layout><WorkerDashboard /></Layout></WorkerKYCGuard>} />
        <Route path="/worker/transactions" element={<WorkerKYCGuard><Layout><TransactionPage /></Layout></WorkerKYCGuard>} />
        <Route path="/worker/certificates" element={<WorkerKYCGuard><Layout><CertificatePage /></Layout></WorkerKYCGuard>} />
        <Route path="/worker/jobrequest" element={<WorkerKYCGuard><JobRequest /></WorkerKYCGuard>} />
        <Route path="/worker/analytics" element={<WorkerKYCGuard><Layout><WorkerAnalytics /></Layout></WorkerKYCGuard>} />

        {/* ── Admin Routes ── */}
        <Route path="/admin/kyc" element={<AdminKYCReview />} />

        {/* ── Lender Routes ── */}
        <Route path="/lender" element={<LenderDashboard />} />
        <Route path="/lender/dashboard" element={<LenderDashboard />} />
        <Route path="/lender/history" element={<LenderHistory />} />

        {/* ── Hirer Routes ── */}
        <Route path="/hirer/discovery" element={<Discovery />} />
        <Route path="/hirer/history" element={<HirerHistory />} />
        <Route path="/hirer" element={<Discovery />} />
      </Routes>
    </BrowserRouter>
  )
}
