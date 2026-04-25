import { motion } from "motion/react";
import { Link } from "react-router-dom";
import DigitalIDCard from "./DigitalIDCard";

export default function Hero() {
  // Dummy data for landing page visualization
  const dummyWorker = {
    name: "Arjun Verma",
    role: "platinum",
    skills: ["Logistics", "Rideshare"],
    phone: "9876543210",
    kyc_status: "approved",
    trust_score: 98,
    jobs_completed: 1240,
    user_id: "8492"
  };
  const dummyUser = { 
    email: "arjun.v@example.com",
    role: "platinum"
  };

  return (
    <section className="min-h-[870px] flex items-center px-8 md:px-12 max-w-[1440px] mx-auto py-20 overflow-hidden">
      <div className="grid md:grid-cols-2 gap-16 items-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-xl"
        >
          <h1 className="text-[3.5rem] md:text-[5rem] font-extrabold leading-[1.05] tracking-tighter mb-8 text-[#1a1c1d]">
            Your Financial Identity, Verified.
          </h1>
          <p className="text-on-surface-variant leading-relaxed mb-10 text-lg">
            Leverage the power of EAS and zkTLS to build portable trust. Prove your earnings and reputation across platforms without compromising privacy.
          </p>
          <div className="flex flex-wrap gap-4">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link 
                to="/signup"
                className="bg-[#1a1c1d] text-white px-8 py-4 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-black transition-all cursor-pointer inline-block shadow-lg shadow-black/10"
              >
                Get Started
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link 
                to="/login"
                className="bg-[#f3f3f4] text-[#1a1c1d] px-8 py-4 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-[#eaeaec] transition-all cursor-pointer inline-block border border-[#eeeeef]"
              >
                Watch Demo
              </Link>
            </motion.div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative flex justify-center md:justify-end"
        >
           <div className="w-full max-w-[500px] transform transition-transform duration-500 hover:scale-105 z-10 relative">
             <div className="absolute inset-0 bg-primary/20 blur-[100px] -z-10 rounded-full" />
             <DigitalIDCard 
               user={dummyUser} 
               worker={dummyWorker} 
               trustScore={98} 
               presetUserId="8492"
               variant="worker-dashboard"
             />
           </div>
        </motion.div>
      </div>
    </section>
  );
}
