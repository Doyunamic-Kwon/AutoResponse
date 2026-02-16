'use client';

import { useEffect, useState } from 'react';

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

// Custom SVG Icons
const Icons = {
  Date: () => (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
  ),
  User: () => (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
  ),
  Tag: () => (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
  ),
  AI: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
  )
};

export default function Home() {
  const [reviews, setReviews] = useState<{ naver: Review[], kakao: Review[] }>({ naver: [], kakao: [] });
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'naver' | 'kakao'>('naver');
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [generatedReplies, setGeneratedReplies] = useState<{ [key: string]: string }>({});

  const naverReviewUrl = "https://pcmap.place.naver.com/restaurant/34016603/review/visitor";
  const kakaoReviewUrl = "https://place.map.kakao.com/26338954";

  useEffect(() => {
    async function fetchReviews() {
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
    }
    fetchReviews();
  }, []);

  const handleGenerateReply = async (review: Review, idx: number) => {
    const key = `${selectedTab}-${idx}`;
    setGeneratingId(key);
    try {
      const res = await fetch('http://localhost:4000/api/generate-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(review)
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

  const currentReviews = selectedTab === 'naver' ? reviews.naver : reviews.kakao;

  return (
    <div className="min-h-screen p-4 md:p-12 transition-colors duration-500">
      <header className="max-w-5xl mx-auto mb-16 text-center">
        <div className="inline-block px-4 py-1.5 mb-4 text-[11px] font-bold tracking-widest uppercase bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full">
          Intelligent Reputation Care
        </div>
        <h1 className="text-5xl md:text-7xl font-bold mb-6 accent-font tracking-tight text-slate-800 dark:text-slate-100">
          AutoResponse<span className="text-indigo-500">.</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
          사장님의 소중한 브랜드를 지키는 가장 섬세한 방법. <br className="hidden md:block" />
          리뷰 분석부터 AI 맞춤 답글까지 한 번에 관리하세요.
        </p>
      </header>

      <main className="max-w-5xl mx-auto">
        {/* Statistics Board */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { label: '네이버 리뷰', value: reviews.naver.length, color: 'text-emerald-600' },
            { label: '카카오 리뷰', value: reviews.kakao.length, color: 'text-amber-500' },
            { label: '평균 평점', value: '4.8', color: 'text-rose-500' },
            { label: 'AI 응답률', value: '92%', color: 'text-indigo-500' },
          ].map((stat, i) => (
            <div key={i} className="glass p-6 rounded-3xl card-shadow transition-transform hover:scale-[1.02]">
              <h3 className="text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-2">{stat.label}</h3>
              <p className={`text-2xl md:text-3xl font-black font-outfit ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-10">
          <div className="glass p-1.5 rounded-2xl flex space-x-1 shadow-sm">
            {[
              { id: 'naver', label: 'Naver Place', activeColor: 'bg-emerald-500 text-white' },
              { id: 'kakao', label: 'Kakao Map', activeColor: 'bg-amber-500 text-white' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${selectedTab === tab.id
                  ? `${tab.activeColor} shadow-lg shadow-indigo-500/10`
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Review Stream */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-slate-400 font-medium animate-pulse">리뷰 데이터를 정제하고 있습니다...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {currentReviews.length > 0 ? (
              currentReviews.map((review, idx) => (
                <div key={idx} className="glass p-8 rounded-[2.5rem] card-shadow group transition-all duration-500 hover:border-indigo-200 dark:hover:border-indigo-800 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[80px] -z-10 group-hover:bg-indigo-500/10 transition-all"></div>

                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="flex-1">
                      {/* Meta Information Badges */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="flex items-center space-x-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold rounded-full uppercase tracking-tighter">
                          <Icons.Tag />
                          <span>{review.source}</span>
                        </span>
                        <span className="flex items-center space-x-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded-full">
                          <Icons.Date />
                          <span>{review.date}</span>
                        </span>
                        {review.visitTime && <span className="px-3 py-1 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-[10px] font-bold rounded-full">{review.visitTime}</span>}
                        {review.booking && <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded-full">{review.booking}</span>}
                        {review.waiting && <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-full">대기: {review.waiting}</span>}
                        {review.purpose && <span className="px-3 py-1 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[10px] font-bold rounded-full">{review.purpose}</span>}
                      </div>

                      <div className="mb-4">
                        {review.reviewer && (
                          <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-100 mb-1">
                            <span className="text-sm font-black">{review.reviewer}</span>
                            <span className="text-[10px] text-slate-400">Verfied Visitor</span>
                          </div>
                        )}
                        {review.rating && (
                          <div className="flex space-x-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span key={i} className={`text-sm ${i < (review.rating || 0) ? 'text-amber-400' : 'text-slate-200 dark:text-slate-800'}`}>★</span>
                            ))}
                          </div>
                        )}
                      </div>

                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg font-medium pr-0 md:pr-12">
                        {review.content || "키워드 리뷰만 남겨주셨습니다."}
                      </p>
                    </div>

                    <div className="md:w-48 shrink-0">
                      <button
                        onClick={() => handleGenerateReply(review, idx)}
                        disabled={generatingId === `${selectedTab}-${idx}`}
                        className={`w-full py-4 rounded-2xl text-sm font-black transition-all duration-500 flex items-center justify-center space-x-2 shadow-sm
                          ${generatingId === `${selectedTab}-${idx}`
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-indigo-500/25 hover:-translate-y-1'
                          }`}
                      >
                        {generatingId === `${selectedTab}-${idx}` ? (
                          <span className="flex items-center space-x-2">
                            <span className="w-4 h-4 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin"></span>
                            <span>작성 중</span>
                          </span>
                        ) : (
                          <>
                            <Icons.AI />
                            <span>AI 맞춤 작성</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Enhanced AI Recommendation Area */}
                  {generatedReplies[`${selectedTab}-${idx}`] && (
                    <div className="mt-8 p-8 bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-100/50 dark:border-indigo-900/50 rounded-[2rem] animate-in fade-in slide-in-from-top-4 duration-700">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                            <Icons.AI />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Assistant Draft</h4>
                            <p className="text-[10px] text-slate-400">문맥을 고려한 사장님 전용 답글입니다.</p>
                          </div>
                        </div>
                      </div>

                      <textarea
                        value={generatedReplies[`${selectedTab}-${idx}`]}
                        onChange={(e) => setGeneratedReplies(prev => ({ ...prev, [`${selectedTab}-${idx}`]: e.target.value }))}
                        className="w-full bg-transparent text-slate-700 dark:text-slate-200 border-none focus:ring-0 p-0 mb-8 resize-none min-h-[140px] text-lg font-medium leading-relaxed leading-extra-loose"
                      />

                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={() => {
                            copyToClipboard(generatedReplies[`${selectedTab}-${idx}`]);
                            alert('답글이 클립보드에 복사되었습니다! ✨');
                          }}
                          className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-4 rounded-2xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95"
                        >
                          완성본 복사하기
                        </button>
                        <a
                          href={selectedTab === 'naver' ? naverReviewUrl : kakaoReviewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 text-center active:scale-95"
                        >
                          붙여넣으러 가기
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-32 glass rounded-[2.5rem]">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Icons.Tag />
                </div>
                <h3 className="text-xl font-bold text-slate-400 mb-2">아직 수집된 리뷰가 없습니다</h3>
                <p className="text-slate-400 text-sm">스크래퍼를 실행하여 실시간 리뷰를 가져오세요.</p>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="max-w-5xl mx-auto mt-24 pb-12 text-center text-slate-400 text-xs font-medium tracking-widest uppercase">
        © 2026 AutoResponse. Developed with Care.
      </footer>
    </div>
  );
}
