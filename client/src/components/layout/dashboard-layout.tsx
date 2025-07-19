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
import { Separator } from "@/components/ui/separator";
import { 
  ChevronLeft, 
  ChevronRight,
  Brain, 
  Zap, 
  Target, 
  Activity,
  TrendingUp,
  User, 
  Settings, 
  CreditCard, 
  LogOut, 
  Menu,
  Bell,
  Search,
  Bot,
  Cpu,
  Eye,
  BookOpen,
  Calendar,
  Building2,
  Shield,
  FileText,
  AlertTriangle
} from "lucide-react";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Please log in</h2>
          <p className="text-muted-foreground mb-4">You need to be logged in to view this page</p>
          <Button asChild>
            <Link href="/auth">Go to Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  const navItems = [
    { 
      name: "Neural Command Center", 
      path: "/dashboard", 
      icon: <Brain className="h-5 w-5" /> 
    },
    { 
      name: "New Analysis", 
      path: "/upload", 
      icon: <Zap className="h-5 w-5" /> 
    },
    { 
      name: "Performance Intelligence", 
      path: "/analytics", 
      icon: <TrendingUp className="h-5 w-5" /> 
    },
    { 
      name: "AI Insights", 
      path: "/feedback", 
      icon: <Target className="h-5 w-5" /> 
    },
    { 
      name: "Coaching Research", 
      path: "/research", 
      icon: <BookOpen className="h-5 w-5" /> 
    },
    { 
      name: "Coach Diary", 
      path: "/diary", 
      icon: <Calendar className="h-5 w-5" /> 
    },
    { 
      name: "Development Plans", 
      path: "/development-plans", 
      icon: <Target className="h-5 w-5" /> 
    },
    { 
      name: "Coach Profile", 
      path: "/profile", 
      icon: <User className="h-5 w-5" /> 
    },
    ...(user?.clubId ? [
      { 
        name: "Club Management", 
        path: "/club-dashboard", 
        icon: <Building2 className="h-5 w-5" /> 
      }
    ] : []),
    ...((user?.role === 'admin' || user?.role === 'club_admin' || user?.position === 'head_coach') ? [{ 
      name: "Custom Reports", 
      path: "/custom-feedback-reports", 
      icon: <FileText className="h-5 w-5" /> 
    }] : []),
    ...((user?.username === "admin" || user?.role === "super_admin") ? [
      { 
        name: "Super Admin", 
        path: "/super-admin", 
        icon: <Shield className="h-5 w-5" /> 
      },
      { 
        name: "Error Logs", 
        path: "/error-logs", 
        icon: <AlertTriangle className="h-5 w-5" /> 
      }
    ] : []),
    { 
      name: "Elite Access", 
      path: "/subscription", 
      icon: <CreditCard className="h-5 w-5" /> 
    },
  ];

  const isActive = (path: string) => {
    // Handle nested routes by checking if the current path starts with the nav item path
    return location === path || (path !== "/dashboard" && location.startsWith(path));
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      {/* AI-Enhanced Sidebar - desktop */}
      <aside 
        className={`bg-gradient-to-b from-slate-900 via-blue-900/95 to-purple-900/90 backdrop-blur-xl border-r border-slate-700/50 fixed inset-y-0 left-0 z-50 transform ${collapsed ? 'w-16' : 'w-64'} overflow-y-auto transition-all duration-300 ease-in-out hidden md:block shadow-2xl`}
      >
        {/* Neural Network Background */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-4 w-8 h-8 border border-cyan-400 rounded-full animate-pulse"></div>
          <div className="absolute top-32 right-4 w-6 h-6 border border-purple-400 rounded-full animate-pulse delay-300"></div>
          <div className="absolute bottom-20 left-6 w-4 h-4 border border-blue-400 rounded-full animate-pulse delay-700"></div>
        </div>

        <div className="flex flex-col h-full relative">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} h-16 px-4 border-b border-slate-700/50`}>
            {!collapsed && (
              <Link href="/dashboard" className="flex items-center group">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center mr-3 shadow-lg group-hover:scale-105 transition-transform duration-300">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-white font-bold text-lg bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">CoachAI</span>
                  <p className="text-xs text-slate-400">Neural Analytics</p>
                </div>
              </Link>
            )}
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setCollapsed(!collapsed)}
              className="text-slate-300 hover:bg-slate-800/50 hover:text-white transition-colors duration-300"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
          </div>

          <div className="flex-1 py-8">
            <nav className="space-y-2 px-3">
              {navItems.map((item) => (
                <Link 
                  key={item.path} 
                  href={item.path}
                  className={`group flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                    isActive(item.path) 
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-white shadow-lg' 
                      : 'text-slate-300 hover:bg-slate-800/50 hover:text-white border border-transparent'
                  } ${collapsed ? 'justify-center' : ''}`}
                >
                  <span className={`flex-shrink-0 ${isActive(item.path) ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-400'} transition-colors duration-300`}>
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <span className="ml-3 font-medium">{item.name}</span>
                  )}
                  {!collapsed && isActive(item.path) && (
                    <div className="ml-auto w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                  )}
                </Link>
              ))}
            </nav>

            {/* AI Status Indicator */}
            {!collapsed && (
              <div className="mt-8 mx-3 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl">
                <div className="flex items-center">
                  <Bot className="w-5 h-5 text-green-400 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-green-100">AI Systems</p>
                    <div className="flex items-center mt-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                      <span className="text-xs text-green-300">Online & Active</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-700/50">
            {collapsed ? (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout}
                className="w-full text-slate-400 hover:bg-slate-800/50 hover:text-white transition-colors duration-300"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center p-3 bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-xl border border-slate-600/30">
                  <div className="flex-shrink-0">
                    <div className="bg-gradient-to-br from-cyan-500 to-blue-600 h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                      {user.name ? user.name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {user.name || user.username}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      Elite Coach
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleLogout}
                  className="w-full text-slate-300 border-slate-600/50 hover:bg-gradient-to-r hover:from-red-500/20 hover:to-pink-500/20 hover:border-red-500/30 hover:text-white transition-all duration-300"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Neural Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={`flex-1 flex flex-col ${collapsed ? 'md:pl-16' : 'md:pl-64'} transition-all duration-300 min-h-screen`}>
        {/* Mobile-First AI-Enhanced Top Navigation */}
        <header className="bg-white/95 backdrop-blur-lg border-b border-slate-200/60 h-16 sm:h-18 flex items-center justify-between px-3 sm:px-4 md:px-8 shadow-lg shadow-slate-200/20 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-transparent to-cyan-50/20 pointer-events-none"></div>
          
          <div className="flex items-center md:hidden relative z-10">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 rounded-xl transition-all duration-200"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Link href="/dashboard" className="ml-3 flex items-center group">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 via-cyan-500 to-blue-700 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-blue-500/25 group-hover:scale-105 group-hover:shadow-blue-500/40 transition-all duration-300">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-slate-900 font-bold text-lg tracking-tight">CoachAI</span>
                <span className="text-xs text-slate-500 font-medium">Neural Analytics</span>
              </div>
            </Link>
          </div>

          <div className="hidden md:flex items-center flex-1 ml-4">
            <div className="relative w-80">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input 
                type="text" 
                placeholder="Search neural insights, sessions, feedback..." 
                className="w-full py-2.5 pl-11 pr-4 text-sm bg-gradient-to-r from-slate-100 to-blue-100/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-white transition-all duration-300 placeholder-slate-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="icon"
              className="text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 transition-colors duration-300 relative"
            >
              <Bell className="h-5 w-5" />
              <div className="absolute top-1 right-1 w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center hover:bg-slate-100 transition-colors duration-300 rounded-xl"
                >
                  <div className="bg-gradient-to-br from-cyan-500 to-blue-600 h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                    {user.name ? user.name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden md:flex ml-3 font-medium text-slate-700">
                    {user.name || user.username}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 border border-slate-200 shadow-xl">
                <Link href="/profile">
                  <DropdownMenuItem className="cursor-pointer hover:bg-slate-50">
                    <User className="mr-2 h-4 w-4 text-slate-600" />
                    Coach Profile
                  </DropdownMenuItem>
                </Link>
                <Link href="/subscription">
                  <DropdownMenuItem className="cursor-pointer hover:bg-slate-50">
                    <CreditCard className="mr-2 h-4 w-4 text-slate-600" />
                    Elite Access
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer hover:bg-red-50 focus:bg-red-50" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4 text-red-600" />
                  <span className="text-red-600">Neural Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div 
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setMobileMenuOpen(false)}
            ></div>
            <div className="relative bg-sidebar w-64 h-full overflow-y-auto">
              <div className="flex items-center justify-between h-16 px-4">
                <Link href="/dashboard" className="flex items-center">
                  <svg className="h-8 w-8 text-white" viewBox="0 0 40 40" fill="currentColor">
                    <path d="M20 3.33331C10.8 3.33331 3.33337 10.8 3.33337 20C3.33337 29.2 10.8 36.6666 20 36.6666C29.2 36.6666 36.6667 29.2 36.6667 20C36.6667 10.8 29.2 3.33331 20 3.33331ZM16.6667 28.3333L8.33337 20L10.6834 17.65L16.6667 23.6166L29.3167 10.9666L31.6667 13.3333L16.6667 28.3333Z"></path>
                  </svg>
                  <span className="ml-2 text-white font-heading font-bold">CoachAI</span>
                </Link>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white hover:bg-sidebar-accent hover:text-white"
                >
                  <ChevronLeft />
                </Button>
              </div>

              <Separator className="bg-sidebar-border" />

              <div className="py-6">
                <nav className="space-y-1 px-2">
                  {navItems.map((item) => (
                    <Link 
                      key={item.path} 
                      href={item.path}
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                        isActive(item.path) 
                          ? 'bg-sidebar-accent text-white' 
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:bg-opacity-25'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className="flex-shrink-0">{item.icon}</span>
                      <span className="ml-3">{item.name}</span>
                    </Link>
                  ))}
                </nav>
              </div>

              <div className="p-4">
                <Separator className="bg-sidebar-border mb-4" />
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="bg-primary h-8 w-8 rounded-full flex items-center justify-center text-white font-bold">
                      {user.name ? user.name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="ml-2 flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {user.name || user.username}
                    </p>
                    <p className="text-xs text-sidebar-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleLogout}
                  className="w-full mt-4 text-sidebar-foreground border-sidebar-border hover:bg-sidebar-accent hover:bg-opacity-25"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Log out
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
