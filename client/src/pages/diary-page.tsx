import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths } from "date-fns";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  Users, 
  Target, 
  BookOpen,
  Edit,
  Trash2,
  Save,
  MessageSquare,
  Star,
  TrendingUp,
  Brain,
  Zap
} from "lucide-react";

interface CoachingSession {
  id: string;
  date: Date;
  time: string;
  title: string;
  ageGroup: string;
  duration: number;
  location: string;
  objectives: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

interface JournalEntry {
  id: string;
  date: Date;
  title: string;
  content: string;
  mood: 'excellent' | 'good' | 'neutral' | 'challenging' | 'difficult';
  highlights: string[];
  learnings: string;
  improvements: string;
  sessionsReflection?: string;
}

export default function DiaryPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState("calendar");
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [showJournalDialog, setShowJournalDialog] = useState(false);
  const [editingSession, setEditingSession] = useState<CoachingSession | null>(null);
  const [editingJournal, setEditingJournal] = useState<JournalEntry | null>(null);

  // Sample data - in a real app, this would come from an API
  const [sessions, setSessions] = useState<CoachingSession[]>([
    {
      id: '1',
      date: new Date(2024, 5, 10),
      time: '16:00',
      title: 'U16 Technical Training',
      ageGroup: 'U16',
      duration: 90,
      location: 'Training Ground A',
      objectives: 'Improve passing accuracy and first touch under pressure',
      status: 'completed'
    },
    {
      id: '2',
      date: new Date(2024, 5, 12),
      time: '18:00',
      title: 'Senior Team Tactical Session',
      ageGroup: 'Senior',
      duration: 120,
      location: 'Main Pitch',
      objectives: 'Practice 4-3-3 formation transitions',
      status: 'scheduled'
    }
  ]);

  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([
    {
      id: '1',
      date: new Date(2024, 5, 10),
      title: 'Great Progress with U16s',
      content: 'The players showed excellent improvement in their passing accuracy today. The new drill focusing on first touch under pressure really worked well.',
      mood: 'excellent',
      highlights: ['Improved passing accuracy', 'Better communication', 'Positive team spirit'],
      learnings: 'Players respond well to competitive drills that simulate match pressure',
      improvements: 'Need to work on defensive positioning during transitions',
      sessionsReflection: 'The session achieved all objectives. Players were engaged and motivated throughout.'
    }
  ]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getSessionsForDate = (date: Date) => {
    return sessions.filter(session => isSameDay(session.date, date));
  };

  const getJournalForDate = (date: Date) => {
    return journalEntries.find(entry => isSameDay(entry.date, date));
  };

  const handleSaveSession = (sessionData: Partial<CoachingSession>) => {
    if (editingSession) {
      setSessions(sessions.map(s => s.id === editingSession.id ? { ...s, ...sessionData } : s));
    } else {
      const newSession: CoachingSession = {
        id: Date.now().toString(),
        date: selectedDate,
        time: sessionData.time || '',
        title: sessionData.title || '',
        ageGroup: sessionData.ageGroup || '',
        duration: sessionData.duration || 90,
        location: sessionData.location || '',
        objectives: sessionData.objectives || '',
        notes: sessionData.notes || '',
        status: sessionData.status || 'scheduled'
      };
      setSessions([...sessions, newSession]);
    }
    setShowSessionDialog(false);
    setEditingSession(null);
  };

  const handleSaveJournal = (journalData: Partial<JournalEntry>) => {
    if (editingJournal) {
      setJournalEntries(journalEntries.map(j => j.id === editingJournal.id ? { ...j, ...journalData } : j));
    } else {
      const newEntry: JournalEntry = {
        id: Date.now().toString(),
        date: selectedDate,
        title: journalData.title || '',
        content: journalData.content || '',
        mood: journalData.mood || 'good',
        highlights: journalData.highlights || [],
        learnings: journalData.learnings || '',
        improvements: journalData.improvements || '',
        sessionsReflection: journalData.sessionsReflection || ''
      };
      setJournalEntries([...journalEntries, newEntry]);
    }
    setShowJournalDialog(false);
    setEditingJournal(null);
  };

  const handleDeleteSession = (sessionId: string) => {
    setSessions(sessions.filter(s => s.id !== sessionId));
  };

  const handleDeleteJournal = (journalId: string) => {
    setJournalEntries(journalEntries.filter(j => j.id !== journalId));
  };

  const getMoodColor = (mood: JournalEntry['mood']) => {
    switch (mood) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'neutral': return 'bg-gray-500';
      case 'challenging': return 'bg-yellow-500';
      case 'difficult': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: CoachingSession['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/30">
        {/* Header Section */}
        <div className="relative bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 text-white overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.03)_1px,transparent_1px)] bg-[size:32px_32px]"></div>
          <div className="relative p-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mr-4">
                  <CalendarIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">
                    Coach Diary
                  </h1>
                  <p className="text-slate-300 text-lg mt-1">Schedule sessions and track your coaching journey</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <h3 className="text-xl font-semibold mb-2">Session Planning</h3>
                  <p className="text-slate-300">Schedule and organize your coaching sessions with detailed objectives and notes.</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <h3 className="text-xl font-semibold mb-2">Daily Reflections</h3>
                  <p className="text-slate-300">Record your daily thoughts, learnings, and insights from each coaching experience.</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <h3 className="text-xl font-semibold mb-2">Progress Tracking</h3>
                  <p className="text-slate-300">Monitor your development as a coach and track key improvements over time.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-100 rounded-xl p-1 mb-8">
              <TabsTrigger value="calendar" className="rounded-lg font-semibold">Calendar View</TabsTrigger>
              <TabsTrigger value="sessions" className="rounded-lg font-semibold">Session Manager</TabsTrigger>
              <TabsTrigger value="journal" className="rounded-lg font-semibold">Daily Journal</TabsTrigger>
            </TabsList>

            <TabsContent value="calendar" className="space-y-6">
              {/* Calendar Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800">
                  {format(currentDate, 'MMMM yyyy')}
                </h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(new Date())}
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-4 text-center font-semibold text-slate-600 bg-slate-100 rounded-lg">
                    {day}
                  </div>
                ))}
                
                {calendarDays.map(day => {
                  const daySessions = getSessionsForDate(day);
                  const dayJournal = getJournalForDate(day);
                  const isSelected = isSameDay(day, selectedDate);
                  const isCurrentDay = isToday(day);
                  
                  return (
                    <div
                      key={day.toString()}
                      className={`min-h-24 p-2 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        isSelected ? 'border-blue-500 bg-blue-50' : 
                        isCurrentDay ? 'border-cyan-500 bg-cyan-50' : 
                        'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                      onClick={() => setSelectedDate(day)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${
                          isCurrentDay ? 'text-cyan-600' : 
                          isSelected ? 'text-blue-600' : 
                          'text-slate-600'
                        }`}>
                          {format(day, 'd')}
                        </span>
                        {dayJournal && (
                          <div className={`w-2 h-2 rounded-full ${getMoodColor(dayJournal.mood)}`}></div>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        {daySessions.slice(0, 2).map(session => (
                          <div key={session.id} className="text-xs p-1 bg-blue-100 rounded text-blue-800 truncate">
                            {session.time} - {session.title}
                          </div>
                        ))}
                        {daySessions.length > 2 && (
                          <div className="text-xs text-slate-500">+{daySessions.length - 2} more</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Date Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setEditingSession(null);
                          setShowSessionDialog(true);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Session
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingJournal(null);
                          setShowJournalDialog(true);
                        }}
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        Add Journal
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Sessions for Selected Date */}
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        Sessions ({getSessionsForDate(selectedDate).length})
                      </h3>
                      <div className="space-y-3">
                        {getSessionsForDate(selectedDate).map(session => (
                          <div key={session.id} className="p-3 border rounded-lg bg-slate-50">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{session.title}</span>
                                <Badge className={getStatusColor(session.status)}>
                                  {session.status}
                                </Badge>
                              </div>
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" onClick={() => {
                                  setEditingSession(session);
                                  setShowSessionDialog(true);
                                }}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleDeleteSession(session.id)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="text-sm text-slate-600 space-y-1">
                              <div>⏰ {session.time} ({session.duration} min)</div>
                              <div>👥 {session.ageGroup}</div>
                              <div>📍 {session.location}</div>
                              <div>🎯 {session.objectives}</div>
                            </div>
                          </div>
                        ))}
                        {getSessionsForDate(selectedDate).length === 0 && (
                          <p className="text-slate-500 text-center py-4">No sessions scheduled</p>
                        )}
                      </div>
                    </div>

                    {/* Journal for Selected Date */}
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Daily Journal
                      </h3>
                      {(() => {
                        const journal = getJournalForDate(selectedDate);
                        return journal ? (
                          <div className="p-3 border rounded-lg bg-slate-50">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{journal.title}</span>
                                <div className={`w-3 h-3 rounded-full ${getMoodColor(journal.mood)}`}></div>
                              </div>
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" onClick={() => {
                                  setEditingJournal(journal);
                                  setShowJournalDialog(true);
                                }}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleDeleteJournal(journal.id)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm text-slate-600 mb-2">{journal.content}</p>
                            <div className="text-xs text-slate-500">
                              <div className="mb-1">✨ Highlights: {journal.highlights.join(', ')}</div>
                              <div>💡 Key Learning: {journal.learnings}</div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-slate-500 text-center py-4">No journal entry for this day</p>
                        );
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sessions" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800">Session Manager</h2>
                <Button onClick={() => {
                  setEditingSession(null);
                  setShowSessionDialog(true);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Session
                </Button>
              </div>

              <div className="grid gap-4">
                {sessions.map(session => (
                  <Card key={session.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-semibold">{session.title}</h3>
                          <p className="text-slate-600">{format(session.date, 'EEEE, MMMM d, yyyy')} at {session.time}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(session.status)}>
                            {session.status}
                          </Badge>
                          <Button size="sm" variant="outline" onClick={() => {
                            setEditingSession(session);
                            setShowSessionDialog(true);
                          }}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Age Group:</span>
                          <p className="text-slate-600">{session.ageGroup}</p>
                        </div>
                        <div>
                          <span className="font-medium">Duration:</span>
                          <p className="text-slate-600">{session.duration} minutes</p>
                        </div>
                        <div>
                          <span className="font-medium">Location:</span>
                          <p className="text-slate-600">{session.location}</p>
                        </div>
                        <div>
                          <span className="font-medium">Status:</span>
                          <p className="text-slate-600 capitalize">{session.status}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <span className="font-medium">Objectives:</span>
                        <p className="text-slate-600 mt-1">{session.objectives}</p>
                      </div>
                      
                      {session.notes && (
                        <div className="mt-4">
                          <span className="font-medium">Notes:</span>
                          <p className="text-slate-600 mt-1">{session.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="journal" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800">Daily Journal Entries</h2>
                <Button onClick={() => {
                  setEditingJournal(null);
                  setShowJournalDialog(true);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Entry
                </Button>
              </div>

              <div className="grid gap-4">
                {journalEntries.map(journal => (
                  <Card key={journal.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full ${getMoodColor(journal.mood)}`}></div>
                          <div>
                            <h3 className="text-xl font-semibold">{journal.title}</h3>
                            <p className="text-slate-600">{format(journal.date, 'EEEE, MMMM d, yyyy')}</p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => {
                          setEditingJournal(journal);
                          setShowJournalDialog(true);
                        }}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                      
                      <p className="text-slate-700 mb-4">{journal.content}</p>
                      
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Highlights:</span>
                          <ul className="list-disc list-inside text-slate-600 mt-1">
                            {journal.highlights.map((highlight, index) => (
                              <li key={index}>{highlight}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <span className="font-medium">Key Learnings:</span>
                          <p className="text-slate-600 mt-1">{journal.learnings}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <span className="font-medium">Areas for Improvement:</span>
                        <p className="text-slate-600 mt-1">{journal.improvements}</p>
                      </div>
                      
                      {journal.sessionsReflection && (
                        <div className="mt-4">
                          <span className="font-medium">Session Reflection:</span>
                          <p className="text-slate-600 mt-1">{journal.sessionsReflection}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Session Dialog */}
        <Dialog open={showSessionDialog} onOpenChange={setShowSessionDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingSession ? 'Edit Session' : 'New Coaching Session'}</DialogTitle>
              <DialogDescription>
                {editingSession ? 'Update session details' : 'Schedule a new coaching session'}
              </DialogDescription>
            </DialogHeader>
            <SessionForm
              session={editingSession}
              selectedDate={selectedDate}
              onSave={handleSaveSession}
              onCancel={() => setShowSessionDialog(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Journal Dialog */}
        <Dialog open={showJournalDialog} onOpenChange={setShowJournalDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingJournal ? 'Edit Journal Entry' : 'New Journal Entry'}</DialogTitle>
              <DialogDescription>
                {editingJournal ? 'Update your journal entry' : 'Record your daily coaching reflections'}
              </DialogDescription>
            </DialogHeader>
            <JournalForm
              journal={editingJournal}
              selectedDate={selectedDate}
              onSave={handleSaveJournal}
              onCancel={() => setShowJournalDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

// Session Form Component
function SessionForm({ 
  session, 
  selectedDate, 
  onSave, 
  onCancel 
}: { 
  session: CoachingSession | null; 
  selectedDate: Date; 
  onSave: (data: Partial<CoachingSession>) => void; 
  onCancel: () => void; 
}) {
  const [formData, setFormData] = useState({
    title: session?.title || '',
    time: session?.time || '',
    ageGroup: session?.ageGroup || '',
    duration: session?.duration || 90,
    location: session?.location || '',
    objectives: session?.objectives || '',
    notes: session?.notes || '',
    status: session?.status || 'scheduled' as CoachingSession['status']
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Session Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., U16 Technical Training"
            required
          />
        </div>
        <div>
          <Label htmlFor="time">Time</Label>
          <Input
            id="time"
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="ageGroup">Age Group</Label>
          <Input
            id="ageGroup"
            value={formData.ageGroup}
            onChange={(e) => setFormData({ ...formData, ageGroup: e.target.value })}
            placeholder="e.g., U16, Senior, Adults"
            required
          />
        </div>
        <div>
          <Label htmlFor="duration">Duration (minutes)</Label>
          <Input
            id="duration"
            type="number"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
            placeholder="90"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          placeholder="Training Ground A"
          required
        />
      </div>

      <div>
        <Label htmlFor="objectives">Session Objectives</Label>
        <Textarea
          id="objectives"
          value={formData.objectives}
          onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
          placeholder="What do you want to achieve in this session?"
          required
        />
      </div>

      <div>
        <Label htmlFor="status">Status</Label>
        <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as CoachingSession['status'] })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="notes">Additional Notes (Optional)</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Any additional notes about this session"
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          <Save className="w-4 h-4 mr-2" />
          Save Session
        </Button>
      </DialogFooter>
    </form>
  );
}

// Journal Form Component
function JournalForm({ 
  journal, 
  selectedDate, 
  onSave, 
  onCancel 
}: { 
  journal: JournalEntry | null; 
  selectedDate: Date; 
  onSave: (data: Partial<JournalEntry>) => void; 
  onCancel: () => void; 
}) {
  const [formData, setFormData] = useState({
    title: journal?.title || '',
    content: journal?.content || '',
    mood: journal?.mood || 'good' as JournalEntry['mood'],
    highlights: journal?.highlights?.join(', ') || '',
    learnings: journal?.learnings || '',
    improvements: journal?.improvements || '',
    sessionsReflection: journal?.sessionsReflection || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      highlights: formData.highlights.split(',').map(h => h.trim()).filter(h => h)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Entry Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Great Progress Today"
            required
          />
        </div>
        <div>
          <Label htmlFor="mood">Overall Mood</Label>
          <Select value={formData.mood} onValueChange={(value) => setFormData({ ...formData, mood: value as JournalEntry['mood'] })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="excellent">Excellent</SelectItem>
              <SelectItem value="good">Good</SelectItem>
              <SelectItem value="neutral">Neutral</SelectItem>
              <SelectItem value="challenging">Challenging</SelectItem>
              <SelectItem value="difficult">Difficult</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="content">Journal Entry</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder="Write about your day, experiences, and thoughts..."
          className="min-h-[100px]"
          required
        />
      </div>

      <div>
        <Label htmlFor="highlights">Key Highlights (comma-separated)</Label>
        <Input
          id="highlights"
          value={formData.highlights}
          onChange={(e) => setFormData({ ...formData, highlights: e.target.value })}
          placeholder="Improved technique, Great team spirit, Positive feedback"
        />
      </div>

      <div>
        <Label htmlFor="learnings">Key Learnings</Label>
        <Textarea
          id="learnings"
          value={formData.learnings}
          onChange={(e) => setFormData({ ...formData, learnings: e.target.value })}
          placeholder="What did you learn today?"
          required
        />
      </div>

      <div>
        <Label htmlFor="improvements">Areas for Improvement</Label>
        <Textarea
          id="improvements"
          value={formData.improvements}
          onChange={(e) => setFormData({ ...formData, improvements: e.target.value })}
          placeholder="What could you improve for next time?"
          required
        />
      </div>

      <div>
        <Label htmlFor="sessionsReflection">Session Reflection (Optional)</Label>
        <Textarea
          id="sessionsReflection"
          value={formData.sessionsReflection}
          onChange={(e) => setFormData({ ...formData, sessionsReflection: e.target.value })}
          placeholder="Reflect on any coaching sessions you had today"
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          <Save className="w-4 h-4 mr-2" />
          Save Entry
        </Button>
      </DialogFooter>
    </form>
  );
}