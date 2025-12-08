import React, { useEffect, useState } from 'react';
import { AssessmentResult } from '../types';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface ReportScreenProps {
  result: AssessmentResult;
}

const ReportScreen: React.FC<ReportScreenProps> = ({ result }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

  // Prepare chart data using T-Scores (Health Index, Higher is Better)
  const radarData = result.dimensions.map(d => ({
    subject: d.name,
    A: d.tScore, // T-Score 30-70
    fullMark: 80,
  }));

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white pb-20 pt-12 px-4 sm:px-6 font-sans">
      <div className="max-w-3xl mx-auto">
        
        {/* Main Score Section - Based on Screenshot */}
        <div className="text-center mb-12">
          {/* Heart Icon */}
          <div className="w-24 h-24 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-pink-600 mb-2 tracking-tight">
            恋爱健康指数 (LHI)
          </h1>

          {/* Big Score */}
          <div className="text-[120px] leading-none font-bold text-pink-500 mb-6 tracking-tighter">
            {result.totalScore}
          </div>

          {/* Category Strip */}
          <div className="mb-10">
            <div className={`py-3 px-8 rounded-lg inline-block text-xl font-bold border 
              ${result.totalScore > 70 ? 'bg-green-50 text-green-600 border-green-100' : 
                result.totalScore > 50 ? 'bg-blue-50 text-blue-500 border-blue-100' :
                'bg-orange-50 text-orange-500 border-orange-100'}`}>
               {result.category === 'Fragile' && '脆弱的爱 (建议咨询)'}
               {result.category === 'Below Average' && '平均以下 (潜在问题)'}
               {result.category === 'Average' && '平均水平 (平衡发展)'}
               {result.category === 'Healthy' && '健康的爱 (安全稳定)'}
            </div>
          </div>

          {/* Text Description */}
          <p className="text-slate-500 mb-8 max-w-lg mx-auto text-lg">
            你的恋爱健康指数为 <span className="text-pink-600 font-bold text-2xl">{result.totalScore}</span>，
            处于 <span className="font-bold text-slate-700">{
               result.category === 'Fragile' ? '脆弱' : 
               result.category === 'Below Average' ? '偏低' : 
               result.category === 'Average' ? '平均' : '健康'
            }</span> 水平
          </p>

          {/* Custom Progress Bar */}
          <div className="max-w-xl mx-auto mb-16">
            <div className="h-4 bg-slate-100 rounded-full w-full relative overflow-hidden">
               <div 
                 className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out
                   ${result.totalScore > 70 ? 'bg-green-400' : result.totalScore > 50 ? 'bg-blue-400' : 'bg-pink-500'}
                 `}
                 style={{ width: `${result.totalScore}%` }}
               />
            </div>
            <div className="flex justify-between mt-3 text-sm text-slate-400 font-medium">
              <span>0 (高风险)</span>
              <span>50 (平均)</span>
              <span>100 (健康)</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-100 w-full mb-12"></div>

        {/* Details Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
          
          {/* Radar Chart */}
          <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100">
            <h3 className="text-center font-bold text-slate-700 mb-2">健康维度雷达 (T分数)</h3>
            <p className="text-center text-[10px] text-slate-400 mb-4">面积越大代表关系越健康</p>
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

          {/* Scores List */}
          <div className="space-y-6 flex flex-col justify-center">
            <div className="bg-white p-5 rounded-xl border border-pink-100 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">依恋风格分析</span>
              <div className="text-xl font-bold text-pink-600 flex items-center gap-2">
                 <span>🧩</span> {result.attachmentStyle}
              </div>
              <p className="text-xs text-slate-400 mt-2">基于焦虑与回避维度的交叉评估</p>
            </div>

            <div className="space-y-5">
              <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider ml-1">维度健康详情 (T-Score)</h3>
              {result.dimensions.map((dim) => (
                <div key={dim.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600 font-medium">{dim.name}</span>
                    <span className={`font-bold ${dim.tScore >= 50 ? 'text-green-500' : 'text-orange-500'}`}>
                      {dim.tScore} <span className="text-[10px] font-normal text-slate-400">/ 100</span>
                    </span>
                  </div>
                  {/* Mountain Chart / Bar Visualization */}
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex items-center relative">
                    {/* Center Mark */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-300 z-10"></div>
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${dim.tScore >= 50 ? 'bg-gradient-to-r from-blue-300 to-green-400' : 'bg-gradient-to-r from-red-300 to-orange-300'}`}
                      style={{ width: `${Math.min(100, Math.max(0, dim.tScore))}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-300 mt-1 px-1">
                    <span>Unhealthy</span>
                    <span>Avg (50)</span>
                    <span>Healthy</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="text-center pb-12">
          <button 
            onClick={() => { window.location.href = window.location.pathname; }}
            className="w-full sm:w-auto px-12 py-4 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-colors font-bold text-lg"
          >
            ↻ 重新测试
          </button>
        </div>

        {/* Footer */}
        <div className="text-center text-[10px] text-slate-300 pb-8">
          <p>LHI Calculator v1.2 • Evaluation Model: Z-Score Health Index</p>
          <p className="mt-1">Disclaimer: Self-assessment only. Not a clinical diagnosis.</p>
        </div>

      </div>
    </div>
  );
};

export default ReportScreen;