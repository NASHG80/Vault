import React from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import HirerSidebar from './HirerSidebar';
import { getStoredUser } from '../services/api';

const PAGE_TITLES = {
  '/hirer/discovery': 'Find Workers',
  '/hirer/history': 'Payment History',
  '/hirer': 'Find Workers',
};


export default function HirerLayout({ children }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1a1c1d] flex font-sans">
      {/* Sidebar — white, clearly distinct from content */}
      <HirerSidebar />

      {/* Main content — offset by sidebar width w-64 */}
      <div className="flex-1 lg:ml-64">

        {/* Page Content — no top offset needed without navbar */}
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
