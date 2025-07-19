import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Zap, Clock, Trophy, ArrowRight, Sparkles, Activity } from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-32 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 rounded-full blur-2xl animate-pulse delay-300"></div>
      </div>
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:64px_64px]"></div>
      
      <div className="container mx-auto px-6 lg:px-8 relative">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center px-10 py-5 rounded-full bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border-2 border-emerald-400/40 backdrop-blur-sm mb-12">
            <Trophy className="w-8 h-8 text-emerald-400 mr-4" />
            <span className="text-xl font-black text-emerald-100 tracking-wide uppercase">THE ELITE STANDARD</span>
          </div>
          
          <h2 className="text-7xl md:text-9xl font-black mb-12 leading-[0.8] drop-shadow-2xl">
            <span className="block bg-gradient-to-r from-slate-100 via-white to-slate-100 bg-clip-text text-transparent">
              FORGE YOUR
            </span>
            <span className="block bg-gradient-to-r from-emerald-300 via-cyan-400 to-blue-400 bg-clip-text text-transparent transform -translate-x-4">
              COACHING LEGACY
            </span>
          </h2>
          
          <p className="text-3xl md:text-4xl text-slate-100 mb-8 leading-tight font-bold max-w-6xl mx-auto">
            Evidence-based coaching development powered by research from elite professionals. 
          </p>
          <p className="text-2xl md:text-3xl text-emerald-300 mb-16 leading-tight font-semibold max-w-5xl mx-auto">
            AI analysis built on proven methodologies from top clubs and coach developers.
          </p>

          {/* Elite Value Propositions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-20">
            <div className="group relative bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border-2 border-emerald-400/20 rounded-3xl p-10 backdrop-blur-md hover:border-emerald-400/60 hover:bg-emerald-500/20 transition-all duration-500 shadow-2xl shadow-emerald-500/10">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-400/30 to-cyan-400/30 rounded-full -translate-y-12 translate-x-12 blur-xl"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-wide">Instant Feedback</h3>
                <p className="text-slate-200 text-lg font-medium leading-relaxed">Upload your coaching session and get comprehensive feedback immediately. Evidence-driven analysis delivered within minutes of upload.</p>
              </div>
            </div>
            <div className="group relative bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-2 border-cyan-400/20 rounded-3xl p-10 backdrop-blur-md hover:border-cyan-400/60 hover:bg-cyan-500/20 transition-all duration-500 shadow-2xl shadow-cyan-500/10">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-400/30 to-blue-400/30 rounded-full -translate-y-12 translate-x-12 blur-xl"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/30">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-wide">Methodology Integration</h3>
                <p className="text-slate-200 text-lg font-medium leading-relaxed">Reports built on frameworks from elite clubs and coach developers. Evidence-based insights from proven methodologies.</p>
              </div>
            </div>
            <div className="group relative bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-2 border-blue-400/20 rounded-3xl p-10 backdrop-blur-md hover:border-blue-400/60 hover:bg-blue-500/20 transition-all duration-500 shadow-2xl shadow-blue-500/10">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-full -translate-y-12 translate-x-12 blur-xl"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/30">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-wide">Professional Development</h3>
                <p className="text-slate-200 text-lg font-medium leading-relaxed">Access research-backed coaching development. Begin your evidence-based coaching journey with insights from top professionals.</p>
              </div>
            </div>
          </div>

          {/* Elite CTA Buttons */}
          <div className="flex flex-col lg:flex-row justify-center gap-8 mb-16">
            <Button 
              size="lg" 
              asChild
              className="group relative bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 hover:from-emerald-400 hover:via-cyan-400 hover:to-blue-500 text-white border-0 shadow-2xl shadow-emerald-500/40 transition-all duration-500 transform hover:scale-110 hover:shadow-emerald-500/60 px-16 py-8 text-2xl font-black rounded-3xl overflow-hidden uppercase tracking-wider"
            >
              <Link href="/auth">
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <Trophy className="mr-4 h-10 w-10 group-hover:rotate-12 transition-transform duration-300" />
                GET YOUR AI HEAD OF COACHING
                <ArrowRight className="ml-4 h-10 w-10 group-hover:translate-x-2 transition-transform duration-300" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              asChild
              className="group border-3 border-cyan-400/60 text-cyan-300 hover:bg-cyan-400/20 hover:text-white hover:border-cyan-300 transition-all duration-500 backdrop-blur-md px-14 py-8 text-2xl font-black rounded-3xl shadow-xl shadow-cyan-500/20 uppercase tracking-wider"
            >
              <a href="#features">
                <Activity className="mr-4 h-10 w-10 group-hover:scale-125 transition-transform duration-300" />
                WITNESS THE REVOLUTION
                <ArrowRight className="ml-4 h-10 w-10 group-hover:translate-x-2 transition-transform duration-300" />
              </a>
            </Button>
          </div>

          {/* Social Proof */}
          <div className="text-center">
            <p className="text-slate-400 text-lg mb-6">Trusted by coaches at:</p>
            <div className="flex flex-wrap justify-center items-center gap-8 text-slate-500 font-semibold">
              <span className="text-lg">Premier League</span>
              <span className="text-lg">•</span>
              <span className="text-lg">La Liga</span>
              <span className="text-lg">•</span>
              <span className="text-lg">UEFA</span>
              <span className="text-lg">•</span>
              <span className="text-lg">MLS</span>
              <span className="text-lg">•</span>
              <span className="text-lg">Bundesliga</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
