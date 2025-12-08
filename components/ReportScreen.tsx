import React, { useEffect, useState } from 'react';
import { AssessmentResult } from '../types';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface ReportScreenProps {
  result: AssessmentResult;
}

const ReportScreen: React.FC<ReportScreenProps> = ({ result }) => {
  const [mounted, setMounted] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
    window.scrollTo(0, 0);
    console.log('Report result:', result);
    console.log('AI Analysis:', result.aiAnalysis);
  }, []);

  // Format AI text: remove markdown symbols and clean up formatting
  const formatAIText = (text: string) => {
    if (!text) return '';
    return text
      .replace(/###\s*/g, '') // Remove ### headers
      .replace(/\*\*(.+?)\*\*/g, '$1') // Remove **bold**
      .replace(/---+/g, '') // Remove horizontal lines
      .replace(/^\s*[-*]\s+/gm, '• ') // Convert - or * to bullet points
      .replace(/\n{3,}/g, '\n\n') // Max 2 line breaks
      .trim();
  };

  const radarData = result.dimensions.map(d => ({
    subject: d.name,
    A: d.tScore,
    fullMark: 80,
  }));

  const handleShare = () => {
    if (result.assessmentId) {
      const url = `${window.location.origin}/share/${result.assessmentId}`;
      setShareUrl(url);
      setShowShareModal(true);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white pb-20 pt-12 px-4 sm:px-6 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Main Score Section */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </div>

          <h1 className="text-4xl font-bold text-pink-600 mb-3 tracking-tight">
            恋爱健康指数报告
          </h1>

          <div className="text-[140px] leading-none font-bold bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent mb-6 tracking-tighter">
            {result.totalScore}
          </div>

          <div className="mb-8">
            <div className={`py-3 px-10 rounded-xl inline-block text-xl font-bold shadow-md
              ${result.totalScore > 70 ? 'bg-green-500 text-white' : 
                result.totalScore > 50 ? 'bg-blue-500 text-white' :
                'bg-orange-500 text-white'}`}>
               {result.category === 'Fragile' && '脆弱的爱 (建议咨询)'}
               {result.category === 'Below Average' && '平均以下 (潜在问题)'}
               {result.category === 'Average' && '平均水平 (平衡发展)'}
               {result.category === 'Healthy' && '健康的爱 (安全稳定)'}
            </div>
          </div>

          <div className="max-w-xl mx-auto mb-12">
            <div className="h-4 bg-slate-100 rounded-full w-full relative overflow-hidden shadow-inner">
               <div 
                 className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out
                   ${result.totalScore > 70 ? 'bg-gradient-to-r from-green-400 to-green-500' : 
                     result.totalScore > 50 ? 'bg-gradient-to-r from-blue-400 to-blue-500' : 
                     'bg-gradient-to-r from-orange-400 to-pink-500'}
                 `}
                 style={{ width: `${result.totalScore}%` }}
               />
            </div>
            <div className="flex justify-between mt-3 text-xs text-slate-500 font-medium">
              <span>0</span>
              <span>50</span>
              <span>100</span>
            </div>
          </div>
        </div>

        {/* AI Analysis Section */}
        {result.aiAnalysis && (
          <div className="mb-12 space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 text-center mb-8">
              💡 AI 专业分析
            </h2>

            {/* Result Interpretation */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-pink-600 mb-3 flex items-center gap-2">
                <span>📊</span> 结果解释
              </h3>
              <div className="text-slate-600 text-[15px] leading-[1.8] space-y-2">
                {formatAIText(result.aiAnalysis.resultInterpretation).split('\n').map((para, i) => (
                  para.trim() && <p key={i}>{para}</p>
                ))}
              </div>
            </div>

            {/* Strengths */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 shadow-sm border border-green-100">
              <h3 className="text-lg font-bold text-green-700 mb-3 flex items-center gap-2">
                <span>✨</span> 你的优势
              </h3>
              <div className="text-slate-600 text-[15px] leading-[1.8] space-y-2">
                {formatAIText(result.aiAnalysis.strengths).split('\n').map((para, i) => (
                  para.trim() && <p key={i}>{para}</p>
                ))}
              </div>
            </div>

            {/* Areas to Watch */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 shadow-sm border border-orange-100">
              <h3 className="text-lg font-bold text-orange-700 mb-3 flex items-center gap-2">
                <span>⚠️</span> 需要注意的方面
              </h3>
              <div className="text-slate-600 text-[15px] leading-[1.8] space-y-2">
                {formatAIText(result.aiAnalysis.areasToWatch).split('\n').map((para, i) => (
                  para.trim() && <p key={i}>{para}</p>
                ))}
              </div>
            </div>

            {/* Personalized Advice */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 shadow-sm border border-blue-100">
              <h3 className="text-lg font-bold text-blue-700 mb-3 flex items-center gap-2">
                <span>💝</span> 个性化建议
              </h3>
              <div className="text-slate-600 text-[15px] leading-[1.8] space-y-2">
                {formatAIText(result.aiAnalysis.personalizedAdvice).split('\n').map((para, i) => (
                  para.trim() && <p key={i}>{para}</p>
                ))}
              </div>
            </div>

            {/* Professional Advice */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 shadow-sm border border-purple-100">
              <h3 className="text-lg font-bold text-purple-700 mb-3 flex items-center gap-2">
                <span>🎯</span> 专业建议
              </h3>
              <div className="text-slate-600 text-[15px] leading-[1.8] space-y-2">
                {formatAIText(result.aiAnalysis.professionalAdvice).split('\n').map((para, i) => (
                  para.trim() && <p key={i}>{para}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="h-px bg-slate-200 w-full mb-12"></div>

        {/* Technical Details Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          
          {/* Radar Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
            <h3 className="text-center font-bold text-slate-700 mb-2">健康维度雷达图</h3>
            <p className="text-center text-xs text-slate-400 mb-4">面积越大代表关系越健康</p>
            <div className="w-full h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[20, 80]} tick={false} axisLine={false} />
                  <Radar
                    name="健康T分数"
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

          {/* Dimension Details */}
          <div className="space-y-6 flex flex-col justify-center">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-lg">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">依恋风格分析</span>
              <div className="text-xl font-bold text-pink-600 flex items-center gap-2">
                 <span>🧩</span> {result.attachmentStyle}
              </div>
              <p className="text-xs text-slate-400 mt-2">基于焦虑与回避维度的交叉评估</p>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">维度健康详情</h3>
              {result.dimensions.map((dim) => (
                <div key={dim.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600 font-medium">{dim.name}</span>
                    <span className={`font-bold ${dim.tScore >= 50 ? 'text-green-600' : 'text-orange-600'}`}>
                      {dim.tScore}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden relative">
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-300 z-10"></div>
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${dim.tScore >= 50 ? 'bg-gradient-to-r from-blue-300 to-green-400' : 'bg-gradient-to-r from-red-300 to-orange-400'}`}
                      style={{ width: `${Math.min(100, Math.max(0, dim.tScore))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pb-12">
          <button 
            onClick={() => { window.location.href = window.location.pathname; }}
            className="w-full sm:w-auto px-10 py-4 bg-slate-100 text-slate-700 rounded-full hover:bg-slate-200 transition-all font-bold text-lg shadow-md hover:shadow-lg"
          >
            ↻ 重新测试
          </button>
          
          <button 
            onClick={handleShare}
            className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-full hover:shadow-xl transition-all font-bold text-lg shadow-md hover:-translate-y-0.5"
          >
            📤 分享结果
          </button>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 pb-8 border-t border-slate-100 pt-8">
          <p>LHI Calculator v2.0 • AI-Powered Analysis by DeepSeek</p>
          <p className="mt-1">免责声明：本工具仅供参考，非专业诊断</p>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-scale-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📤</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">分享你的结果</h3>
              <p className="text-slate-500 text-sm">复制链接分享给朋友，让他们也了解你的恋爱健康状况</p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-200">
              <p className="text-sm text-slate-600 break-all font-mono">
                {shareUrl}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCopyLink}
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                  copied 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gradient-to-r from-pink-500 to-pink-600 text-white hover:shadow-lg'
                }`}
              >
                {copied ? '✓ 已复制' : '复制链接'}
              </button>
              <button
                onClick={() => setShowShareModal(false)}
                className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-all"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportScreen;
