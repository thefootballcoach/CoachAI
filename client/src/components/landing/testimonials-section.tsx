export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-40 left-40 w-96 h-96 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 right-40 w-80 h-80 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-full blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-6 lg:px-8 relative">
        <div className="text-center mb-20">
          <div className="inline-flex items-center px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-400/20 backdrop-blur-sm mb-8">
            <span className="text-sm font-semibold text-emerald-100 tracking-wide uppercase">Real Coach Success Stories</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-black mb-8 bg-gradient-to-r from-white via-emerald-200 to-cyan-300 bg-clip-text text-transparent leading-tight">
            Transforming Careers<br />Worldwide
          </h2>
          <p className="text-xl text-slate-300 max-w-4xl mx-auto leading-relaxed">
            Elite coaches trust CoachAI to accelerate their development. See how our platform has revolutionized coaching careers across the globe.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Testimonial 1 */}
          <div className="group bg-gradient-to-br from-slate-800/60 to-slate-700/60 border border-slate-600/30 rounded-3xl p-8 backdrop-blur-sm hover:border-emerald-400/40 transition-all duration-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 rounded-full -translate-y-12 translate-x-12 blur-xl"></div>
            <div className="relative z-10">
              <div className="flex items-center mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl mr-4 shadow-lg shadow-emerald-500/25">
                  MJ
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Michael Johnson</h3>
                  <p className="text-slate-400 text-sm">Premier League Head Coach</p>
                </div>
              </div>
              <div className="mb-6">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-slate-200 mb-6 leading-relaxed text-lg">
                "CoachAI identified gaps in my communication I never knew existed. In 6 months, my player engagement scores improved 73% and I was promoted to head coach."
              </p>
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 font-bold text-sm">6 MONTHS WITH COACHAI</span>
                <span className="text-slate-400 text-sm">+73% Engagement</span>
              </div>
            </div>
          </div>
          
          {/* Testimonial 2 */}
          <div className="group bg-gradient-to-br from-slate-800/60 to-slate-700/60 border border-slate-600/30 rounded-3xl p-8 backdrop-blur-sm hover:border-purple-400/40 transition-all duration-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full -translate-y-12 translate-x-12 blur-xl"></div>
            <div className="relative z-10">
              <div className="flex items-center mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl mr-4 shadow-lg shadow-purple-500/25">
                  SW
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Sarah Williams</h3>
                  <p className="text-slate-400 text-sm">Academy Director, United Youth</p>
                </div>
              </div>
              <div className="mb-6">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-slate-200 mb-6 leading-relaxed text-lg">
                "We rolled out CoachAI academy-wide. Player development accelerated 2.5x faster and our coach retention improved dramatically. Best investment we've made."
              </p>
              <div className="flex items-center justify-between">
                <span className="text-purple-400 font-bold text-sm">ACADEMY-WIDE DEPLOYMENT</span>
                <span className="text-slate-400 text-sm">2.5x Faster Development</span>
              </div>
            </div>
          </div>
          
          {/* Testimonial 3 */}
          <div className="group bg-gradient-to-br from-slate-800/60 to-slate-700/60 border border-slate-600/30 rounded-3xl p-8 backdrop-blur-sm hover:border-cyan-400/40 transition-all duration-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full -translate-y-12 translate-x-12 blur-xl"></div>
            <div className="relative z-10">
              <div className="flex items-center mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl mr-4 shadow-lg shadow-cyan-500/25">
                  DR
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">David Rodriguez</h3>
                  <p className="text-slate-400 text-sm">Championship Team Coach</p>
                </div>
              </div>
              <div className="mb-6">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-slate-200 mb-6 leading-relaxed text-lg">
                "Three months in and I'm coaching with confidence I never had before. The AI spotted communication blind spots that transformed my player relationships."
              </p>
              <div className="flex items-center justify-between">
                <span className="text-cyan-400 font-bold text-sm">ROOKIE TO CHAMPION</span>
                <span className="text-slate-400 text-sm">3 Month Transformation</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
