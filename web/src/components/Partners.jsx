import { motion } from "motion/react";

const partners = ["VISA", "PayPal", "stripe", "Mastercard", "Wise"];

export default function Partners() {
  return (
    <section className="bg-surface py-12 border-y border-outline-variant/10">
      <div className="max-w-[1440px] mx-auto px-12 flex flex-wrap justify-between items-center opacity-40 grayscale gap-8">
        {partners.map((partner, index) => (
          <motion.div 
            key={partner}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            viewport={{ once: true }}
            className={`text-xl font-bold tracking-tighter ${partner === 'stripe' ? 'tracking-normal' : partner === 'Mastercard' ? 'font-extrabold' : 'italic'}`}
          >
            {partner}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
