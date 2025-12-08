import React, { useState } from 'react';
import { apiClient } from '../services/api/client';

interface WelcomeScreenProps {
  onStart: (code: string) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const inputCode = code.trim().toUpperCase();
      const result = await apiClient.validateAccessCode(inputCode);
      
      if (result.valid) {
        onStart(inputCode);
      } else {
        setError(result.message || '无效码。请核对后重试。');
        setIsLoading(false);
      }
    } catch (err: any) {
      setError('验证失败，请检查网络连接。');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-fade-in bg-pink-50">
      <div className="bg-white rounded-3xl shadow-xl p-8 sm:p-12 max-w-md w-full border border-pink-100">
        <div className="text-center mb-10">
          <div className="bg-pink-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner">
            ❤️
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-3">LHI 恋爱健康指数</h1>
          <p className="text-slate-500 leading-relaxed">
            请输入您的专属兑换码<br/>开始深度心理自评估
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="text"
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-6 py-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-pink-300 focus:border-pink-300 outline-none transition-all text-center text-lg tracking-widest uppercase placeholder-slate-300"
              placeholder="输入兑换码"
              required
            />
            {error && <p className="mt-3 text-center text-sm text-red-500 font-medium animate-pulse">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading || !code}
            className={`w-full py-4 px-6 rounded-xl text-white font-bold text-lg shadow-lg shadow-pink-200 transition-all 
              ${isLoading ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-pink-500 hover:bg-pink-600 hover:-translate-y-1 active:scale-95'}
            `}
          >
            {isLoading ? '验证中...' : '开始测评'}
          </button>
        </form>

        <div className="mt-10 border-t border-slate-50 pt-6">
          <p className="text-[10px] text-slate-400 text-center leading-relaxed">
            免责声明：本工具仅供娱乐和自我了解使用，非专业诊断。
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;