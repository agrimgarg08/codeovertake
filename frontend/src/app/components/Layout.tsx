import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { Code2, Zap, Globe, Linkedin, Github, Swords, Menu, X } from "lucide-react";

export function Layout() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { to: "/", label: "Leaderboard", icon: null },
    { to: "/register", label: "Claim Spot", icon: <Zap className="h-3.5 w-3.5" /> },
    { to: "/headon", label: "HeadOn", icon: <Swords className="h-3.5 w-3.5" /> },
    { to: "/about", label: "About", icon: null },
  ];

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0a0a0a] text-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-[#1e1e1e] bg-[#0a0a0a]/90 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between sm:h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-70" onClick={() => setMenuOpen(false)}>
              <Code2 className="h-5 w-5 text-[#4ade80] sm:h-6 sm:w-6" strokeWidth={1.5} />
              <span className="font-['JetBrains_Mono'] text-base tracking-tight sm:text-lg">
                Code<span className="text-[#4ade80]">Overtake</span>
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden items-center gap-6 font-['Archivo'] sm:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`relative flex items-center gap-1.5 text-sm transition-colors ${
                    isActive(link.to) ? "text-white" : "text-[#888888] hover:text-white"
                  }`}
                >
                  {link.icon}
                  {link.label}
                  {isActive(link.to) && (
                    <div className="absolute -bottom-4 left-0 right-0 h-[2px] bg-[#4ade80]" />
                  )}
                </Link>
              ))}
            </div>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-9 w-9 items-center justify-center rounded text-[#888888] transition-colors hover:text-white sm:hidden"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="border-t border-[#1e1e1e] bg-[#0a0a0a] sm:hidden">
            <div className="flex flex-col px-4 py-3 font-['Archivo']">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2.5 rounded px-3 py-2.5 text-sm transition-colors ${
                    isActive(link.to)
                      ? "bg-[#4ade80]/10 text-[#4ade80]"
                      : "text-[#888888] hover:bg-[#111111] hover:text-white"
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1e1e1e] bg-[#0a0a0a]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-3">
            {/* About */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Code2 className="h-5 w-5 text-[#4ade80]" strokeWidth={1.5} />
                <span className="font-['JetBrains_Mono'] text-base tracking-tight">
                  Code<span className="text-[#4ade80]">Overtake</span>
                </span>
              </div>
              <p className="font-['Archivo'] text-sm leading-relaxed text-[#888888]">
                Track and compare coding profiles across platforms. Built for NSUT students to fuel healthy competition and growth.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="mb-3 font-['JetBrains_Mono'] text-xs uppercase tracking-widest text-[#666666]">Quick Links</h3>
              <div className="flex flex-col gap-2 font-['Archivo'] text-sm">
                <Link to="/" className="text-[#888888] transition-colors hover:text-white">Leaderboard</Link>
                <Link to="/register" className="text-[#888888] transition-colors hover:text-white">Register</Link>
                <Link to="/about" className="text-[#888888] transition-colors hover:text-white">About</Link>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h3 className="mb-3 font-['JetBrains_Mono'] text-xs uppercase tracking-widest text-[#666666]">Built by</h3>
              <div className="font-['Archivo'] text-sm">
                <p className="text-white">Sujal Chaudhary</p>
                <p className="text-[#888888]">NSUT · CSAI · 2028</p>
                <div className="mt-3 flex items-center gap-3">
                  <a href="https://sujal.info" target="_blank" rel="noopener noreferrer" className="text-[#888888] transition-colors hover:text-white" title="Portfolio">
                    <Globe className="h-4 w-4" />
                  </a>
                  <a href="https://sujal.info/linkedin" target="_blank" rel="noopener noreferrer" className="text-[#888888] transition-colors hover:text-white" title="LinkedIn">
                    <Linkedin className="h-4 w-4" />
                  </a>
                  <a href="https://sujal.info/github" target="_blank" rel="noopener noreferrer" className="text-[#888888] transition-colors hover:text-white" title="GitHub">
                    <Github className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-10 border-t border-[#1e1e1e] pt-6 text-center font-['Archivo'] text-xs text-[#666666]">
            © {new Date().getFullYear()} CodeOvertake. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
