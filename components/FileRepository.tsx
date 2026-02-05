
import React from 'react';
import { FileSpreadsheet, Trash2, HardDrive, Database, Download, UploadCloud } from 'lucide-react';

interface FileRepositoryProps {
  files: { id: string; name: string; size: number; data: any[] }[];
  onDelete: (id: string) => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const FileRepository: React.FC<FileRepositoryProps> = ({ files, onDelete, onExport, onImport }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <HardDrive className="text-blue-600" size={24} />
          <h3 className="text-lg font-bold text-slate-800">数据中心</h3>
          <div className="text-[10px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 ml-2">
            共 {files.length} 个文件
          </div>
        </div>
        
        <div className="flex gap-2">
          <label className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-600 text-[11px] font-bold rounded-lg border border-slate-200 cursor-pointer transition-all">
            <UploadCloud size={14} />
            导入备份
            <input type="file" accept=".json" className="hidden" onChange={onImport} />
          </label>
          <button 
            onClick={onExport}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg transition-all shadow-sm"
          >
            <Download size={14} />
            备份全部数据
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {files.map((file) => (
          <div key={file.id} className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between group hover:shadow-md transition-all">
            <div className="flex items-center gap-4 overflow-hidden">
              <div className="bg-blue-600 p-3 rounded-xl text-white shadow-sm">
                <FileSpreadsheet size={20} />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-bold text-slate-900 truncate" title={file.name}>
                  {file.name}
                </span>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium mt-0.5">
                  <span className="flex items-center gap-1"><Database size={10} /> {file.data.length} 条记录</span>
                  <span>•</span>
                  <span>{(file.size / 1024).toFixed(1)} KB</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => onDelete(file.id)}
              className="p-2.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
              title="从仓库中删除"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}

        {files.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-2xl">
            <p className="text-slate-400 text-sm font-medium">数据中心空空如也。请返回上传文件或导入备份。</p>
          </div>
        )}
      </div>

      <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
        <p className="text-[11px] text-amber-800 leading-relaxed">
          <span className="font-bold">💡 提示:</span> 当前数据存储在您的浏览器中。如果您需要换台电脑工作，请点击上方“备份全部数据”下载 JSON 文件，然后在另一台设备上“导入备份”即可恢复所有分析进度。
        </p>
      </div>
    </div>
  );
};

export default FileRepository;
