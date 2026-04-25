import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Partners from "../components/Partners";
import Features from "../components/Features";
import TrustSection from "../components/TrustSection";
import Pricing from "../components/Pricing";
import Footer from "../components/Footer";

/**
 * LandingPage component serves as the main entry point for the application's landing UI.
 * It strictly follows the "Editorial Precision" design system.
 */
export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Partners />
        <Features />
        <TrustSection />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
