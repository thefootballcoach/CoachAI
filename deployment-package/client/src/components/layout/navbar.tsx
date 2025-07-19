import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Menu, X, User, LogOut, Settings, Brain, Building2 } from "lucide-react";

export default function Navbar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return location === path;
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <nav className="bg-white/95 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50 shadow-lg shadow-slate-200/20">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center group">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-cyan-500 to-blue-700 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-all duration-300 shadow-lg shadow-blue-500/25">
                  <Brain className="w-7 h-7 text-white group-hover:rotate-12 transition-transform duration-300" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white animate-pulse shadow-sm"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 bg-clip-text text-transparent tracking-tight">CoachAI</span>
                <span className="text-xs text-slate-600 font-medium tracking-widest uppercase">Neural Analytics</span>
              </div>
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-10">
            {!user ? (
              <>
                <Link href="/#features" className={`relative text-slate-700 hover:text-slate-900 font-semibold transition-all duration-300 group ${isActive("/#features") ? "text-blue-600" : ""}`}>
                  Features
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 group-hover:w-full transition-all duration-300"></span>
                </Link>
                <Link href="/#how-it-works" className={`relative text-slate-700 hover:text-slate-900 font-semibold transition-all duration-300 group ${isActive("/#how-it-works") ? "text-blue-600" : ""}`}>
                  How It Works
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 group-hover:w-full transition-all duration-300"></span>
                </Link>
                <Link href="/#pricing" className={`relative text-slate-700 hover:text-slate-900 font-semibold transition-all duration-300 group ${isActive("/#pricing") ? "text-blue-600" : ""}`}>
                  Pricing
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 group-hover:w-full transition-all duration-300"></span>
                </Link>
                <Link href="/#testimonials" className={`relative text-slate-700 hover:text-slate-900 font-semibold transition-all duration-300 group ${isActive("/#testimonials") ? "text-blue-600" : ""}`}>
                  Testimonials
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 group-hover:w-full transition-all duration-300"></span>
                </Link>
              </>
            ) : (
              <>
                <Link href="/dashboard" className={`relative text-slate-700 hover:text-slate-900 font-semibold transition-all duration-300 group ${isActive("/dashboard") ? "text-blue-600" : ""}`}>
                  Dashboard
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 group-hover:w-full transition-all duration-300"></span>
                </Link>
                <Link href="/upload" className={`relative text-slate-700 hover:text-slate-900 font-semibold transition-all duration-300 group ${isActive("/upload") ? "text-blue-600" : ""}`}>
                  Upload
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 group-hover:w-full transition-all duration-300"></span>
                </Link>

                <Link href="/pricing" className={`relative text-slate-700 hover:text-slate-900 font-semibold transition-all duration-300 group ${isActive("/pricing") ? "text-blue-600" : ""}`}>
                  Pricing
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 group-hover:w-full transition-all duration-300"></span>
                </Link>
              </>
            )}
          </div>
          <div className="flex items-center gap-6">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-3 text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 px-4 py-3 rounded-xl transition-all duration-300">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full flex items-center justify-center shadow-md">
                      <span className="text-white font-bold text-sm">{(user.name || user.username).charAt(0).toUpperCase()}</span>
                    </div>
                    <span className="font-semibold">{user.name || user.username}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-xl border-slate-200/60 rounded-xl shadow-xl shadow-slate-200/20 min-w-48">
                  <Link href="/dashboard">
                    <DropdownMenuItem className="cursor-pointer text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg m-1 p-3">
                      <User className="mr-3 h-4 w-4" />
                      Dashboard
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/profile">
                    <DropdownMenuItem className="cursor-pointer text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg m-1 p-3">
                      <Settings className="mr-3 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                  </Link>

                  <DropdownMenuSeparator className="bg-slate-200/60 mx-2" />
                  <DropdownMenuItem className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50/80 rounded-lg m-1 p-3" onClick={handleLogout}>
                    <LogOut className="mr-3 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/auth" className="hidden md:inline-flex px-6 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-all duration-300 rounded-xl hover:bg-slate-100/80">
                  Log in
                </Link>
                <Button asChild variant="outline" className="hidden md:inline-flex border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold px-4 py-2.5 rounded-xl transition-all duration-300">
                  <Link href="/register">Create Account</Link>
                </Button>
                <Button asChild className="bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-700 hover:from-blue-500 hover:via-cyan-400 hover:to-blue-600 text-white border-0 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105">
                  <Link href="/auth">Get Started</Link>
                </Button>
              </div>
            )}
            <button 
              type="button" 
              className="md:hidden p-3 ml-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 focus:outline-none transition-all duration-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-gradient-to-b from-slate-900/98 to-slate-800/98 backdrop-blur-xl border-t border-slate-600/30">
          <div className="container mx-auto px-6 py-6 space-y-4">
            {!user ? (
              <>
                <Link href="/#features" className="block py-3 px-4 text-slate-200 hover:text-white hover:bg-slate-800/50 font-semibold transition-all duration-300 rounded-xl">Features</Link>
                <Link href="/#how-it-works" className="block py-3 px-4 text-slate-200 hover:text-white hover:bg-slate-800/50 font-semibold transition-all duration-300 rounded-xl">How It Works</Link>
                <Link href="/#pricing" className="block py-3 px-4 text-slate-200 hover:text-white hover:bg-slate-800/50 font-semibold transition-all duration-300 rounded-xl">Pricing</Link>
                <Link href="/#testimonials" className="block py-3 px-4 text-slate-200 hover:text-white hover:bg-slate-800/50 font-semibold transition-all duration-300 rounded-xl">Testimonials</Link>
                <div className="pt-4 flex flex-col space-y-4">
                  <Link href="/auth" className="block py-3 px-4 text-cyan-400 hover:text-cyan-300 font-semibold transition-colors rounded-xl hover:bg-slate-800/30">Log in</Link>
                  <Button asChild variant="outline" className="w-full border-2 border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white py-3 rounded-xl font-semibold">
                    <Link href="/register">Create Account</Link>
                  </Button>
                  <Button asChild className="w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-400 hover:via-blue-400 hover:to-purple-500 text-white border-0 shadow-lg shadow-cyan-500/25 py-3 rounded-xl font-semibold">
                    <Link href="/auth">Get Started</Link>
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Link href="/dashboard" className="block py-3 px-4 text-slate-200 hover:text-white hover:bg-slate-800/50 font-semibold transition-all duration-300 rounded-xl">Dashboard</Link>
                <Link href="/upload" className="block py-3 px-4 text-slate-200 hover:text-white hover:bg-slate-800/50 font-semibold transition-all duration-300 rounded-xl">Upload</Link>
                <Link href="/pricing" className="block py-3 px-4 text-slate-200 hover:text-white hover:bg-slate-800/50 font-semibold transition-all duration-300 rounded-xl">Pricing</Link>
                <Link href="/profile" className="block py-3 px-4 text-slate-200 hover:text-white hover:bg-slate-800/50 font-semibold transition-all duration-300 rounded-xl">Profile</Link>
                <Button 
                  variant="outline" 
                  className="w-full mt-4 border-slate-600/50 text-slate-300 hover:bg-slate-800/50 hover:text-white py-3 rounded-xl font-semibold transition-all duration-300"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
