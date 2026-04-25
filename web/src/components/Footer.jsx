export default function Footer() {
  return (
    <footer className="bg-surface-container-low border-t border-outline-variant/10">
      <div className="flex flex-col md:flex-row justify-between items-center w-full px-8 md:px-12 py-12 max-w-[1440px] mx-auto">
        <div className="flex flex-col items-center md:items-start mb-8 md:mb-0">
          <div className="flex items-center gap-2 mb-2">
            <img src="/logo.svg" alt="VAULT logo" className="h-6 w-auto" />
            <div className="text-xl font-bold tracking-tighter text-primary">VAULT</div>
          </div>
          <p className="text-on-surface-variant text-xs font-medium">© {new Date().getFullYear()} VAULT. Built on the Authority of Whitespace.</p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-8 md:gap-12">
          {["Terms of Service", "Privacy Policy", "Security Standards", "Editorial Guide"].map((link) => (
            <a key={link} className="text-on-surface-variant text-xs font-bold hover:text-primary transition-all underline-offset-4 hover:underline" href="#">
              {link}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
