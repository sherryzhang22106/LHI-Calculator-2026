import React, { useEffect, useState } from 'react';
import { AssessmentResult } from '../types';
import { apiClient } from '../services/api/client';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface SharedResultScreenProps {
  assessmentId: string;
}

const SharedResultScreen: React.FC<SharedResultScreenProps> = ({ assessmentId }) => {
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSharedResult();
  }, [assessmentId]);

  const loadSharedResult = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getAssessment(assessmentId);
      
      // Convert backend format to AssessmentResult format
      const assessmentResult: AssessmentResult = {
        totalScore: data.totalScore,
        category: data.category,
        attachmentStyle: data.attachmentStyle,
        dimensions: data.dimensions,
        timestamp: new Date(data.createdAt).toLocaleDateString(),
        aiAnalysis: data.aiAnalysis,
        assessmentId: data.id,
      };

      setResult(assessmentResult);
    } catch (err) {
      setError('无法加载分享的结果，请检查链接是否正确');
      console.error('Failed to load shared result:', err);
    } finally {
      setLoading(false);
    }
  };

  const radarData = result?.dimensions.map(d => ({
    subject: d.name,
    A: d.tScore,
    fullMark: 80,
  })) || [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-pink-500 border-t-transparent mb-4"></div>
          <p className="text-slate-600 text-lg">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50 p-6">
        <div className="bg-white rounded-3xl shadow-xl p-12 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">😕</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">加载失败</h2>
          <p className="text-slate-600 mb-8">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-8 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-full font-bold hover:shadow-lg transition-all"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white pb-20 pt-12 px-4 sm:px-6 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-3xl shadow-xl p-8 mb-12 text-white text-center">
          <h1 className="text-3xl font-bold mb-2">朋友分享的恋爱健康指数报告</h1>
          <p className="text-pink-100">看看 TA 的恋爱健康状况</p>
        </div>

        {/* Main Score Section */}
        <div className="text-center mb-12 bg-white rounded-3xl shadow-lg p-10">
          <div className="w-20 h-20 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </div>

          <div className="text-[120px] leading-none font-bold bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent mb-6 tracking-tighter">
            {result.totalScore}
          </div>

          <div className={`py-3 px-10 rounded-xl inline-block text-xl font-bold shadow-md mb-8
            ${result.totalScore > 70 ? 'bg-green-500 text-white' : 
              result.totalScore > 50 ? 'bg-blue-500 text-white' :
              'bg-orange-500 text-white'}`}>
             {result.category === 'Fragile' && '脆弱的爱'}
             {result.category === 'Below Average' && '平均以下'}
             {result.category === 'Average' && '平均水平'}
             {result.category === 'Healthy' && '健康的爱'}
          </div>

          <p className="text-slate-600 text-lg">
            依恋风格：<span className="font-bold text-pink-600">{result.attachmentStyle}</span>
          </p>
        </div>

        {/* AI Analysis - Full Display */}
        {result.aiAnalysis && (
          <div className="mb-12 space-y-4">
            <h2 className="text-2xl font-bold text-slate-800 text-center mb-6">
              💡 AI 专业分析
            </h2>

            {/* Result Interpretation */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <h3 className="text-base font-bold text-pink-600 mb-2 flex items-center gap-2">
                <span>📊</span> 结果解释
              </h3>
              <div className="text-slate-600 text-sm leading-[1.7] space-y-1.5">
                {result.aiAnalysis.resultInterpretation.split('\n').map((para, i) => (
                  para.trim() && <p key={i}>{para.replace(/[#*-]/g, '').trim()}</p>
                ))}
              </div>
            </div>

            {/* Strengths */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 shadow-sm border border-green-100">
              <h3 className="text-base font-bold text-green-700 mb-2 flex items-center gap-2">
                <span>✨</span> 你的优势
              </h3>
              <div className="text-slate-600 text-sm leading-[1.7] space-y-1.5">
                {result.aiAnalysis.strengths.split('\n').map((para, i) => (
                  para.trim() && <p key={i}>{para.replace(/[#*-]/g, '').trim()}</p>
                ))}
              </div>
            </div>

            {/* Areas to Watch */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-5 shadow-sm border border-orange-100">
              <h3 className="text-base font-bold text-orange-700 mb-2 flex items-center gap-2">
                <span>⚠️</span> 需要注意的方面
              </h3>
              <div className="text-slate-600 text-sm leading-[1.7] space-y-1.5">
                {result.aiAnalysis.areasToWatch.split('\n').map((para, i) => (
                  para.trim() && <p key={i}>{para.replace(/[#*-]/g, '').trim()}</p>
                ))}
              </div>
            </div>

            {/* Personalized Advice */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-5 shadow-sm border border-blue-100">
              <h3 className="text-base font-bold text-blue-700 mb-2 flex items-center gap-2">
                <span>💝</span> 个性化建议
              </h3>
              <div className="text-slate-600 text-sm leading-[1.7] space-y-1.5">
                {result.aiAnalysis.personalizedAdvice.split('\n').map((para, i) => (
                  para.trim() && <p key={i}>{para.replace(/[#*-]/g, '').trim()}</p>
                ))}
              </div>
            </div>

            {/* Professional Advice */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 shadow-sm border border-purple-100">
              <h3 className="text-base font-bold text-purple-700 mb-2 flex items-center gap-2">
                <span>🎯</span> 专业建议
              </h3>
              <div className="text-slate-600 text-sm leading-[1.7] space-y-1.5">
                {result.aiAnalysis.professionalAdvice.split('\n').map((para, i) => (
                  para.trim() && <p key={i}>{para.replace(/[#*-]/g, '').trim()}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Dimension Radar */}
        <div className="bg-white rounded-2xl p-8 shadow-lg mb-12">
          <h3 className="text-center font-bold text-slate-700 mb-4 text-xl">健康维度分析</h3>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[20, 80]} tick={false} axisLine={false} />
                <Radar
                  name="健康指数"
                  dataKey="A"
                  stroke="#ec4899"
                  strokeWidth={3}
                  fill="#ec4899"
                  fillOpacity={0.4}
                />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}/>
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-3xl shadow-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">想了解你自己的恋爱健康指数吗？</h2>
          <p className="text-pink-100 text-lg mb-8 max-w-2xl mx-auto">
            通过心理学评估工具，结合 AI 智能分析，深入了解你的恋爱模式和改善方向
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-12 py-4 bg-white text-pink-600 rounded-full font-bold text-lg hover:shadow-2xl transition-all hover:-translate-y-1"
          >
            🚀 立即开始测评
          </button>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 pt-12">
          <p>LHI Calculator v2.0 • AI-Powered Analysis</p>
          <p className="mt-1">免责声明：本工具仅供参考，非专业诊断</p>
        </div>
      </div>
    </div>
  );
};

export default SharedResultScreen;
