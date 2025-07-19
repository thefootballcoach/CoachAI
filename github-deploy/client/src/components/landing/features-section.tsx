import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Brain, Activity, Zap, Target, TrendingUp, Cpu, Bot, Eye, Sparkles } from "lucide-react";

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-full blur-2xl"></div>
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.05)_1px,transparent_1px)] bg-[size:48px_48px]"></div>
      </div>

      <div className="container mx-auto px-6 lg:px-8 relative">
        <div className="text-center mb-20">
          <div className="inline-flex items-center px-8 py-4 rounded-full bg-gradient-to-r from-emerald-500/15 to-cyan-500/15 border-2 border-emerald-400/30 backdrop-blur-sm mb-12">
            <Brain className="w-6 h-6 text-emerald-400 mr-4" />
            <span className="text-lg font-bold text-emerald-100 tracking-wide uppercase">REVOLUTIONARY AI TECHNOLOGY</span>
          </div>
          <h2 className="text-6xl md:text-8xl font-black mb-10 bg-gradient-to-r from-slate-100 via-emerald-300 to-cyan-400 bg-clip-text text-transparent leading-[0.9] drop-shadow-xl">
            ELEVATE EVERY<br />
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">COACHING MOMENT</span>
          </h2>
          <p className="text-2xl md:text-3xl text-slate-200 max-w-5xl mx-auto leading-tight font-semibold mb-6">
            Evidence-based analysis powered by research methodology from top coaching professionals.
          </p>
          <p className="text-xl text-slate-300 max-w-4xl mx-auto leading-relaxed font-medium">
            Built on research from elite clubs, coach developers, and proven methodologies. Our reports integrate findings from top coaching professionals to support evidence-based development.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Neural Communication Analysis - Featured Card */}
          <div className="lg:col-span-2 group bg-gradient-to-br from-slate-800/60 to-slate-700/60 border border-slate-600/30 rounded-3xl p-10 backdrop-blur-sm hover:border-cyan-400/40 transition-all duration-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full -translate-y-16 translate-x-16 blur-xl"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-cyan-500/25">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-4xl md:text-5xl font-black mb-8 text-white drop-shadow-lg">EVIDENCE-BASED COACHING REPORTS</h3>
              <p className="text-xl md:text-2xl text-emerald-300 mb-6 leading-tight font-bold">
                Research-driven analysis built on proven coaching methodologies.
              </p>
              <p className="text-lg text-slate-200 mb-8 leading-relaxed font-medium">
                Upload your coaching session and receive instant, comprehensive feedback within minutes. Every analysis uses frameworks developed by top clubs and coach developers, delivering evidence-based development insights immediately.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full mr-4"></div>
                    <span className="text-slate-200 font-medium">Coach development tracking</span>
                    <span className="ml-auto text-cyan-400 font-bold">98%</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mr-4"></div>
                    <span className="text-slate-200 font-medium">Behavioral pattern analysis</span>
                    <span className="ml-auto text-purple-400 font-bold">95%</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full mr-4"></div>
                    <span className="text-slate-200 font-medium">Personalized development paths</span>
                    <span className="ml-auto text-pink-400 font-bold">92%</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-gradient-to-r from-emerald-400 to-cyan-500 rounded-full mr-4"></div>
                    <span className="text-slate-200 font-medium">Performance enhancement</span>
                    <span className="ml-auto text-emerald-400 font-bold">94%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Behavioral Insights */}
          <div className="group bg-gradient-to-br from-slate-800/60 to-slate-700/60 border border-slate-600/30 rounded-3xl p-8 backdrop-blur-sm hover:border-purple-400/40 transition-all duration-500 relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-xl"></div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-500/25">
                <Activity className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Real-time Insights</h3>
              <p className="text-slate-300 mb-6 leading-relaxed">Live behavioral pattern recognition with instant feedback loops.</p>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                  <span className="text-slate-300">Live engagement tracking</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-pink-400 rounded-full mr-3"></div>
                  <span className="text-slate-300">Instant improvement alerts</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-violet-400 rounded-full mr-3"></div>
                  <span className="text-slate-300">Adaptive recommendations</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Predictive Analytics */}
          <div className="group bg-gradient-to-br from-slate-800/60 to-slate-700/60 border border-slate-600/30 rounded-3xl p-8 backdrop-blur-sm hover:border-emerald-400/40 transition-all duration-500 relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br from-emerald-400/20 to-green-400/20 rounded-full blur-xl"></div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-emerald-500/25">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Predictive Analytics</h3>
              <p className="text-slate-300 mb-6 leading-relaxed">Machine learning forecasts outcomes and identifies optimal intervention moments.</p>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mr-3"></div>
                  <span className="text-slate-300">Session outcome prediction</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                  <span className="text-slate-300">Player development tracking</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-teal-400 rounded-full mr-3"></div>
                  <span className="text-slate-300">Risk factor identification</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Performance Psychology */}
          <div className="group bg-gradient-to-br from-slate-800/60 to-slate-700/60 border border-slate-600/30 rounded-3xl p-8 backdrop-blur-sm hover:border-orange-400/40 transition-all duration-500 relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br from-orange-400/20 to-red-400/20 rounded-full blur-xl"></div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-orange-500/25">
                <Target className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Performance Psychology</h3>
              <p className="text-slate-300 mb-6 leading-relaxed">Elite sport psychology principles integrated with AI analysis for peak performance.</p>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mr-3"></div>
                  <span className="text-slate-300">Mental toughness assessment</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
                  <span className="text-slate-300">Flow state optimization</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-pink-400 rounded-full mr-3"></div>
                  <span className="text-slate-300">Stress management training</span>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Behavioral Detection */}
          <div className="group bg-gradient-to-br from-slate-800/60 to-slate-700/60 border border-slate-600/30 rounded-3xl p-8 backdrop-blur-sm hover:border-indigo-400/40 transition-all duration-500 relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-xl"></div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-indigo-500/25">
                <Eye className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Behavioral Detection</h3>
              <p className="text-slate-300 mb-6 leading-relaxed">Millisecond-precision analysis of micro-patterns and unconscious behaviors.</p>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full mr-3"></div>
                  <span className="text-slate-300">Attention equity measurement</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                  <span className="text-slate-300">Bias pattern recognition</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-violet-400 rounded-full mr-3"></div>
                  <span className="text-slate-300">Decision timing analysis</span>
                </div>
              </div>
            </div>
          </div>

          {/* Neuroscience Integration */}
          <div className="group bg-gradient-to-br from-slate-800/60 to-slate-700/60 border border-slate-600/30 rounded-3xl p-8 backdrop-blur-sm hover:border-pink-400/40 transition-all duration-500 relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br from-pink-400/20 to-rose-400/20 rounded-full blur-xl"></div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-pink-500/25">
                <Cpu className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Neuroscience Integration</h3>
              <p className="text-slate-300 mb-6 leading-relaxed">Brain science principles for memory consolidation and cognitive optimization.</p>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-pink-400 rounded-full mr-3"></div>
                  <span className="text-slate-300">Memory consolidation</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-rose-400 rounded-full mr-3"></div>
                  <span className="text-slate-300">Neuroplasticity enhancement</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
                  <span className="text-slate-300">Cognitive load management</span>
                </div>
              </div>
            </div>
          </div>

          {/* Smart Recommendations */}
          <div className="group bg-gradient-to-br from-slate-800/60 to-slate-700/60 border border-slate-600/30 rounded-3xl p-8 backdrop-blur-sm hover:border-yellow-400/40 transition-all duration-500 relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br from-yellow-400/20 to-amber-400/20 rounded-full blur-xl"></div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-yellow-500/25">
                <Bot className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Smart Recommendations</h3>
              <p className="text-slate-300 mb-6 leading-relaxed">Adaptive coaching suggestions that evolve with your style and success metrics.</p>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
                  <span className="text-slate-300">Priority-ranked improvements</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-amber-400 rounded-full mr-3"></div>
                  <span className="text-slate-300">Implementation strategies</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mr-3"></div>
                  <span className="text-slate-300">Success measurement criteria</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Coach Development Section */}
        <div className="mt-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-6 bg-gradient-to-r from-white via-cyan-200 to-purple-300 bg-clip-text text-transparent">
              Your Personal AI Head of Coaching
            </h2>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Experience accelerated professional development with an AI system that understands your coaching journey, identifies growth opportunities, and provides personalized development pathways.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Development Process */}
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-slate-800/40 to-slate-700/40 border border-cyan-400/20 rounded-2xl p-8 backdrop-blur-sm">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center mr-4">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Intelligent Analysis</h3>
                </div>
                <p className="text-slate-300 leading-relaxed mb-4">
                  Advanced AI processes every coaching interaction to identify patterns, strengths, and development opportunities with precision beyond human observation.
                </p>
                <div className="flex items-center text-sm text-cyan-400">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></div>
                  <span>Real-time behavioral pattern recognition</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-800/40 to-slate-700/40 border border-purple-400/20 rounded-2xl p-8 backdrop-blur-sm">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center mr-4">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Personalized Development</h3>
                </div>
                <p className="text-slate-300 leading-relaxed mb-4">
                  Creates individualized coaching development plans based on your unique style, goals, and performance metrics.
                </p>
                <div className="flex items-center text-sm text-purple-400">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                  <span>Adaptive learning pathways</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-800/40 to-slate-700/40 border border-emerald-400/20 rounded-2xl p-8 backdrop-blur-sm">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center mr-4">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Continuous Improvement</h3>
                </div>
                <p className="text-slate-300 leading-relaxed mb-4">
                  Tracks progress over time and adjusts recommendations to ensure consistent professional growth and skill enhancement.
                </p>
                <div className="flex items-center text-sm text-emerald-400">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mr-3"></div>
                  <span>Performance tracking & optimization</span>
                </div>
              </div>
            </div>

            {/* Visual Element */}
            <div className="relative">
              <div className="bg-gradient-to-br from-slate-800/60 to-slate-700/60 border border-slate-600/30 rounded-3xl p-12 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-cyan-400/20 to-purple-400/20 rounded-full -translate-y-20 translate-x-20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full translate-y-16 -translate-x-16 blur-2xl"></div>
                
                <div className="relative z-10 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-cyan-500/25">
                    <Bot className="w-10 h-10 text-white" />
                  </div>
                  
                  <h3 className="text-3xl font-black mb-6 text-white">AI-Driven Excellence</h3>
                  <p className="text-lg text-slate-300 mb-8 leading-relaxed">
                    Transform your coaching expertise with an AI system that learns from every session and accelerates your professional development.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-cyan-400 mb-1">10x</div>
                      <div className="text-sm text-slate-400">Faster Development</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400 mb-1">100%</div>
                      <div className="text-sm text-slate-400">Personalized</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-400 mb-1">24/7</div>
                      <div className="text-sm text-slate-400">Available</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-pink-400 mb-1">∞</div>
                      <div className="text-sm text-slate-400">Growth Potential</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-20 text-center">
          <Button asChild className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-400 hover:via-blue-400 hover:to-purple-500 text-white border-0 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105">
            <Link href="/auth">
              Start Your AI Coach Development
              <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
