import { motion } from "motion/react";
import { Check } from "lucide-react";

export default function Pricing() {
  return (
    <section className="bg-gray-100 py-32">
      <div className="max-w-[1440px] mx-auto px-8 md:px-12 text-center">
        <div className="max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-6">Scale your trust.</h2>
          <p className="text-on-surface-variant font-medium">Transparent pricing for individuals and institutions.</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto text-left">
          {/* Free Tier */}
          <motion.div 
            whileHover={{ y: -8 }}
            className="bg-surface-container-lowest p-12 rounded-xxl shadow-[0_8px_24px_rgba(0,0,0,0.02)] border border-outline-variant/10 flex flex-col"
          >
            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-2">Individual</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tighter">₹0</span>
                <span className="text-on-surface-variant text-sm font-medium">/forever</span>
              </div>
            </div>
            <ul className="space-y-4 mb-10 flex-grow">
              <li className="flex items-center gap-3">
                <Check className="w-4 h-4 text-on-surface-variant" />
                <span className="text-on-surface-variant font-medium text-sm">Standard Digital ID</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-4 h-4 text-on-surface-variant" />
                <span className="text-on-surface-variant font-medium text-sm">Single Platform Sync</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-4 h-4 text-on-surface-variant" />
                <span className="text-on-surface-variant font-medium text-sm">Monthly Trust Update</span>
              </li>
            </ul>
            <button className="w-full bg-black text-white py-4 rounded-lg font-bold hover:bg-black/90 transition-all cursor-pointer">
              Get Started
            </button>
          </motion.div>

          {/* Pro Tier */}
          <motion.div 
            whileHover={{ y: -8 }}
            className="bg-surface-container-lowest p-12 rounded-xxl shadow-[0_32px_64px_rgba(0,0,0,0.06)] border-2 border-primary relative overflow-hidden flex flex-col"
          >
            <div className="absolute top-0 right-0 bg-primary text-on-primary px-6 py-2 rounded-bl-xl font-bold text-[10px] uppercase tracking-[0.2em]">Recommended</div>
            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-2">Power User</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tighter">₹1,499</span>
                <span className="text-on-surface-variant text-sm font-medium">/month</span>
              </div>
            </div>
            <ul className="space-y-4 mb-10 flex-grow">
              <li className="flex items-center gap-3">
                <Check className="w-4 h-4 text-primary font-bold" />
                <span className="font-bold text-sm">Everything in Free</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-4 h-4 text-primary font-bold" />
                <span className="font-bold text-sm">Multi-source Verifications</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-4 h-4 text-primary font-bold" />
                <span className="font-bold text-sm">Real-time Credential Refresh</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-4 h-4 text-primary font-bold" />
                <span className="font-bold text-sm">Priority API Access</span>
              </li>
            </ul>
            <button className="w-full bg-black text-white py-4 rounded-lg font-bold hover:bg-black/90 transition-all cursor-pointer">
              Go Pro
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
