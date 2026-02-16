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
      } else if (data.error) {
        alert(data.error);
      }
    } catch (error) {
      console.error('AI Generation failed:', error);
      alert('AI 답글 생성에 실패했습니다.');
    } finally {
      setGeneratingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('답글이 클립보드에 복사되었습니다!');
  };

  const currentReviews = selectedTab === 'naver' ? reviews.naver : reviews.kakao;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-8 font-sans">
      <header className="max-w-6xl mx-auto mb-10">
        <h1 className="text-4xl font-extrabold text-blue-600 dark:text-blue-400 mb-2 font-outfit">AutoResponse</h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">사장님의 디지털 평판 보험. 실시간 리뷰 관리 플랫폼</p>
      </header>

      <main className="max-w-6xl mx-auto">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-gray-500 text-sm font-medium mb-1">네이버 리뷰</h3>
            <p className="text-3xl font-bold">{reviews.naver.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-gray-500 text-sm font-medium mb-1">카카오 리뷰</h3>
            <p className="text-3xl font-bold">{reviews.kakao.length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6 bg-gray-200/50 dark:bg-gray-800/50 p-1 rounded-xl w-fit">
          <button
            onClick={() => setSelectedTab('naver')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${selectedTab === 'naver'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Naver
          </button>
          <button
            onClick={() => setSelectedTab('kakao')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${selectedTab === 'kakao'
              ? 'bg-white dark:bg-gray-700 text-yellow-600 dark:text-yellow-400 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Kakao
          </button>
        </div>

        {/* Review List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {currentReviews.length > 0 ? (
              currentReviews.map((review, idx) => (
                <div key={idx} className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 text-[10px] font-black rounded uppercase tracking-tighter">{review.source}</span>
                        <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 text-[10px] font-bold rounded">{review.date}</span>
                        {review.visitTime && <span className="px-2 py-1 bg-orange-50 dark:bg-orange-900/40 text-orange-600 dark:text-orange-300 text-[10px] font-bold rounded">{review.visitTime}</span>}
                        {review.booking && <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 text-[10px] font-bold rounded">{review.booking}</span>}
                        {review.waiting && <span className="px-2 py-1 bg-green-50 dark:bg-green-900/40 text-green-600 dark:text-green-300 text-[10px] font-bold rounded">대기: {review.waiting}</span>}
                        {review.purpose && <span className="px-2 py-1 bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 text-[10px] font-bold rounded">{review.purpose}</span>}
                        {review.reviewType && <span className="px-2 py-1 bg-pink-50 dark:bg-pink-900/40 text-pink-600 dark:text-pink-300 text-[10px] font-bold rounded">{review.reviewType}</span>}
                      </div>
                      {review.reviewer && <span className="text-sm font-bold block">{review.reviewer}</span>}
                      {review.rating && (
                        <div className="flex text-yellow-400">
                          {Array.from({ length: review.rating }).map((_, i) => (
                            <span key={i}>★</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleGenerateReply(review, idx)}
                      disabled={generatingId === `${selectedTab}-${idx}`}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:bg-blue-300"
                    >
                      {generatingId === `${selectedTab}-${idx}` ? '생성 중...' : 'AI 답글 생성'}
                    </button>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                    {review.content}
                  </p>

                  {/* AI Reply Area */}
                  {generatedReplies[`${selectedTab}-${idx}`] && (
                    <div className="mt-6 p-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center space-x-2 mb-3">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded uppercase tracking-wider">AI Recommendation</span>
                      </div>
                      <textarea
                        value={generatedReplies[`${selectedTab}-${idx}`]}
                        onChange={(e) => setGeneratedReplies(prev => ({ ...prev, [`${selectedTab}-${idx}`]: e.target.value }))}
                        className="w-full bg-transparent text-gray-800 dark:text-gray-200 border-none focus:ring-0 p-0 mb-4 resize-none min-h-[100px]"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => copyToClipboard(generatedReplies[`${selectedTab}-${idx}`])}
                          className="flex-1 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 py-2 rounded-lg text-sm font-bold hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                        >
                          복사하기
                        </button>
                        <a
                          href={selectedTab === 'naver' ? naverReviewUrl : kakaoReviewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm text-center"
                        >
                          리뷰 페이지 이동
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-20 text-gray-500">
                리뷰가 없습니다. 스크래퍼를 실행해주세요.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
