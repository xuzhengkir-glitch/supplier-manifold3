
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { BarChart3, Database, BrainCircuit, Trash2, ArrowLeft, HardDrive, RefreshCw, Server, Globe, CheckCircle2, ShieldCheck, Zap, AlertTriangle, Terminal, ShieldAlert, Lock } from 'lucide-react';
import * as XLSX from 'xlsx';
import { DataRecord } from './types';
import FileStaging from './components/FileStaging';
import FileRepository from './components/FileRepository';
import StatsDashboard from './components/StatsDashboard';
import ChartView from './components/ChartView';
import DataTable from './components/DataTable';
import GeminiAnalysis from './components/GeminiAnalysis';
import { calculateStats } from './utils/stats';
import { vpsSync } from './utils/vpsSync';

const STORAGE_KEY = 'measurement_pro_repository';

interface UploadedFileEntry {
  id: string;
  name: string;
  size: number;
  data: DataRecord[];
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'visualize' | 'data' | 'ai' | 'files'>('visualize');
  const [error, setError] = useState<string | null>(null);
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileEntry[]>([]);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'success'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [showDiagnostic, setShowDiagnostic] = useState(false);

  const handleFilesStaged = useCallback((newFiles: File[]) => {
    setStagedFiles(prev => [...prev, ...newFiles]);
  }, []);

