import { motion } from "motion/react";
import { Fingerprint, Wallet, Sparkles } from "lucide-react";

const features = [
  {
    icon: <Fingerprint className="w-6 h-6" />,
    title: "Portable DID",
    description: "Your professional identity isn't tied to one platform. Take your reputation anywhere with decentralized identifiers."
  },
  {
    icon: <Wallet className="w-6 h-6" />,
    title: "Verified Earnings",
    description: "Cryptographically prove your historical income to banks and lenders without exposing private transaction details."
  },
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: "AI Scheme Matching",
    description: "Intelligent matching between your verified profile and high-value gig opportunities across the global ecosystem."
  }
];

export default function Features() {
  return (
    <section className="bg-gray-100 py-32">
      <div className="max-w-[1440px] mx-auto px-8 md:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
          <div className="max-w-2xl">
            <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant block mb-4">Core Platform</label>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">Engineered for the next generation of work.</h2>
          </div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="md:w-1/3 text-on-surface-variant leading-relaxed text-balance"
          >
            We don't just verify data; we verify the truth behind it using cryptographic proofs that you own and control.
          </motion.div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              viewport={{ once: true }}
              className="bg-surface-container-lowest p-10 rounded-xxl hover:shadow-[0_24px_48px_rgba(0,0,0,0.04)] transition-all group border border-outline-variant/5"
            >
              <div className="w-12 h-12 rounded-lg bg-surface-container-low flex items-center justify-center mb-8 group-hover:bg-primary group-hover:text-on-primary transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
              <p className="text-on-surface-variant leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
