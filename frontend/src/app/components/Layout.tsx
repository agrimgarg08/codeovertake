import { Link, Outlet, useLocation } from "react-router";
import { Code2, Zap, Globe, Linkedin, Github } from "lucide-react";

export function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen overflow-x-hidden bg-black text-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-[#1a1a1a] bg-black/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between sm:h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-70">
              <Code2 className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.5} />
              <span className="font-['JetBrains_Mono'] text-base tracking-tight sm:text-lg">CodeOvertake</span>
            </Link>

            {/* Nav Links */}
            <div className="flex items-center gap-4 font-['Archivo'] sm:gap-6">
              <Link
                to="/"
                className={`relative text-sm transition-colors ${
                  location.pathname === "/" ? "text-white" : "text-[#888888] hover:text-white"
                }`}
              >
                Leaderboard
                {location.pathname === "/" && (
                  <div className="absolute -bottom-[13px] left-0 right-0 h-[2px] bg-white sm:-bottom-4" />
                )}
              </Link>
              <Link
                to="/register"
                className={`relative flex items-center gap-1.5 text-sm transition-colors ${
                  location.pathname === "/register" ? "text-white" : "text-[#888888] hover:text-white"
                }`}
              >
                <Zap className="hidden h-3.5 w-3.5 sm:block" />
                Claim Spot
                {location.pathname === "/register" && (
                  <div className="absolute -bottom-[13px] left-0 right-0 h-[2px] bg-white sm:-bottom-4" />
                )}
              </Link>
              <Link
                to="/about"
                className={`relative text-sm transition-colors ${
                  location.pathname === "/about" ? "text-white" : "text-[#888888] hover:text-white"
                }`}
              >
                About
                {location.pathname === "/about" && (
                  <div className="absolute -bottom-[13px] left-0 right-0 h-[2px] bg-white sm:-bottom-4" />
                )}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1a1a1a] bg-black">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-3">
            {/* About */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Code2 className="h-5 w-5" strokeWidth={1.5} />
                <span className="font-['JetBrains_Mono'] text-base tracking-tight">CodeOvertake</span>
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
          <div className="mt-10 border-t border-[#1a1a1a] pt-6 text-center font-['Archivo'] text-xs text-[#666666]">
            © {new Date().getFullYear()} CodeOvertake. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