  const removeStagedFile = useCallback((index: number) => {
    setStagedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const loadGlobalData = async () => {
    setSyncStatus('syncing');
    const data = await vpsSync.fetchData();
    if (data) {
      setUploadedFiles(data);
      if (data.length > 0) setIsAnalysing(true);
      setSyncStatus('success');
      setLastSyncTime(new Date().toLocaleTimeString());
      setShowDiagnostic(false);
    } else {
      setSyncStatus('error');
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setUploadedFiles(JSON.parse(saved));
    }
  };

  useEffect(() => {
    loadGlobalData();
  }, []);

  const allData = useMemo(() => {
    return uploadedFiles.flatMap(f => f.data).map((record, idx) => ({
      ...record,
      index: idx 
    }));
  }, [uploadedFiles]);

  const stats = useMemo(() => {
    return allData.length > 0 ? calculateStats(allData) : null;
  }, [allData]);

  const pushToCloud = async (newData: UploadedFileEntry[]) => {
    setSyncStatus('syncing');
    const success = await vpsSync.saveData(newData);
    if (success) {
      setSyncStatus('success');
      setLastSyncTime(new Date().toLocaleTimeString());
    } else {
      setSyncStatus('error');
    }
  };

  const removeUploadedFile = async (id: string) => {
    const updated = uploadedFiles.filter(f => f.id !== id);
    setUploadedFiles(updated);
    if (updated.length === 0) setIsAnalysing(false);
    await pushToCloud(updated);
  };

  const processStagedFiles = async () => {
    if (stagedFiles.length === 0) return;
    setIsProcessing(true);
    const newEntries: UploadedFileEntry[] = [];
    try {
      for (const file of stagedFiles) {
        const dataBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(dataBuffer, { type: 'array' });
        const rawJson = XLSX.utils.sheet_to_json<any>(workbook.Sheets[workbook.SheetNames[0]]);
        if (rawJson.length > 0) {
          const fileData: DataRecord[] = rawJson.map((row, idx) => ({
            index: 0,
            serialNumber: row['序列号'] || row['Serial'] || `${file.name}-${idx+1}`,
            value: parseFloat(row['测量值'] || row['Value'] || 0),
            usl: parseFloat(row['上限'] || row['USL'] || 0),
            lsl: parseFloat(row['下限'] || row['LSL'] || 0),
            isOutOfSpec: false 
          })).map(d => ({...d, isOutOfSpec: d.value > d.usl || d.value < d.lsl}));

          newEntries.push({
            id: crypto.randomUUID(),
            name: file.name,
            size: file.size,
            data: fileData
          });
        }
      }
      const updatedAll = [...uploadedFiles, ...newEntries];
      setUploadedFiles(updatedAll);
      setStagedFiles([]);
      setIsAnalysing(true);
      setActiveTab('visualize');
      await pushToCloud(updatedAll);
    } catch (err) {
      setError("文件处理失败");
    } finally {
      setIsProcessing(false);
    }
  };

  const clearSystem = async () => {
    if (window.confirm("⚠️ 警告：这将删除 VPS 上的全局数据！")) {
      setUploadedFiles([]);
      localStorage.removeItem(STORAGE_KEY);
      setIsAnalysing(false);
      await pushToCloud([]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200">
              <Zap size={20} fill="currentColor" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight leading-none">
                Shared <span className="text-indigo-600">Sync</span> Pro
              </h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">Enterprise QC Middle-end</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div 
              onClick={() => syncStatus === 'error' && setShowDiagnostic(true)}
              className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
              syncStatus === 'syncing' ? 'bg-amber-50 border-amber-200 text-amber-600' :
              syncStatus === 'success' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' :
              syncStatus === 'error' ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' :
              'bg-slate-50 border-slate-200 text-slate-400'
            }`}>
              <Globe size={12} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
              {syncStatus === 'syncing' ? '正在同步云端...' : 
               syncStatus === 'success' ? `已连接: 107.172.218.124 (${lastSyncTime})` : 
               syncStatus === 'error' ? 'VPS 连接失败 (点击诊断)' : '就绪'}
            </div>
            
            <button 
              onClick={loadGlobalData}
              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
            >
              <RefreshCw size={18} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-8">
        {syncStatus === 'error' && showDiagnostic && (
          <div className="mb-8 p-6 bg-red-50 border border-red-100 rounded-3xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 text-red-600">
                <ShieldAlert size={24} />
                <h3 className="text-lg font-bold">VPS 连接故障排查 (诊断模式)</h3>
              </div>
              <button onClick={() => setShowDiagnostic(false)} className="text-red-400 hover:text-red-600 font-bold text-xs uppercase">关闭诊断</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-red-800"><Terminal size={14}/> 1. 检查服务运行状态</div>
                <p className="text-xs text-red-600 leading-relaxed">在 Termius 中执行：<br/><code className="bg-red-100 px-1 py-0.5 rounded font-mono">ps aux | grep node</code><br/>确保看到 <code className="font-mono">server.js</code> 正在运行。</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-red-800"><Lock size={14}/> 2. 开放防火墙端口</div>
                <p className="text-xs text-red-600 leading-relaxed">如果服务在跑但连不上：<br/><code className="bg-red-100 px-1 py-0.5 rounded font-mono">ufw allow 3001</code><br/>这将允许网页通过 3001 端口存取数据。</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-red-800"><AlertTriangle size={14}/> 3. 混合内容限制</div>
                <p className="text-xs text-red-600 leading-relaxed">如果你当前网页是 <code className="font-mono">https</code>，浏览器会阻止访问 <code className="font-mono">http://107.172...</code>。请确保当前访问的是 <code className="font-mono">http</code> 链接。</p>
              </div>
            </div>
          </div>
        )}

        {!isAnalysing ? (
          <div className="max-w-3xl mx-auto space-y-8 py-10">
             <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-600 text-white rounded-full text-xs font-bold shadow-xl shadow-indigo-100 mb-4">
                <ShieldCheck size={14} /> 生产环境 · VPS 实时同步
              </div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">企业级测量数据中台</h2>
              <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
                无需账号登录，数据在团队内实时共享。
              </p>
            </div>

            <FileStaging 
              files={stagedFiles}
              onFilesAdded={handleFilesStaged}
              onRemoveFile={removeStagedFile}
              onConfirm={processStagedFiles}
              isProcessing={isProcessing}
              hasExistingData={uploadedFiles.length > 0}
              onJumpToAnalysis={() => setIsAnalysing(true)}
            />
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-500 slide-in-from-bottom-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4">
                <button onClick={() => setIsAnalysing(false)} className="p-2 text-slate-500 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all">
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">云端实时看板</h2>
                    <span className={`flex h-2 w-2 rounded-full ${syncStatus === 'success' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Host: 107.172.218.124 | 全局共享模式
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={clearSystem}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 text-xs font-bold rounded-xl border border-red-100 transition-all"
                >
                  <Trash2 size={14} />
                  清空云端数据库
                </button>
              </div>
            </div>

            {stats && <StatsDashboard stats={stats} />}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="flex border-b border-slate-100 overflow-x-auto scrollbar-hide bg-slate-50/30">
                {[
                  { id: 'visualize', icon: <BarChart3 size={18} />, label: '趋势分析' },
                  { id: 'data', icon: <Database size={18} />, label: '数据明细' },
                  { id: 'ai', icon: <BrainCircuit size={18} />, label: 'AI 质量诊断' },
                  { id: 'files', icon: <HardDrive size={18} />, label: '云端文件' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-3 px-8 py-5 text-sm font-bold transition-all relative shrink-0 ${
                      activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                    {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full" />}
                  </button>
                ))}
              </div>
              <div className="p-6">
                {activeTab === 'visualize' && <ChartView data={allData} />}
                {activeTab === 'data' && <DataTable data={allData} />}
                {activeTab === 'ai' && <GeminiAnalysis data={allData} stats={stats!} />}
                {activeTab === 'files' && (
                  <FileRepository 
                    files={uploadedFiles} 
                    onDelete={removeUploadedFile} 
                    onExport={() => {}} 
                    onImport={() => {}} 
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      <footer className="py-8 text-center bg-white border-t border-slate-100 mt-10">
        <p className="text-[10px] text-slate-300 uppercase tracking-[0.2em] font-black">
          Cloud Infrastructure Node: 107.172.218.124
        </p>
      </footer>
    </div>
  );
};

export default App;
