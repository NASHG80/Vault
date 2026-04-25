import { motion } from "motion/react";

export default function TrustSection() {
  return (
    <section className="bg-surface py-32 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-8 md:px-12">
        <div className="grid lg:grid-cols-2 gap-24 items-start">
          <div className="sticky top-40">
            <h2 className="text-5xl md:text-6xl font-bold tracking-tighter leading-[1.1] mb-8">Keep your customers trust</h2>
            <p className="text-xl text-on-surface-variant leading-relaxed max-w-md">
              Identity is the foundation of any economy. VAULT provides the plumbing for a more transparent, verifiable, and equitable future for the global workforce.
            </p>
            <div className="mt-12 flex items-center gap-4">
              <div className="flex -space-x-4">
                <div className="w-12 h-12 rounded-full border-4 border-surface bg-zinc-200 overflow-hidden shadow-sm">
                  <img 
                    alt="Man portrait" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover grayscale"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBTdIl9oVm4aw43b-qrS2NC9ClO3ZUBRj5N5lBO8Y0jdmSSrNF4V-k3XPDrqPjs2v78pn5SH0cxswrKwikSTF1rCYPfVOSzzgyOjWVYwsulL6IPsMKjVhUdHBYDeerZQfY2WciqJ6W55BaTEHPArEWQNhPkpgp0yDgV-RuyeQNAKTqw4d8HZXXWcJUi-dKDg5hM53-rCmBnLuFC8QGS_mAVm_I-xkvnif2pA3QSkbIvxcqh2PNzAfszMo8Ys9pWkCHleNBbOpDsQkls" 
                  />
                </div>
                <div className="w-12 h-12 rounded-full border-4 border-surface bg-zinc-300 overflow-hidden shadow-sm">
                  <img 
                    alt="Woman portrait" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover grayscale"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDgXNbu7Dw7bXisd4jcI471BIHmBJ3sRCD962HrS-B5Lon7S1JpDXbY8TKWdlSOJbtj8hrLg024gMZZmYdHbr2ABhmz0dt0swwI2fa-jsBSpWa7vmA5eq4kqWJAYnmfPmW6QUdTU_5ymHjyECHHi9tG1vYfQOOldUojDVzRusv__pQLmTy0hPJGTLn3h-qlKyfxAH14vbtPIOqARRAEVervamow5qJk83CGAi3qRbzezdDS0NWxCs-wlk4ZkUjwQ04OF3dqblKuxhV7" 
                  />
                </div>
              </div>
              <span className="text-sm font-medium text-on-surface-variant">Trusted by 50k+ professionals</span>
            </div>
          </div>
          
          <div className="space-y-12">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-surface-container-lowest p-12 rounded-xxl shadow-[0_32px_64px_rgba(0,0,0,0.03)] border border-outline-variant/5"
            >
              <div className="text-5xl font-bold tracking-tighter mb-4 italic">100%</div>
              <div className="text-[10px] font-bold text-primary mb-6 uppercase tracking-[0.2em]">Privacy Guaranteed</div>
              <p className="text-on-surface-variant leading-relaxed">
                Our Zero-Knowledge architecture ensures that you never reveal more than necessary. Prove you are over 18 without sharing your birth date. Prove income without sharing bank statements.
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-surface-container-lowest p-12 rounded-xxl shadow-[0_32px_64px_rgba(0,0,0,0.03)] border border-outline-variant/5"
            >
              <div className="text-5xl font-bold tracking-tighter mb-4 italic">4.8s</div>
              <div className="text-[10px] font-bold text-primary mb-6 uppercase tracking-[0.2em]">Verification Speed</div>
              <p className="text-on-surface-variant leading-relaxed">
                Traditional verification takes days. Our automated cryptographic engine processes complex financial proofs in seconds, accelerating your onboarding to new opportunities.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
