import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Brain, Cpu, Zap, Sparkles, Bot, Activity, Trophy } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="hero-section relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      {/* Professional Football Field Background */}
      <div className="absolute inset-0 opacity-10 will-change-auto" style={{ zIndex: -10 }}>
        <svg viewBox="0 0 1400 900" className="w-full h-full object-cover">
          <defs>
            {/* Grass texture gradient */}
            <linearGradient id="grassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1a4d0f"/>
              <stop offset="25%" stopColor="#2d5016"/>
              <stop offset="50%" stopColor="#1a4d0f"/>
              <stop offset="75%" stopColor="#2d5016"/>
              <stop offset="100%" stopColor="#1a4d0f"/>
            </linearGradient>
            
            {/* Stadium lighting effect */}
            <radialGradient id="stadiumLight" cx="50%" cy="30%" r="60%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1"/>
              <stop offset="70%" stopColor="#ffffff" stopOpacity="0.05"/>
              <stop offset="100%" stopColor="#000000" stopOpacity="0.2"/>
            </radialGradient>
          </defs>
          
          {/* Field base with gradient */}
          <rect width="1400" height="900" fill="url(#grassGradient)"/>
          
          {/* Stadium lighting overlay */}
          <rect width="1400" height="900" fill="url(#stadiumLight)"/>
          
          {/* Grass stripes for realism */}
          <g opacity="0.3">
            <rect x="0" y="0" width="1400" height="45" fill="#2d5016"/>
            <rect x="0" y="90" width="1400" height="45" fill="#2d5016"/>
            <rect x="0" y="180" width="1400" height="45" fill="#2d5016"/>
            <rect x="0" y="270" width="1400" height="45" fill="#2d5016"/>
            <rect x="0" y="360" width="1400" height="45" fill="#2d5016"/>
            <rect x="0" y="450" width="1400" height="45" fill="#2d5016"/>
            <rect x="0" y="540" width="1400" height="45" fill="#2d5016"/>
            <rect x="0" y="630" width="1400" height="45" fill="#2d5016"/>
            <rect x="0" y="720" width="1400" height="45" fill="#2d5016"/>
            <rect x="0" y="810" width="1400" height="45" fill="#2d5016"/>
          </g>
          
          {/* Field markings - professional style */}
          <g stroke="#ffffff" strokeWidth="3" fill="none" opacity="0.9">
            {/* Main field outline */}
            <rect x="150" y="120" width="1100" height="660" rx="8"/>
            
            {/* Center line */}
            <line x1="700" y1="120" x2="700" y2="780"/>
            
            {/* Center circle */}
            <circle cx="700" cy="450" r="90" strokeWidth="2"/>
            <circle cx="700" cy="450" r="2" fill="#ffffff"/>
            
            {/* Penalty areas */}
            <rect x="150" y="270" width="165" height="360" strokeWidth="2"/>
            <rect x="1085" y="270" width="165" height="360" strokeWidth="2"/>
            
            {/* Goal areas (6-yard box) */}
            <rect x="150" y="360" width="55" height="180" strokeWidth="2"/>
            <rect x="1195" y="360" width="55" height="180" strokeWidth="2"/>
            
            {/* Penalty spots */}
            <circle cx="260" cy="450" r="3" fill="#ffffff"/>
            <circle cx="1140" cy="450" r="3" fill="#ffffff"/>
            
            {/* Penalty arcs */}
            <path d="M 260 360 A 90 90 0 0 1 260 540" strokeWidth="2"/>
            <path d="M 1140 360 A 90 90 0 0 0 1140 540" strokeWidth="2"/>
            
            {/* Corner arcs */}
            <path d="M 150 120 A 30 30 0 0 1 180 150" strokeWidth="2"/>
            <path d="M 1250 120 A 30 30 0 0 0 1220 150" strokeWidth="2"/>
            <path d="M 150 780 A 30 30 0 0 0 180 750" strokeWidth="2"/>
            <path d="M 1250 780 A 30 30 0 0 1 1220 750" strokeWidth="2"/>
            
            {/* Goals */}
            <rect x="135" y="405" width="15" height="90" fill="#ffffff" stroke="none"/>
            <rect x="1250" y="405" width="15" height="90" fill="#ffffff" stroke="none"/>
            
            {/* Goal crossbars */}
            <rect x="135" y="405" width="15" height="3" fill="#ffffff"/>
            <rect x="135" y="492" width="15" height="3" fill="#ffffff"/>
            <rect x="1250" y="405" width="15" height="3" fill="#ffffff"/>
            <rect x="1250" y="492" width="15" height="3" fill="#ffffff"/>
          </g>
          
          {/* Soccer ball with realistic design */}
          <g transform="translate(670, 420)" opacity="0.8">
            <circle cx="0" cy="0" r="20" fill="#ffffff" stroke="#000000" strokeWidth="1"/>
            
            {/* Classic soccer ball pattern */}
            <g fill="#000000">
              <polygon points="0,-15 -8,-5 -5,8 5,8 8,-5" strokeWidth="0.5" stroke="#000000"/>
              <polygon points="-8,-5 -15,0 -12,12 -5,8" fill="none" stroke="#000000" strokeWidth="0.5"/>
              <polygon points="8,-5 15,0 12,12 5,8" fill="none" stroke="#000000" strokeWidth="0.5"/>
              <polygon points="-5,8 -12,12 0,18 12,12 5,8" fill="none" stroke="#000000" strokeWidth="0.5"/>
            </g>
          </g>
          
          {/* Stadium atmosphere - subtle crowd silhouettes */}
          <g opacity="0.1">
            <rect x="0" y="0" width="1400" height="80" fill="url(#stadiumLight)"/>
            <rect x="0" y="820" width="1400" height="80" fill="url(#stadiumLight)"/>
          </g>
        </svg>
      </div>
      
      {/* Animated Neural Network Background */}
      <div className="absolute inset-0 opacity-5" style={{ zIndex: -5 }}>
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-purple-400 rounded-full animate-pulse delay-700"></div>
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse delay-300"></div>
        <div className="absolute bottom-1/3 right-1/3 w-1 h-1 bg-green-400 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-pink-400 rounded-full animate-pulse delay-500"></div>
        
        {/* Connecting Lines */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          <path d="M200,150 Q400,100 600,200" stroke="url(#line-gradient)" strokeWidth="1" fill="none" className="animate-pulse" />
          <path d="M150,300 Q300,250 500,350" stroke="url(#line-gradient)" strokeWidth="1" fill="none" className="animate-pulse delay-300" />
          <path d="M300,400 Q500,350 700,300" stroke="url(#line-gradient)" strokeWidth="1" fill="none" className="animate-pulse delay-700" />
        </svg>
      </div>

      {/* Minimal floating elements */}
      <div className="absolute bottom-32 left-20 opacity-20 z-1">
        <Cpu className="w-12 h-12 text-purple-400 animate-pulse delay-500" />
      </div>

      <div className="relative container mx-auto px-4 py-8 sm:py-12 lg:py-16 z-10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8 lg:gap-12">
          <div className="w-full lg:w-3/5 lg:pr-8 mb-8 lg:mb-0 relative z-20">
            <div className="flex flex-wrap items-center px-4 sm:px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-400/30 backdrop-blur-sm mb-6 sm:mb-8">
              <div className="w-3 h-3 bg-emerald-400 rounded-full mr-3 animate-pulse shrink-0"></div>
              <span className="text-xs sm:text-sm font-bold text-emerald-100 tracking-wide uppercase">TRUSTED BY ELITE COACHES WORLDWIDE</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black leading-[0.9] mb-6 sm:mb-8 tracking-tight relative max-w-full">
              <span className="block text-white drop-shadow-2xl relative">
                MASTER THE
              </span>
              <span className="block bg-gradient-to-r from-emerald-300 via-cyan-400 to-blue-400 bg-clip-text text-transparent drop-shadow-2xl relative">
                ART OF COACHING
              </span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl mb-8 sm:mb-10 text-slate-100 leading-tight font-semibold max-w-none">
              Evidence-based AI coaching intelligence powered by research methodology from elite clubs and coach developers. 
              <span className="block text-cyan-300 mt-2">Get instant feedback on your coaching sessions.</span>
            </p>
            
            {/* Elite Performance Metrics - Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-14">
              <div className="group relative bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border-2 border-emerald-400/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 backdrop-blur-md hover:border-emerald-400/60 hover:bg-emerald-500/20 transition-all duration-500 shadow-xl shadow-emerald-500/10">
                <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-400/30 to-cyan-400/30 rounded-full -translate-y-8 translate-x-8 sm:-translate-y-10 sm:translate-x-10 blur-xl"></div>
                <div className="relative">
                  <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-emerald-400 mb-2 sm:mb-3 drop-shadow-lg">7</div>
                  <div className="text-sm sm:text-base text-slate-200 font-bold uppercase tracking-wide">Analysis Categories</div>
                </div>
              </div>
              <div className="group relative bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-2 border-cyan-400/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 backdrop-blur-md hover:border-cyan-400/60 hover:bg-cyan-500/20 transition-all duration-500 shadow-xl shadow-cyan-500/10">
                <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-cyan-400/30 to-blue-400/30 rounded-full -translate-y-8 translate-x-8 sm:-translate-y-10 sm:translate-x-10 blur-xl"></div>
                <div className="relative">
                  <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-cyan-400 mb-2 sm:mb-3 drop-shadow-lg">100+</div>
                  <div className="text-sm sm:text-base text-slate-200 font-bold uppercase tracking-wide">Research Studies</div>
                </div>
              </div>
              <div className="group relative bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-2 border-blue-400/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 backdrop-blur-md hover:border-blue-400/60 hover:bg-blue-500/20 transition-all duration-500 shadow-xl shadow-blue-500/10">
                <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-full -translate-y-8 translate-x-8 sm:-translate-y-10 sm:translate-x-10 blur-xl"></div>
                <div className="relative">
                  <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-blue-400 mb-2 sm:mb-3 drop-shadow-lg">50+</div>
                  <div className="text-sm sm:text-base text-slate-200 font-bold uppercase tracking-wide">Elite Clubs</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              <Button
                asChild
                size="lg"
                className="group relative bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 hover:from-emerald-400 hover:via-cyan-400 hover:to-blue-500 text-white border-0 shadow-2xl shadow-emerald-500/40 transition-all duration-500 transform hover:scale-105 hover:shadow-emerald-500/60 px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg font-bold rounded-2xl sm:rounded-3xl overflow-hidden w-full sm:w-auto text-center"
              >
                <Link href="/auth">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <Trophy className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="text-sm sm:text-base lg:text-lg">GET YOUR AI HEAD OF COACHING</span>
                </Link>
              </Button>
              <Button
                asChild
                variant="outline" 
                size="lg"
                className="group border-2 sm:border-3 border-cyan-400/60 text-cyan-300 hover:bg-cyan-400/20 hover:text-white hover:border-cyan-300 transition-all duration-500 backdrop-blur-md px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg font-bold rounded-2xl sm:rounded-3xl shadow-xl shadow-cyan-500/20 w-full sm:w-auto text-center"
              >
                <a href="#features">
                  <Activity className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6 group-hover:scale-125 transition-transform duration-300" />
                  <span className="text-sm sm:text-base lg:text-lg">WITNESS THE POWER</span>
                </a>
              </Button>
            </div>
          </div>
          <div className="w-full lg:w-2/5 relative z-10 lg:pl-8 mt-8 lg:mt-0">
            {/* Modern AI Dashboard Interface */}
            <div className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-2xl border border-slate-600/40 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md sm:max-w-lg lg:max-w-xl mx-auto lg:ml-auto overflow-hidden transform scale-100 hover:scale-[1.02] lg:hover:scale-105 transition-transform duration-300 relative z-10">
              {/* Enhanced Dashboard Header */}
              <div className="bg-gradient-to-r from-cyan-500/15 to-blue-500/15 border-b border-slate-600/40 p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center min-w-0 flex-1">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg sm:rounded-xl flex items-center justify-center mr-2 sm:mr-3 shadow-lg shadow-cyan-500/30 shrink-0">
                      <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-lg font-bold text-white truncate">CoachAI Analytics</h3>
                      <p className="text-xs text-slate-400 font-medium hidden sm:block">Behavioral Analysis</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                      <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-400 rounded-full animate-pulse delay-100"></div>
                      <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-400 rounded-full animate-pulse delay-200"></div>
                    </div>
                    <span className="text-xs text-green-400 font-bold">LIVE</span>
                  </div>
                </div>
              </div>

              {/* Enhanced AI Analysis Display */}
              <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                {/* Communication Excellence */}
                <div className="bg-gradient-to-r from-cyan-500/15 to-blue-500/15 border border-cyan-400/30 rounded-lg sm:rounded-xl p-2 sm:p-3 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs sm:text-sm font-bold text-cyan-100">Communication Excellence</span>
                    <span className="text-lg sm:text-xl font-black text-cyan-400">94%</span>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-1.5 sm:h-2">
                    <div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-1.5 sm:h-2 rounded-full shadow-lg shadow-cyan-500/30" style={{width: '94%'}}></div>
                  </div>
                </div>

                {/* Advanced Behavioral Metrics */}
                <div className="bg-gradient-to-r from-purple-500/15 to-pink-500/15 border border-purple-400/30 rounded-lg sm:rounded-xl p-2 sm:p-3 backdrop-blur-sm">
                  <div className="flex items-center mb-2">
                    <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400 mr-1 sm:mr-2" />
                    <span className="text-xs sm:text-sm font-bold text-purple-100">Behavioral Analysis</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 sm:gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-300 text-xs">Enthusiasm:</span>
                      <span className="text-purple-300 font-bold text-xs">88%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300 text-xs">Authority:</span>
                      <span className="text-purple-300 font-bold text-xs">85%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300 text-xs">Empathy:</span>
                      <span className="text-purple-300 font-bold text-xs">92%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300 text-xs">Patience:</span>
                      <span className="text-purple-300 font-bold text-xs">90%</span>
                    </div>
                  </div>
                </div>

                {/* AI Predictions */}
                <div className="bg-gradient-to-r from-emerald-500/15 to-green-500/15 border border-emerald-400/30 rounded-lg sm:rounded-xl p-2 sm:p-3 backdrop-blur-sm">
                  <div className="flex items-center mb-2">
                    <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400 mr-1 sm:mr-2" />
                    <span className="text-xs sm:text-sm font-bold text-emerald-100">AI Predictions</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    15% engagement boost predicted via strategic questioning. Optimal intervention at 18-minute mark.
                  </p>
                </div>

                {/* Smart Recommendations */}
                <div className="bg-gradient-to-r from-orange-500/15 to-red-500/15 border border-orange-400/30 rounded-lg sm:rounded-xl p-2 sm:p-3 backdrop-blur-sm">
                  <div className="flex items-center mb-2">
                    <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-orange-400 mr-1 sm:mr-2" />
                    <span className="text-xs sm:text-sm font-bold text-orange-100">Live Recommendations</span>
                  </div>
                  <div className="space-y-1 text-xs text-slate-300">
                    <div className="flex items-center">
                      <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-orange-400 rounded-full mr-2"></div>
                      <span>Increase open questions (+23% engagement)</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-orange-400 rounded-full mr-2"></div>
                      <span>Add strategic 2-second pauses</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Processing Indicator */}
              <div className="bg-gradient-to-r from-slate-800/60 to-slate-700/60 border-t border-slate-600/40 p-2 sm:p-3 backdrop-blur-sm">
                <div className="flex items-center justify-center text-xs text-slate-300">
                  <div className="flex space-x-1 mr-2">
                    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-pulse"></div>
                    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-pulse delay-100"></div>
                    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-pulse delay-200"></div>
                  </div>
                  <span className="font-medium text-xs">AI processing live session data...</span>
                </div>
              </div>
            </div>

            {/* Floating Achievement Badge */}
            <div className="absolute -bottom-4 -right-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg p-3 z-10 transform rotate-6 hidden md:block">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-2">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">Elite AI Coach</p>
                  <p className="text-white/80 text-xs">Neuroscience-Backed</p>
                </div>
              </div>
            </div>


          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-slate-700/50">
          <p className="text-center text-slate-400 text-sm uppercase font-medium tracking-wider mb-8">
            Powered by cutting-edge AI technology used by
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 opacity-60">
            <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-slate-600/30 rounded-lg p-4 backdrop-blur-sm">
              <div className="flex items-center justify-center">
                <Brain className="w-6 h-6 text-cyan-400 mr-2" />
                <span className="text-slate-300 font-semibold">Elite Academy</span>
              </div>
            </div>
            <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-slate-600/30 rounded-lg p-4 backdrop-blur-sm">
              <div className="flex items-center justify-center">
                <Cpu className="w-6 h-6 text-purple-400 mr-2" />
                <span className="text-slate-300 font-semibold">Pro Football</span>
              </div>
            </div>
            <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-slate-600/30 rounded-lg p-4 backdrop-blur-sm">
              <div className="flex items-center justify-center">
                <Bot className="w-6 h-6 text-blue-400 mr-2" />
                <span className="text-slate-300 font-semibold">Sports Tech</span>
              </div>
            </div>
            <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-slate-600/30 rounded-lg p-4 backdrop-blur-sm">
              <div className="flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-400 mr-2" />
                <span className="text-slate-300 font-semibold">AI Research</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
