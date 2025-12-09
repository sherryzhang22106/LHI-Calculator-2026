import React, { useState, useEffect } from 'react';
import { adminApi } from './services/adminApi';

interface DashboardProps {
  admin: { id: string; email: string; name: string };
  onLogout: () => void;
}

type Tab = 'overview' | 'assessments' | 'codes';

const Dashboard: React.FC<DashboardProps> = ({ admin, onLogout }) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<any>(null);
  const [codeStats, setCodeStats] = useState<any>(null);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generateCount, setGenerateCount] = useState(10);
  const [newlyGeneratedCodes, setNewlyGeneratedCodes] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const [statsData, codeStatsData] = await Promise.all([
          adminApi.getStatistics(),
          adminApi.getCodeStats(),
        ]);
        setStats(statsData);
        setCodeStats(codeStatsData);
      } else if (activeTab === 'assessments') {
        const data = await adminApi.listAssessments(1, 20);
        setAssessments(data.assessments);
      } else if (activeTab === 'codes') {
        const data = await adminApi.listCodes(1, 50, 'all');
        setCodes(data.codes);
        const codeStatsData = await adminApi.getCodeStats();
        setCodeStats(codeStatsData);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCodes = async () => {
    try {
      const result = await adminApi.generateCodes(generateCount);
      alert(`成功生成 ${generateCount} 个兑换码！`);
      
      // Store newly generated codes for export
      if (result && result.codes) {
        setNewlyGeneratedCodes(result.codes);
      }
      
      loadData();
    } catch (error) {
      alert('生成兑换码失败');
    }
  };

  const handleExportCodes = () => {
    if (newlyGeneratedCodes.length === 0) {
      alert('没有可导出的兑换码，请先生成新的兑换码');
      return;
    }

    // Create CSV content
    const headers = ['兑换码', '批次ID', '生成时间', '状态'];
    const rows = newlyGeneratedCodes.map(code => [
      code.code,
      code.batchId,
      new Date(code.createdAt).toLocaleString('zh-CN'),
      code.isUsed ? '已使用' : '未使用'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Add BOM for Excel to recognize UTF-8
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `兑换码_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">📊</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">LHI Admin</h1>
              <p className="text-xs text-slate-500">{admin.email}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium transition-colors"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        <div className="flex gap-2 mb-6 bg-white p-2 rounded-lg shadow-sm">
          {[
            { id: 'overview', label: '数据概览', icon: '📈' },
            { id: 'assessments', label: '评估记录', icon: '📝' },
            { id: 'codes', label: '兑换码管理', icon: '🔑' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
            <p className="mt-4 text-slate-500">加载中...</p>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && stats && codeStats && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <StatCard title="评估总数" value={stats.total} icon="📊" color="blue" />
                  <StatCard title="平均分数" value={stats.avgScore} icon="⭐" color="green" />
                  <StatCard title="可用兑换码" value={codeStats.available} icon="🔑" color="purple" />
                  <StatCard title="已用兑换码" value={codeStats.used} icon="✅" color="pink" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">类别分布</h3>
                    <div className="space-y-3">
                      {stats.categoryDistribution.map((item: any) => (
                        <div key={item.category}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-600">{item.category}</span>
                            <span className="font-bold text-slate-800">{item.count}</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-400 to-pink-400"
                              style={{ width: `${(item.count / stats.total) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">依恋风格分布</h3>
                    <div className="space-y-3">
                      {stats.attachmentDistribution.map((item: any) => (
                        <div key={item.style}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-600">{item.style}</span>
                            <span className="font-bold text-slate-800">{item.count}</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-400 to-cyan-400"
                              style={{ width: `${(item.count / stats.total) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">最近评估</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-slate-600 font-medium">分数</th>
                          <th className="px-4 py-3 text-left text-slate-600 font-medium">类别</th>
                          <th className="px-4 py-3 text-left text-slate-600 font-medium">依恋风格</th>
                          <th className="px-4 py-3 text-left text-slate-600 font-medium">日期</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentAssessments.map((assessment: any) => (
                          <tr key={assessment.id} className="border-t border-slate-100">
                            <td className="px-4 py-3 font-bold text-purple-600">{assessment.totalScore}</td>
                            <td className="px-4 py-3 text-slate-700">{assessment.category}</td>
                            <td className="px-4 py-3 text-slate-600 text-xs">{assessment.attachmentStyle}</td>
                            <td className="px-4 py-3 text-slate-500 text-xs">
                              {new Date(assessment.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'assessments' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">所有评估记录</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-slate-600 font-medium">评估ID</th>
                        <th className="px-4 py-3 text-left text-slate-600 font-medium">分数</th>
                        <th className="px-4 py-3 text-left text-slate-600 font-medium">类别</th>
                        <th className="px-4 py-3 text-left text-slate-600 font-medium">兑换码</th>
                        <th className="px-4 py-3 text-left text-slate-600 font-medium">评估日期</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assessments.map((assessment) => (
                        <tr key={assessment.id} className="border-t border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-500 text-xs font-mono">{assessment.id.slice(0, 8)}</td>
                          <td className="px-4 py-3 font-bold text-purple-600">{assessment.totalScore}</td>
                          <td className="px-4 py-3 text-slate-700">{assessment.category}</td>
                          <td className="px-4 py-3 text-xs font-mono text-slate-600">{assessment.accessCode.code}</td>
                          <td className="px-4 py-3 text-slate-500 text-xs">
                            {new Date(assessment.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'codes' && codeStats && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">生成兑换码</h3>
                  <div className="flex gap-4">
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={generateCount}
                      onChange={(e) => setGenerateCount(parseInt(e.target.value))}
                      className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                      placeholder="数量"
                    />
                    <button
                      onClick={handleGenerateCodes}
                      className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                    >
                      生成兑换码
                    </button>
                    {newlyGeneratedCodes.length > 0 && (
                      <button
                        onClick={handleExportCodes}
                        className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                      >
                        📥 导出新生成的兑换码 ({newlyGeneratedCodes.length})
                      </button>
                    )}
                  </div>
                  <div className="mt-4 flex gap-4 text-sm">
                    <span className="text-slate-600">总数: <strong>{codeStats.total}</strong></span>
                    <span className="text-green-600">可用: <strong>{codeStats.available}</strong></span>
                    <span className="text-slate-400">已用: <strong>{codeStats.used}</strong></span>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">兑换码列表</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-slate-600 font-medium">兑换码</th>
                          <th className="px-4 py-3 text-left text-slate-600 font-medium">状态</th>
                          <th className="px-4 py-3 text-left text-slate-600 font-medium">批次</th>
                          <th className="px-4 py-3 text-left text-slate-600 font-medium">生成时间</th>
                          <th className="px-4 py-3 text-left text-slate-600 font-medium">使用时间</th>
                        </tr>
                      </thead>
                      <tbody>
                        {codes.map((code) => (
                          <tr key={code.id} className="border-t border-slate-100">
                            <td className="px-4 py-3 font-mono font-bold text-purple-600">{code.code}</td>
                            <td className="px-4 py-3">
                              {code.isUsed ? (
                                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">已使用</span>
                              ) : (
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">未使用</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-600 text-xs">{code.batchId}</td>
                            <td className="px-4 py-3 text-slate-500 text-xs">
                              {code.createdAt ? new Date(code.createdAt).toLocaleString('zh-CN') : '-'}
                            </td>
                            <td className="px-4 py-3 text-slate-500 text-xs">
                              {code.usedAt ? new Date(code.usedAt).toLocaleString('zh-CN') : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: number; icon: string; color: string }> = ({
  title,
  value,
  icon,
  color,
}) => {
  const colors: Record<string, string> = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    purple: 'from-purple-500 to-pink-500',
    pink: 'from-pink-500 to-rose-500',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colors[color]} opacity-10`}></div>
      </div>
      <div className="text-3xl font-bold text-slate-800 mb-1">{value}</div>
      <div className="text-sm text-slate-500">{title}</div>
    </div>
  );
};

export default Dashboard;
