import { motion } from "motion/react";
import { Link } from "react-router-dom";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Navbar() {
  return (
    <header className="fixed top-0 w-full z-50 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
      <nav className="flex justify-between items-center w-full px-8 md:px-12 py-6 max-w-[1440px] mx-auto">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="VAULT logo" className="h-7 w-auto" />
            <span className="text-2xl font-bold tracking-tighter text-primary">VAULT</span>
          </Link>
        </motion.div>
        
        <div className="hidden md:flex items-center space-x-10">
          <a className="text-primary font-bold border-b border-primary transition-colors duration-300" href="#">Solutions</a>
          <a className="text-on-surface-variant font-medium hover:text-primary transition-colors duration-300" href="#">Trust</a>
          <a className="text-on-surface-variant font-medium hover:text-primary transition-colors duration-300" href="#">Pricing</a>
          <a className="text-on-surface-variant font-medium hover:text-primary transition-colors duration-300" href="#">About</a>
        </div>

        <div className="flex items-center space-x-5">
          <LanguageSwitcher />
          <Link to="/login" className="text-primary font-medium hover:opacity-70 transition-all cursor-pointer">Login</Link>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link 
              to="/signup"
              className="bg-black text-white px-6 py-2.5 rounded-lg font-bold hover:bg-black/90 transition-all cursor-pointer inline-block"
            >
              Get Started
            </Link>
          </motion.div>
        </div>
      </nav>
    </header>
  );
}
