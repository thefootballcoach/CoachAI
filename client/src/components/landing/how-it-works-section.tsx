import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 bg-neutral-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">How CoachAI Works</h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto">A simple three-step process to transform your coaching through AI-powered analysis.</p>
        </div>
        
        <div className="max-w-5xl mx-auto">
          {/* Step 1 */}
          <div className="flex flex-col md:flex-row items-center mb-16">
            <div className="md:w-1/2 mb-8 md:mb-0 md:pr-8">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="relative bg-neutral-200 aspect-w-16 aspect-h-9">
                  <img 
                    src="https://images.unsplash.com/photo-1551958219-acbc608c6377?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                    alt="Coach recording a training session" 
                    className="object-cover w-full h-full" 
                  />
                  <div className="absolute inset-0 bg-primary bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white bg-opacity-90 px-4 py-2 rounded-lg">
                      <span className="text-primary font-medium">Record & Upload</span>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">1</div>
                    <h3 className="ml-3 text-lg font-heading font-bold">Record Your Session</h3>
                  </div>
                  <p className="text-neutral-600 text-sm">Record your coaching session with any device that captures audio clearly. Our AI needs to hear your instructions and feedback.</p>
                </div>
              </div>
            </div>
            <div className="md:w-1/2">
              <h3 className="text-2xl font-heading font-bold mb-4">1. Upload Your Coaching Session</h3>
              <p className="mb-4 text-neutral-600">Record your practice sessions or games with standard equipment. Our platform accepts video files from smartphones, tablets, or professional cameras.</p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-secondary mt-1 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Supports MP4, MOV, AVI, and other common formats</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-secondary mt-1 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Secure, encrypted storage of your sessions</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-secondary mt-1 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Simple drag-and-drop interface</span>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Step 2 */}
          <div className="flex flex-col md:flex-row-reverse items-center mb-16">
            <div className="md:w-1/2 mb-8 md:mb-0 md:pl-8">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-6 bg-neutral-100 border-b border-neutral-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">2</div>
                      <h3 className="ml-3 text-lg font-heading font-bold">AI Processing</h3>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center animate-pulse">
                      <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-2 bg-neutral-200 rounded-full w-full">
                      <div className="h-2 bg-primary rounded-full video-progress" style={{width: "85%"}}></div>
                    </div>
                    <div className="flex justify-between text-sm text-neutral-500">
                      <span>Processing: 85%</span>
                      <span>Approximately 2 minutes remaining</span>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-neutral-700">Audio extraction complete</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-neutral-700">Speech recognition in progress</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-neutral-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-neutral-400">Sentiment analysis pending</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="md:w-1/2">
              <h3 className="text-2xl font-heading font-bold mb-4">2. AI Analyzes Your Coaching</h3>
              <p className="mb-4 text-neutral-600">Our advanced AI system processes your video to extract deep insights about your coaching style, communication patterns, and effectiveness.</p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-secondary mt-1 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Speech recognition captures your instructions</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-secondary mt-1 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Tone analysis measures energy and engagement</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-secondary mt-1 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Content analysis evaluates coaching techniques</span>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Step 3 */}
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0 md:pr-8">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-5 border-b border-neutral-200">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">3</div>
                    <h3 className="ml-3 text-lg font-heading font-bold">Detailed Feedback Report</h3>
                  </div>
                </div>
                <div className="p-5">
                  <div className="mb-4">
                    <h4 className="font-medium text-neutral-700 mb-2">Communication Clarity</h4>
                    <div className="w-full bg-neutral-200 rounded-full h-2.5">
                      <div className="bg-secondary h-2.5 rounded-full" style={{width: "78%"}}></div>
                    </div>
                    <div className="flex justify-between text-xs text-neutral-500 mt-1">
                      <span>0</span>
                      <span>78/100</span>
                      <span>100</span>
                    </div>
                  </div>
                  <div className="mb-4">
                    <h4 className="font-medium text-neutral-700 mb-2">Team Engagement</h4>
                    <div className="w-full bg-neutral-200 rounded-full h-2.5">
                      <div className="bg-secondary h-2.5 rounded-full" style={{width: "85%"}}></div>
                    </div>
                    <div className="flex justify-between text-xs text-neutral-500 mt-1">
                      <span>0</span>
                      <span>85/100</span>
                      <span>100</span>
                    </div>
                  </div>
                  <div className="mb-4">
                    <h4 className="font-medium text-neutral-700 mb-2">Instruction Quality</h4>
                    <div className="w-full bg-neutral-200 rounded-full h-2.5">
                      <div className="bg-secondary h-2.5 rounded-full" style={{width: "65%"}}></div>
                    </div>
                    <div className="flex justify-between text-xs text-neutral-500 mt-1">
                      <span>0</span>
                      <span>65/100</span>
                      <span>100</span>
                    </div>
                  </div>
                  <div className="p-3 bg-neutral-100 rounded-lg text-sm mt-4">
                    <p className="text-neutral-700"><span className="font-medium">Recommendation:</span> Try using more specific, actionable feedback when correcting player positions. Your positive reinforcement is excellent.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="md:w-1/2">
              <h3 className="text-2xl font-heading font-bold mb-4">3. Get Actionable Feedback</h3>
              <p className="mb-4 text-neutral-600">Receive a comprehensive report with metrics, scores, and specific recommendations to improve your coaching effectiveness.</p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-secondary mt-1 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Detailed scores and metrics</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-secondary mt-1 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Specific improvement recommendations</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-secondary mt-1 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Track progress between sessions</span>
                </li>
              </ul>
              <div className="mt-6">
                <Button asChild>
                  <Link href="/auth">
                    Try It Yourself
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
