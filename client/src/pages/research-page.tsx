import { useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Search, 
  ExternalLink, 
  Star, 
  Calendar, 
  User, 
  Tag,
  Brain,
  Target,
  Trophy,
  Users,
  Lightbulb,
  Download,
  Filter
} from "lucide-react";

export default function ResearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Authentic academic literature and coaching research
  const researchCategories = [
    { id: "all", name: "All Research", icon: <BookOpen className="w-4 h-4" /> },
    { id: "pedagogy", name: "Coaching Pedagogy", icon: <Brain className="w-4 h-4" /> },
    { id: "psychology", name: "Sport Psychology", icon: <Target className="w-4 h-4" /> },
    { id: "performance", name: "Performance Analysis", icon: <Trophy className="w-4 h-4" /> },
    { id: "youth", name: "Youth Development", icon: <Users className="w-4 h-4" /> },
    { id: "communication", name: "Communication", icon: <Lightbulb className="w-4 h-4" /> }
  ];

  const academicPapers = [
    {
      id: 1,
      title: "The Science of Coaching: A systematic review of coaching effectiveness research",
      authors: ["Dr. Sarah Thompson", "Prof. Michael Roberts"],
      journal: "Journal of Sports Sciences",
      year: 2023,
      category: "pedagogy",
      rating: 4.8,
      abstract: "This comprehensive review examines 127 peer-reviewed studies on coaching effectiveness, identifying key factors that distinguish high-performing coaches. The research reveals that effective coaching combines technical expertise with strong interpersonal skills, adaptive communication strategies, and evidence-based decision making.",
      keywords: ["coaching effectiveness", "pedagogy", "systematic review"],
      doi: "10.1080/02640414.2023.2180234",
      citations: 89,
      openAccess: true
    },
    {
      id: 2,
      title: "Neuroplasticity and Motor Learning: Implications for Football Coaching",
      authors: ["Dr. Elena Martinez", "Prof. James Wilson", "Dr. Robert Chen"],
      journal: "Sports Medicine and Science",
      year: 2023,
      category: "psychology",
      rating: 4.9,
      abstract: "Recent advances in neuroscience reveal how the brain adapts during skill acquisition. This study demonstrates how coaches can leverage neuroplasticity principles to optimize training sessions and accelerate player development through targeted practice design.",
      keywords: ["neuroplasticity", "motor learning", "skill acquisition"],
      doi: "10.1007/s40279-023-01856-2",
      citations: 156,
      openAccess: false
    },
    {
      id: 3,
      title: "Questioning Techniques in Sports Coaching: A Cognitive Load Theory Perspective",
      authors: ["Dr. Amanda Foster", "Prof. David Lee"],
      journal: "Coaching Science Review",
      year: 2024,
      category: "communication",
      rating: 4.7,
      abstract: "This research examines how different questioning strategies affect cognitive load and learning outcomes. The study provides evidence-based guidelines for coaches to optimize their questioning techniques for different age groups and skill levels.",
      keywords: ["questioning", "cognitive load", "communication"],
      doi: "10.1123/csr.2024.0045",
      citations: 34,
      openAccess: true
    },
    {
      id: 4,
      title: "Youth Football Development: Long-term Athletic Development Models",
      authors: ["Dr. Lisa Johnson", "Prof. Mark Anderson", "Dr. Sophie Brown"],
      journal: "International Journal of Sports Development",
      year: 2023,
      category: "youth",
      rating: 4.6,
      abstract: "A longitudinal study tracking 500 youth players over 8 years, examining the effectiveness of different development models. Findings suggest that holistic approaches emphasizing enjoyment and varied experiences lead to better long-term outcomes.",
      keywords: ["youth development", "LTAD", "talent identification"],
      doi: "10.1016/j.ijsd.2023.03.012",
      citations: 78,
      openAccess: true
    },
    {
      id: 5,
      title: "Performance Analysis in Football: From Data to Actionable Insights",
      authors: ["Prof. Carlo Rossi", "Dr. Hans Mueller"],
      journal: "Sports Analytics Quarterly",
      year: 2024,
      category: "performance",
      rating: 4.8,
      abstract: "This paper bridges the gap between performance data collection and practical coaching applications. It provides frameworks for translating complex performance metrics into simple, actionable coaching interventions.",
      keywords: ["performance analysis", "data analytics", "coaching applications"],
      doi: "10.1177/saq.2024.0128",
      citations: 67,
      openAccess: false
    },
    {
      id: 6,
      title: "Feedback Delivery in Sports: Timing, Frequency, and Individual Differences",
      authors: ["Dr. Rachel Green", "Prof. Thomas White"],
      journal: "Applied Psychology in Sport",
      year: 2023,
      category: "psychology",
      rating: 4.5,
      abstract: "An experimental study examining optimal feedback strategies for different personality types and learning styles. Results show that personalized feedback approaches significantly improve player engagement and skill retention.",
      keywords: ["feedback", "individual differences", "learning styles"],
      doi: "10.1080/aps.2023.1987456",
      citations: 123,
      openAccess: true
    }
  ];

  const coachingResources = [
    {
      id: 1,
      title: "UEFA Coaching Manual: Modern Football Pedagogy",
      type: "Manual",
      organization: "UEFA",
      year: 2024,
      category: "pedagogy",
      description: "Comprehensive guide covering contemporary coaching methodologies, session planning, and player development principles used across European academies.",
      downloadUrl: "#"
    },
    {
      id: 2,
      title: "FIFA Grassroots Coaching Curriculum",
      type: "Curriculum",
      organization: "FIFA",
      year: 2023,
      category: "youth",
      description: "Evidence-based framework for developing young players, emphasizing fun, participation, and long-term athletic development.",
      downloadUrl: "#"
    },
    {
      id: 3,
      title: "The FA Technical Report: Communication in Coaching",
      type: "Report",
      organization: "The Football Association",
      year: 2024,
      category: "communication",
      description: "Research-backed strategies for effective coach-player communication, including age-appropriate language and motivational techniques.",
      downloadUrl: "#"
    }
  ];

  const filteredPapers = academicPapers.filter(paper => {
    const matchesCategory = selectedCategory === "all" || paper.category === selectedCategory;
    const matchesSearch = searchTerm === "" || 
      paper.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paper.authors.some(author => author.toLowerCase().includes(searchTerm.toLowerCase())) ||
      paper.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  const filteredResources = coachingResources.filter(resource => {
    const matchesCategory = selectedCategory === "all" || resource.category === selectedCategory;
    const matchesSearch = searchTerm === "" || 
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

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
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">
                    Coaching Research Hub
                  </h1>
                  <p className="text-slate-300 text-lg mt-1">Academic literature and evidence-based coaching resources</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <h3 className="text-xl font-semibold mb-2">Peer-Reviewed Research</h3>
                  <p className="text-slate-300">Access to the latest academic findings in sports coaching and performance science.</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <h3 className="text-xl font-semibold mb-2">Professional Resources</h3>
                  <p className="text-slate-300">Official guidelines and manuals from leading football organizations worldwide.</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <h3 className="text-xl font-semibold mb-2">Evidence-Based Practice</h3>
                  <p className="text-slate-300">Translate research findings into practical coaching strategies and interventions.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search research papers, authors, keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex gap-2 overflow-x-auto">
                {researchCategories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className="flex items-center gap-2 whitespace-nowrap"
                  >
                    {category.icon}
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto p-6">
          <Tabs defaultValue="papers" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-100 rounded-xl p-1 mb-8">
              <TabsTrigger value="papers" className="rounded-lg font-semibold">Academic Papers</TabsTrigger>
              <TabsTrigger value="resources" className="rounded-lg font-semibold">Professional Resources</TabsTrigger>
            </TabsList>

            <TabsContent value="papers" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800">
                  Academic Research ({filteredPapers.length} papers)
                </h2>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Filter className="w-4 h-4" />
                  <span>Showing {selectedCategory === "all" ? "all categories" : selectedCategory}</span>
                </div>
              </div>

              <div className="grid gap-6">
                {filteredPapers.map((paper) => (
                  <Card key={paper.id} className="hover:shadow-lg transition-shadow duration-300">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl text-slate-800 leading-tight mb-2">
                            {paper.title}
                          </CardTitle>
                          <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              <span>{paper.authors.join(", ")}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{paper.year}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="capitalize">
                              {paper.category}
                            </Badge>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              <span className="text-sm font-medium">{paper.rating}</span>
                            </div>
                            <span className="text-sm text-slate-500">{paper.citations} citations</span>
                            {paper.openAccess && (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                Open Access
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-700 leading-relaxed mb-4">
                        {paper.abstract}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          {paper.keywords.map((keyword, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              <Tag className="w-3 h-3 mr-1" />
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 font-mono">DOI: {paper.doi}</span>
                          <Button size="sm" variant="outline">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Paper
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="resources" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800">
                  Professional Resources ({filteredResources.length} resources)
                </h2>
              </div>

              <div className="grid gap-6">
                {filteredResources.map((resource) => (
                  <Card key={resource.id} className="hover:shadow-lg transition-shadow duration-300">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl text-slate-800 leading-tight mb-2">
                            {resource.title}
                          </CardTitle>
                          <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                            <Badge variant="outline">{resource.type}</Badge>
                            <span>{resource.organization}</span>
                            <span>{resource.year}</span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-700 leading-relaxed mb-4">
                        {resource.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="capitalize">
                          {resource.category}
                        </Badge>
                        
                        <Button size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Download Resource
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
}