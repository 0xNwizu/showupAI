import Link from 'next/link'
import { ArrowRight, Zap, Users, Shield, Brain, CheckCircle, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'

const FEATURES = [
  {
    icon: <Users className="w-6 h-6" />,
    title: 'Group Planning',
    description: 'Create a group, invite your squad, and let everyone share their availability and vibe in seconds.',
    color: 'text-brand-cyan',
    bg: 'bg-brand-cyan/10 border-brand-cyan/20',
  },
  {
    icon: <Brain className="w-6 h-6" />,
    title: 'AI-Powered Plans',
    description: 'AI synthesizes everyone\'s preferences to suggest the perfect hangout plan — venues, timings, budget included.',
    color: 'text-brand-purple-light',
    bg: 'bg-brand-purple/10 border-brand-purple/20',
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'SOL Commitment',
    description: 'Lock a small SOL deposit to put skin in the game. Show up, get it back. Flake, it goes to those who showed up.',
    color: 'text-solana-green',
    bg: 'bg-solana-green/10 border-solana-green/20',
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Smart Nudges',
    description: 'AI sends personalized reminders and hype messages as the event approaches. No more ghosted group chats.',
    color: 'text-brand-pink',
    bg: 'bg-brand-pink/10 border-brand-pink/20',
  },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Create a Squad', desc: 'Invite friends, connect wallets, and set up your hangout group.' },
  { step: '02', title: 'Share Your Vibe', desc: 'Everyone answers quick questions about availability, budget, and what sounds fun.' },
  { step: '03', title: 'AI Plans It', desc: "AI synthesizes everyone's preferences and suggests the perfect plan — you can refine it in chat." },
  { step: '04', title: 'Lock It In', desc: 'Everyone deposits a small amount of SOL. The deposit is what keeps people accountable.' },
  { step: '05', title: 'Show Up', desc: 'Check in on the day. Get your SOL back instantly. Flakers\' deposits get split among those who came.' },
]

const STATS = [
  { value: '94%', label: 'Show-up rate', sublabel: 'vs 67% without deposits' },
  { value: '◎ 0.1', label: 'Default deposit', sublabel: 'Customizable per group' },
  { value: '< 60s', label: 'Plan generation', sublabel: 'AI-powered' },
  { value: '5★', label: 'Hangout quality', sublabel: 'AI-curated experiences' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-dark-border bg-dark-bg/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center">
              <span className="text-sm font-bold text-white">SU</span>
            </div>
            <span className="font-bold text-white text-lg">ShowUp <span className="text-brand-purple-light">AI</span></span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button variant="gradient" size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-brand-purple/15 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute top-40 right-1/4 w-64 h-64 bg-brand-pink/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-0 left-1/2 w-80 h-80 bg-solana-green/5 rounded-full blur-3xl" />

          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
              backgroundSize: '64px 64px',
            }}
          />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-purple/10 border border-brand-purple/20 text-brand-purple-light text-sm font-medium mb-8 animate-fade-in">
            <Zap className="w-4 h-4" />
            <span>AI Planning + Solana Commitment</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight animate-slide-up">
            Stop Planning.{' '}
            <span className="bg-gradient-brand bg-clip-text text-transparent">
              Start Showing Up.
            </span>
          </h1>

          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.1s' }}>
            AI plans the perfect hangout for your crew. Lock SOL deposits to commit.
            Show up, get paid back. Flake, and it goes to your friends who actually showed.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Link href="/signup">
              <Button variant="gradient" size="xl" rightIcon={<ArrowRight className="w-5 h-5" />}>
                Start Your Squad
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button variant="secondary" size="xl">
                See how it works
              </Button>
            </Link>
          </div>

          {/* Social proof */}
          <div className="mt-12 flex items-center justify-center gap-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <span className="text-sm text-gray-400">5.0 from early squads</span>
            </div>
            <div className="h-4 w-px bg-dark-border" />
            <div className="flex items-center gap-1.5 text-sm text-gray-400">
              <CheckCircle className="w-4 h-4 text-solana-green" />
              <span>No ghost deposits, ever</span>
            </div>
          </div>
        </div>

        {/* App preview mockup */}
        <div className="relative max-w-5xl mx-auto mt-20">
          <div className="relative rounded-3xl overflow-hidden border border-dark-border shadow-card" style={{ background: 'rgba(18,18,31,0.8)', backdropFilter: 'blur(20px)' }}>
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-5 py-4 border-b border-dark-border bg-dark-card/50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
              </div>
              <div className="flex-1 mx-8 h-6 rounded-lg bg-dark-border/50 flex items-center px-3">
                <span className="text-xs text-gray-600">showupai.app/groups/tech-crew</span>
              </div>
            </div>

            {/* Mock app content */}
            <div className="p-6 grid grid-cols-3 gap-4 min-h-[300px]">
              {/* Left sidebar */}
              <div className="space-y-3">
                <div className="h-8 bg-dark-border/40 rounded-xl w-2/3" />
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 bg-dark-card rounded-xl border border-dark-border/50 flex items-center gap-3 px-3">
                    <div className="w-8 h-8 rounded-xl bg-brand-purple/20" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-2.5 bg-dark-border/60 rounded w-2/3" />
                      <div className="h-2 bg-dark-border/40 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Main content */}
              <div className="col-span-2 space-y-3">
                <div className="h-32 rounded-2xl bg-gradient-to-br from-brand-purple/20 to-brand-pink/10 border border-brand-purple/20 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg bg-gradient-brand" />
                    <div className="h-2.5 bg-white/20 rounded w-1/3" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 bg-white/10 rounded w-full" />
                    <div className="h-2 bg-white/10 rounded w-4/5" />
                    <div className="h-2 bg-white/10 rounded w-3/5" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-24 bg-dark-card rounded-xl border border-dark-border p-3">
                      <div className="h-2.5 bg-dark-border rounded w-1/2 mb-2" />
                      <div className="h-5 bg-dark-border/60 rounded w-2/3 mb-1" />
                      <div className="h-1.5 bg-dark-border/40 rounded-full mt-3 w-full" />
                    </div>
                  ))}
                </div>

                <div className="h-12 bg-gradient-brand rounded-xl flex items-center justify-center">
                  <div className="h-2.5 bg-white/40 rounded w-1/3" />
                </div>
              </div>
            </div>
          </div>

          {/* Floating badges */}
          <div className="absolute -top-4 -right-4 bg-dark-card border border-solana-green/30 rounded-2xl px-4 py-3 shadow-glow-green animate-float">
            <p className="text-xs text-gray-400">Deposit returned ✓</p>
            <p className="text-sm font-bold text-solana-green">◎ 0.1 SOL</p>
          </div>
          <div className="absolute -bottom-4 -left-4 bg-dark-card border border-brand-purple/30 rounded-2xl px-4 py-3 shadow-glow-purple animate-float" style={{ animationDelay: '1s' }}>
            <p className="text-xs text-gray-400">ShowUp AI suggests</p>
            <p className="text-sm font-bold text-white">Rooftop Dinner 🍽️</p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 border-y border-dark-border bg-dark-card/30">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-3xl font-black text-white mb-1 bg-gradient-brand bg-clip-text text-transparent">
                {stat.value}
              </p>
              <p className="text-sm font-semibold text-gray-300">{stat.label}</p>
              <p className="text-xs text-gray-600 mt-0.5">{stat.sublabel}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6" id="features">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-white mb-4">Everything your squad needs</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              From "let's hang" to everyone actually showing up — ShowUp AI handles the whole journey.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FEATURES.map((feature, i) => (
              <div
                key={i}
                className={`rounded-2xl p-6 border ${feature.bg} transition-all duration-300 hover:scale-[1.02] hover:shadow-card-hover`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${feature.color} ${feature.bg} border`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-dark-card/20 border-y border-dark-border" id="how-it-works">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-white mb-4">How ShowUp AI works</h2>
            <p className="text-gray-400 text-lg">Five steps from group chat to actual hangout</p>
          </div>
          <div className="space-y-4">
            {HOW_IT_WORKS.map((step, i) => (
              <div
                key={i}
                className="flex items-start gap-6 p-6 rounded-2xl bg-dark-card border border-dark-border hover:border-brand-purple/30 transition-all group"
              >
                <div className="text-3xl font-black bg-gradient-brand bg-clip-text text-transparent flex-shrink-0 font-mono">
                  {step.step}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-brand-purple-light transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-gray-400">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-brand flex items-center justify-center mx-auto mb-6 animate-float shadow-glow-purple">
            <span className="text-3xl">🎉</span>
          </div>
          <h2 className="text-4xl font-black text-white mb-4">
            Ready to actually{' '}
            <span className="bg-gradient-brand bg-clip-text text-transparent">show up?</span>
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            Create your squad, let AI plan it, and put some SOL where your mouth is.
            No more "let's hang soon" that never happens.
          </p>
          <Link href="/signup">
            <Button variant="gradient" size="xl" rightIcon={<ArrowRight className="w-5 h-5" />}>
              Create Your Squad — Free
            </Button>
          </Link>
          <p className="text-sm text-gray-600 mt-4">No real SOL required to try. Mock wallet included.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-brand flex items-center justify-center">
              <span className="text-xs font-bold text-white">SU</span>
            </div>
            <span className="text-sm text-gray-500">ShowUp AI — Plan. Commit. Show up.</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <Link href="/login" className="hover:text-gray-400 transition-colors">Log in</Link>
            <Link href="/signup" className="hover:text-gray-400 transition-colors">Sign up</Link>
            <span>© {new Date().getFullYear()} ShowUp AI</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
