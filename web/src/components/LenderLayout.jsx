import React from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import LenderSidebar from './LenderSidebar';
import { getStoredUser } from '../services/api';

const PAGE_TITLES = {
  '/lender': 'Dashboard',
  '/lender/history': 'Payment History',
};


export default function LenderLayout({ children }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1a1c1d] flex font-sans">
      {/* Sidebar — white, clearly distinct */}
      <LenderSidebar />

      {/* Main Content — offset by sidebar width (w-64 = 256px) */}
      <div className="flex-1 ml-64">

        {/* Page Content */}
        <div className="pt-10">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
