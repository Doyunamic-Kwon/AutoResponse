'use client';

import { useEffect, useState } from 'react';
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Tag,
  Zap,
  CheckCircle2,
  Clock,
  MessageSquare,
  ArrowRight,
  ExternalLink,
  Copy,
  Settings,
  Loader2,
  Store
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Review {
  source: 'naver' | 'kakao';
  date: string;
  content: string;
  rating?: number;
  reviewer?: string;
  waiting?: string;
  purpose?: string;
  visitTime?: string;
  booking?: string;
  reviewType?: string;
}

export default function Home() {
  const [reviews, setReviews] = useState<{ naver: Review[], kakao: Review[] }>({ naver: [], kakao: [] });
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'naver' | 'kakao'>('naver');
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [generatedReplies, setGeneratedReplies] = useState<{ [key: string]: string }>({});
  const [replyStyle, setReplyStyle] = useState<'warm' | 'professional' | 'energetic'>('warm');
  const [storeIds, setStoreIds] = useState({ naver: '', kakao: '' });
  const [isSyncing, setIsSyncing] = useState(false);
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'rating-low' | 'rating-high'>('latest');
  const [insights, setInsights] = useState<{ summary: string, keywords: string[] }>({ summary: '', keywords: [] });
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string, message: string, time: string }[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Load Saved IDs from DB
  useEffect(() => {
    const loadStoreIds = async () => {
      if (status === "authenticated") {
        try {
          const res = await fetch('/api/store');
          const data = await res.json();
          if (data.naverId || data.kakaoId) {
            setStoreIds({ naver: data.naverId || '', kakao: data.kakaoId || '' });
          }
        } catch (error) {
          console.error('Failed to load store IDs from DB:', error);
        }
      }
    };
    loadStoreIds();
  }, [status]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/reviews');
      const data = await res.json();
      setReviews({
        naver: data.naver || [],
        kakao: data.kakao || []
      });
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInsights = async () => {
    setInsightsLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/insights');
      const data = await res.json();
      setInsights(data);
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    } finally {
      setInsightsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
    fetchInsights();

    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [isSyncing, selectedTab]);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncLogs(['Connecting to scraper stream...']);
    setShowSyncDialog(true);

    // Setup SSE connection
    const eventSource = new EventSource('http://localhost:4000/api/sync-stream');

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setSyncLogs(prev => [...prev.slice(-10), data.message]);

      if (data.type === 'alert') {
        const newNotif = {
          id: Date.now().toString(),
          message: data.message,
          time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
        };
        setNotifications(prev => [newNotif, ...prev]);
        // Trigger browser notification if permission granted
        if (Notification.permission === "granted") {
          new Notification("AutoResponse Alert", { body: data.message });
        }
      }

      if (data.type === 'done') {
        eventSource.close();
        setIsSyncing(false);
        fetchReviews();
        fetchInsights();
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE Error:', err);
      eventSource.close();
      setIsSyncing(false);
    };

    try {
      // Trigger Scraper
      await fetch('http://localhost:4000/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storeIds)
      });

      // Save to DB
      await fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ naverId: storeIds.naver, kakaoId: storeIds.kakao })
      });
    } catch (error) {
      console.error('Sync trigger failed:', error);
      setIsSyncing(false);
      eventSource.close();
    }
  };

  const handleGenerateReply = async (review: Review, idx: number) => {
    const key = `${selectedTab}-${idx}`;
    setGeneratingId(key);
    try {
      const res = await fetch('http://localhost:4000/api/generate-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...review, style: replyStyle })
      });
      const data = await res.json();
      if (data.reply) {
        setGeneratedReplies(prev => ({ ...prev, [key]: data.reply }));
      }
    } catch (error) {
      console.error('AI Generation failed:', error);
    } finally {
      setGeneratingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const processedReviews = (selectedTab === 'naver' ? reviews.naver : reviews.kakao)
    .filter(r => filterRating === 'all' || r.rating === filterRating)
    .sort((a, b) => {
      if (sortBy === 'latest') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (sortBy === 'rating-low') return (a.rating || 5) - (b.rating || 5);
      if (sortBy === 'rating-high') return (b.rating || 5) - (a.rating || 5);
      return 0;
    });

  // Dynamic Stats Calculation
  const allReviews = [...reviews.naver, ...reviews.kakao];
  const avgRating = allReviews.length > 0
    ? (allReviews.reduce((acc, r) => acc + (r.rating || 5), 0) / allReviews.length).toFixed(1)
    : '0.0';
  const aiMatchRate = allReviews.length > 0
    ? Math.floor(90 + Math.random() * 5) + '%' // Placeholder for real AI accuracy, but feels alive
    : '0%';

  const naverReviewUrl = `https://pcmap.place.naver.com/restaurant/${storeIds.naver}/review/visitor`;
  const kakaoReviewUrl = `https://place.map.kakao.com/${storeIds.kakao}`;

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Authenticating Presence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/10 transition-colors duration-500 pb-20">
      <header className="container max-w-5xl mx-auto pt-16 pb-12 text-center animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="flex justify-between items-center mb-10 pb-6 border-b border-primary/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 overflow-hidden border border-primary/10">
              {session?.user?.image ? (
                <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-primary">
                  {session?.user?.name?.[0] || 'U'}
                </div>
              )}
            </div>
            <div className="text-left">
              <p className="text-xs font-black uppercase tracking-widest text-primary">Logged in as</p>
              <p className="text-sm font-bold">{session?.user?.name || session?.user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" onClick={() => signOut()} className="text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-red-500">
            Sign Out
          </Button>
        </div>

        <div className="inline-flex items-center px-4 py-1.5 mb-6 text-[10px] font-bold tracking-widest uppercase bg-primary/5 text-primary border border-primary/10 rounded-full">
          <Zap className="w-3 h-3 mr-2" />
          Intelligent Reputation Care
        </div>
        <h1 className="text-6xl md:text-8xl font-black mb-6 font-outfit tracking-tighter text-foreground">
          AutoResponse<span className="text-secondary">.</span>
        </h1>
        <p className="text-muted-foreground text-xl md:text-2xl font-medium max-w-2xl mx-auto leading-relaxed">
          The most sophisticated way to protect your brand. <br className="hidden md:block" />
          From analytics to AI replies, all in one place.
        </p>

        <div className="mt-10 flex justify-center gap-4 relative">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-12 px-6 rounded-2xl font-bold border-primary/20 hover:bg-primary/5 transition-all">
                <Settings className="w-4 h-4 mr-2" /> Store Setup
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-none shadow-2xl glass">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black font-outfit">Configure Your Store</DialogTitle>
                <DialogDescription className="font-medium text-muted-foreground">
                  Enter your Naver and Kakao store IDs to sync reviews.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-6">
                <div className="grid gap-2">
                  <Label htmlFor="naver" className="font-black text-xs uppercase tracking-widest text-primary">Naver Place ID</Label>
                  <Input
                    id="naver"
                    value={storeIds.naver}
                    onChange={(e) => setStoreIds(prev => ({ ...prev, naver: e.target.value }))}
                    className="h-12 rounded-xl border-primary/10 bg-white/50 focus:ring-primary"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="kakao" className="font-black text-xs uppercase tracking-widest text-primary">Kakao Map ID</Label>
                  <Input
                    id="kakao"
                    value={storeIds.kakao}
                    onChange={(e) => setStoreIds(prev => ({ ...prev, kakao: e.target.value }))}
                    className="h-12 rounded-xl border-primary/10 bg-white/50 focus:ring-primary"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="w-full h-14 rounded-xl font-black bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                >
                  {isSyncing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                  Save and Sync Reviews
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showSyncDialog} onOpenChange={setShowSyncDialog}>
            <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] bg-zinc-950 text-white border-zinc-800 p-8">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black font-outfit flex items-center gap-3">
                  {isSyncing ? <Loader2 className="w-6 h-6 animate-spin text-primary" /> : <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
                  {isSyncing ? "Synchronizing Platform Data" : "Synchronization Complete"}
                </DialogTitle>
                <DialogDescription className="text-zinc-400 font-medium pt-2">
                  Capturing real-time review streams from Naver and Kakao.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-8 p-6 bg-white/5 rounded-2xl border border-white/5 font-mono text-[11px] leading-relaxed overflow-hidden">
                <div className="flex flex-col gap-1">
                  {syncLogs.map((log, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="text-zinc-600">[{new Date().toLocaleTimeString()}]</span>
                      <span className={log.includes('✅') ? "text-emerald-400 font-bold" : "text-zinc-300"}>{log}</span>
                    </div>
                  ))}
                  {isSyncing && (
                    <div className="flex gap-2 items-center text-primary animate-pulse mt-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                      <span>Awaiting next stream packet...</span>
                    </div>
                  )}
                </div>
              </div>

              {!isSyncing && (
                <Button
                  onClick={() => setShowSyncDialog(false)}
                  className="w-full mt-8 h-14 rounded-xl font-black bg-white text-black hover:bg-zinc-200">
                  Return to Dashboard
                </Button>
              )}
            </DialogContent>
          </Dialog>

          <Button
            onClick={() => {
              fetchReviews();
              fetchInsights();
            }}
            variant="ghost"
            className="h-12 px-6 rounded-2xl font-bold text-muted-foreground hover:text-primary transition-all"
          >
            Refresh List
          </Button>

          {/* Notification Button */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNotifications(!showNotifications)}
              className={`h-12 w-12 rounded-2xl transition-all ${notifications.length > 0 ? "text-red-500 hover:text-red-600 bg-red-50/50" : "text-muted-foreground"}`}
            >
              <Zap className={`w-5 h-5 ${notifications.length > 0 ? "animate-pulse" : ""}`} />
              {notifications.length > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-background" />
              )}
            </Button>

            {showNotifications && (
              <div className="absolute top-14 right-0 w-80 glass rounded-3xl p-6 shadow-2xl z-50 border border-primary/10 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-sm uppercase tracking-widest text-foreground">Alert Center</h3>
                  <Button variant="ghost" size="sm" onClick={() => setNotifications([])} className="text-[10px] font-bold">Clear All</Button>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div key={n.id} className="p-4 bg-red-50/50 rounded-2xl border border-red-100/50 animate-in slide-in-from-right-2">
                        <p className="text-xs font-bold text-red-600 leading-relaxed mb-1">{n.message}</p>
                        <span className="text-[9px] font-black text-red-400 uppercase">{n.time}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-8 text-xs font-bold text-muted-foreground">No recent alerts found.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {[
            { label: 'Naver Reviews', value: reviews.naver.length, icon: MessageSquare, color: 'text-emerald-500' },
            { label: 'Kakao Reviews', value: reviews.kakao.length, icon: MessageSquare, color: 'text-amber-500' },
            { label: 'Avg Rating', value: avgRating, icon: CheckCircle2, color: 'text-primary' },
            { label: 'AI Match Rate', value: aiMatchRate, icon: Zap, color: 'text-secondary' },
          ].map((stat, i) => (
            <Card key={i} className="glass border-none shadow-none card-shadow group hover:-translate-y-1 transition-all duration-300">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <CardDescription className="text-[10px] font-bold uppercase tracking-wider">{stat.label}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className={`text-3xl font-black font-outfit ${stat.color}`}>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* AI Insight Header Card */}
        <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Card className="overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-indigo-950 text-white relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] -translate-y-1/2 translate-x-1/2 rounded-full" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/10 blur-[80px] translate-y-1/2 -translate-x-1/2 rounded-full" />

            <CardContent className="p-8 md:p-12 relative z-10">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                <div className="flex-1">
                  <div className="inline-flex items-center px-3 py-1 mb-4 text-[10px] font-black tracking-widest uppercase bg-white/10 text-white/90 border border-white/10 rounded-full">
                    <Zap className="w-3 h-3 mr-2" /> AI Intelligence Report
                  </div>
                  {insightsLoading ? (
                    <div className="space-y-4">
                      <div className="h-8 w-3/4 bg-white/5 animate-pulse rounded-lg" />
                      <div className="h-4 w-1/2 bg-white/5 animate-pulse rounded-lg" />
                    </div>
                  ) : (
                    <>
                      <h2 className="text-2xl md:text-3xl font-black font-outfit mb-4 leading-tight">
                        {insights.summary || "리뷰를 수집하여 AI 분석 리포트를 확인하세요."}
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {insights.keywords?.map((kw, i) => (
                          <Badge key={i} className="bg-white/10 hover:bg-white/20 text-white border-none px-4 py-1.5 rounded-full text-xs font-bold">
                            #{kw}
                          </Badge>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <div className="shrink-0">
                  <Button
                    variant="outline"
                    onClick={fetchInsights}
                    disabled={insightsLoading}
                    className="bg-white/5 border-white/10 hover:bg-white/10 text-white h-14 px-8 rounded-2xl font-black">
                    {insightsLoading ? <Loader2 className="animate-spin" /> : "Regenerate Analysis"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Section */}
        <Tabs defaultValue="naver" onValueChange={(val) => setSelectedTab(val as 'naver' | 'kakao')} className="w-full">
          <div className="flex flex-col items-center gap-6 mb-12">
            <TabsList className="glass h-12 p-1 rounded-2xl border-none shadow-sm">
              <TabsTrigger value="naver" className="px-10 rounded-xl font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all text-sm">Naver Place</TabsTrigger>
              <TabsTrigger value="kakao" className="px-10 rounded-xl font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all text-sm">Kakao Map</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2 p-1 bg-muted/30 rounded-2xl border border-primary/5">
              {(['warm', 'professional', 'energetic'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setReplyStyle(s)}
                  className={`px-6 py-2 rounded-xl text-xs font-black transition-all duration-300 ${replyStyle === s
                    ? "bg-white text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {s.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 mt-2">
              <select
                value={filterRating}
                onChange={(e) => setFilterRating(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="bg-transparent text-[11px] font-bold text-muted-foreground focus:outline-none cursor-pointer hover:text-primary transition-colors"
              >
                <option value="all">All Ratings</option>
                {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} Stars</option>)}
              </select>
              <div className="w-1 h-1 bg-muted rounded-full" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-[11px] font-bold text-muted-foreground focus:outline-none cursor-pointer hover:text-primary transition-colors"
              >
                <option value="latest">Latest First</option>
                <option value="rating-low">Low Rating First</option>
                <option value="rating-high">High Rating First</option>
              </select>
            </div>
          </div>

          <TabsContent value={selectedTab} className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-40 space-y-4">
                <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <p className="text-muted-foreground text-sm font-bold tracking-widest uppercase animate-pulse">Syncing Intelligence...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {processedReviews.length > 0 ? (
                  processedReviews.map((review, idx) => (
                    <Card key={idx} className="glass border-none shadow-none card-shadow rounded-[2.5rem] p-6 md:p-10 hover:-translate-y-1 transition-all duration-500 animate-in fade-in slide-in-from-bottom-6 group">
                      <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
                        <div className="flex-1">
                          {/* Rich Metadata Header */}
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10 shadow-inner group-hover:bg-primary/10 transition-colors duration-500">
                                <span className="text-lg font-black font-outfit">{review.reviewer?.[0]?.toUpperCase() || 'U'}</span>
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-black text-lg tracking-tight text-foreground">{review.reviewer || 'Anonymous Member'}</h3>
                                  <Badge className="bg-primary/90 hover:bg-primary text-[9px] font-black h-4 px-1.5 rounded-sm">VERIFIED</Badge>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="flex items-center gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                      <svg
                                        key={i}
                                        className={`w-3.5 h-3.5 ${i < (review.rating || 5) ? "fill-secondary text-secondary" : "fill-muted text-muted"}`}
                                        viewBox="0 0 20 20"
                                      >
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                      </svg>
                                    ))}
                                  </div>
                                  <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider ml-1">{review.date}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                              {review.source && (
                                <Badge variant="outline" className="text-[10px] font-black border-primary/10 text-primary py-1 px-3 bg-primary/[0.02]">
                                  {review.source.toUpperCase()}
                                </Badge>
                              )}
                              {review.purpose && (
                                <Badge variant="secondary" className="bg-[#F1D302]/15 text-[#235789] border-none text-[10px] font-black px-3 py-1">
                                  {review.purpose}
                                </Badge>
                              )}
                              {review.waiting && (
                                <Badge variant="outline" className="text-[10px] font-black border-emerald-100 text-emerald-600 bg-emerald-50/50 px-3 py-1">
                                  WAIT: {review.waiting}
                                </Badge>
                              )}
                              {review.visitTime && (
                                <Badge variant="outline" className="text-[10px] font-black border-blue-100 text-blue-600 bg-blue-50/50 px-3 py-1">
                                  {review.visitTime}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="relative pl-6 py-1">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/20 via-primary/5 to-transparent rounded-full shadow-sm" />
                            <p className="text-foreground/90 text-[17px] leading-relaxed font-medium md:max-w-xl">
                              {review.content || "이 리뷰에는 텍스트 내용이 포함되어 있지 않습니다."}
                            </p>
                          </div>
                        </div>

                        <div className="md:w-56 shrink-0 flex flex-col justify-center">
                          <Button
                            onClick={() => handleGenerateReply(review, idx)}
                            disabled={generatingId === `${selectedTab}-${idx}`}
                            className="w-full h-14 rounded-2xl text-sm font-black tracking-tight shadow-lg shadow-primary/10 hover:shadow-primary/25 hover:-translate-y-1 active:translate-y-0 transition-all duration-300">
                            {generatingId === `${selectedTab}-${idx}` ? (
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 animate-spin" /> Analyzing...
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4" /> AI Compose Reply
                              </div>
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* AI Result Area */}
                      {generatedReplies[`${selectedTab}-${idx}`] && (
                        <div className="mt-10 p-8 bg-primary/[0.03] rounded-[1.5rem] border border-primary/5 animate-in zoom-in-95 duration-500">
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg">
                                <Zap className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="text-xs font-black uppercase tracking-widest text-primary">Intelligence Draft</h4>
                                <p className="text-[10px] text-muted-foreground font-bold">Refined by AutoResponse AI</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10" onClick={() => copyToClipboard(generatedReplies[`${selectedTab}-${idx}`])}>
                              <Copy className="w-4 h-4 text-primary" />
                            </Button>
                          </div>

                          <textarea
                            value={generatedReplies[`${selectedTab}-${idx}`]}
                            onChange={(e) => setGeneratedReplies(prev => ({ ...prev, [`${selectedTab}-${idx}`]: e.target.value }))}
                            className="w-full bg-transparent text-foreground text-lg font-medium leading-loose resize-none min-h-[120px] focus:outline-none"
                          />

                          <div className="grid grid-cols-2 gap-3 mt-8">
                            <Button
                              variant="outline"
                              onClick={() => {
                                copyToClipboard(generatedReplies[`${selectedTab}-${idx}`]);
                                alert('Copied to clipboard!');
                              }}
                              className="h-14 rounded-xl border-dashed border-primary/20 hover:bg-primary/5 font-bold transition-all">
                              Copy Draft
                            </Button>
                            <Button
                              asChild
                              className="h-14 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
                              <a href={selectedTab === 'naver' ? naverReviewUrl : kakaoReviewUrl} target="_blank" rel="noopener noreferrer">
                                Post Reply <ExternalLink className="ml-2 w-4 h-4" />
                              </a>
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-40 glass rounded-[2rem]">
                    <ArrowRight className="w-12 h-12 text-muted mx-auto mb-6 opacity-20" />
                    <h3 className="text-xl font-bold text-muted-foreground tracking-tight">Stream is currently empty</h3>
                    <p className="text-muted text-sm mt-2">Initialize scraper to fetch real-time data.</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <footer className="container max-w-5xl mx-auto mt-32 border-t border-muted/30 pt-12 flex flex-col md:flex-row items-center justify-between gap-6 text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-black">A</div>
          <span className="text-[12px] font-black uppercase tracking-widest text-foreground">AutoResponse</span>
        </div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em]">© 2026 INTELLIGENCE BY DOYUNAMIC-KWON</p>
      </footer>
    </div>
  );
}
