import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050510] font-sans selection:bg-orange-500/30 selection:text-orange-200">
      {/* Top Navigation Wrapper - matches the white pill-shaped navbar in the design */}
      <header className="pt-6 px-4 md:px-8 max-w-7xl mx-auto w-full">
        <nav className="bg-white rounded-full flex items-center justify-between px-6 py-4 shadow-xl">
          {/* Logo area */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold">
              🧠
            </div>
            <span className="font-extrabold text-black tracking-widest uppercase">
              Rycene AI
            </span>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-zinc-500 uppercase tracking-wider">
            <Link href="#" className="text-black hover:text-orange-500 transition-colors">Home</Link>
            <Link href="#" className="hover:text-black transition-colors">About</Link>
            <Link href="#" className="hover:text-black transition-colors">Features</Link>
            <Link href="#" className="hover:text-black transition-colors">Contact</Link>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-4 text-sm font-bold uppercase tracking-wider">
            <Link href="/login" className="hidden sm:block text-zinc-600 hover:text-black transition-colors">
              Log in
            </Link>
            <Link href="/login" className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-full transition-all shadow-[0_4px_14px_0_rgba(234,88,12,0.39)] hover:shadow-[0_6px_20px_rgba(234,88,12,0.23)]">
              Sign Up
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Hero Section */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-16 pb-24 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Content Column */}
        <div className="space-y-8">
          <h1 className="text-5xl lg:text-7xl font-black text-white leading-[1.1] uppercase">
            Master <span className="text-orange-500">VLSI Design</span><br />
            With AI.
          </h1>

          <p className="text-zinc-400 text-lg md:text-xl max-w-xl leading-relaxed">
            Join the next generation of semiconductor engineers. Rycene AI provides personalized mentorship, real-time code evaluation, and deep structural analysis for Verilog and SystemVerilog.
          </p>

          {/* Stats Row */}
          <div className="flex flex-wrap items-center gap-8 pt-6 pb-8 border-b border-white/10">
            <div>
              <div className="text-3xl font-black text-white">100+</div>
              <div className="text-xs font-bold text-orange-500 uppercase tracking-widest mt-1">Modules</div>
            </div>
            <div>
              <div className="text-3xl font-black text-white">10K+</div>
              <div className="text-xs font-bold text-orange-500 uppercase tracking-widest mt-1">Evaluations</div>
            </div>
            <div>
              <div className="text-3xl font-black text-white">24/7</div>
              <div className="text-xs font-bold text-orange-500 uppercase tracking-widest mt-1">AI Tutor</div>
            </div>
          </div>

          <div className="pt-2">
            <Link href="/login" className="inline-flex items-center justify-center gap-3 bg-transparent border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white px-8 py-4 rounded-full font-bold uppercase tracking-widest transition-all">
              Join Us <span className="text-xl leading-none">&rarr;</span>
            </Link>
          </div>
        </div>

        {/* Right Image/Graphics Column */}
        <div className="relative h-[500px] lg:h-[600px] w-full rounded-[3rem] overflow-hidden bg-zinc-900 border border-white/5 shadow-2xl flex items-center justify-center group">
          {/* Placeholder for the user's actual image, using a stylized tech gradient for now */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 via-zinc-900 to-black/80" />

          {/* Floating Orange Accent Ring (simulating the graphic in the reference image) */}
          <div className="absolute -top-20 -left-20 w-64 h-64 border-[30px] border-orange-500 rounded-full opacity-50 blur-md group-hover:scale-110 transition-transform duration-700" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 border-[40px] border-amber-500 rounded-full opacity-30 blur-xl group-hover:scale-110 transition-transform duration-700 delay-100" />

          {/* Technical Graphic Placeholder */}
          <div className="relative z-10 text-center">
            <div className="text-9xl mb-4 opacity-80 filter drop-shadow-2xl translate-y-0 group-hover:-translate-y-4 transition-transform duration-500">
              🤖
            </div>
            <div className="text-2xl font-black text-white tracking-widest uppercase opacity-80">
              System Ready
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
