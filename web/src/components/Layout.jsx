import React from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import WorkerSidebar from './WorkerSidebar';

export default function Layout({ children }) {
  const location = useLocation();
  const pageTitle = {
    '/worker': 'Dashboard',
    '/worker/dashboard': 'Dashboard',
    '/worker/transactions': 'Transactions',
    '/worker/certificates': 'Certificates',
    '/worker/jobrequest': 'Job Requests',
    '/worker/accounts': 'Accounts',
    '/worker/analytics': 'Analytics & Policies',
    '/worker/support': 'Support',
  }[location.pathname] || 'Worker Portal';

  return (
    <div className="flex min-h-screen bg-gray-100 selection:bg-black selection:text-white">
      {/* Worker Sidebar */}
      <WorkerSidebar />

      {/* Main Content Area */}
      <main className="flex-1 ml-72 min-h-screen flex flex-col">

        <div className="pt-10 pb-20 px-12 max-w-7xl mx-auto w-full">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
