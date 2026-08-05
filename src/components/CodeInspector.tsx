import React, { useState } from 'react';
import { PYTHON_FILES, PythonFile } from '../data/pythonSourceCode';
import { Copy, Download, Check, FileCode, FolderArchive, Search, ShieldCheck } from 'lucide-react';
import JSZip from 'jszip';

export function CodeInspector() {
  const [selectedFileId, setSelectedFileId] = useState<string>('drone_env');
  const [copied, setCopied] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isZipping, setIsZipping] = useState<boolean>(false);

  const selectedFile = PYTHON_FILES.find(f => f.id === selectedFileId) || PYTHON_FILES[0];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSingleFile = () => {
    const blob = new Blob([selectedFile.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = selectedFile.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      PYTHON_FILES.forEach(file => {
        zip.file(file.filename, file.code);
      });

      // Add a README file describing execution commands
      zip.file('README.md', `# Autonomous Drone Navigation with Deep RL (DQN)

This package contains the 8 complete production Python files for 3D autonomous drone navigation using Deep Q-Networks (DQN).

## Requirements
Python 3.9+ with PyTorch and Gymnasium.
Install dependencies:
\`\`\`bash
pip install -r requirements.txt
\`\`\`

## Running Training
To start 10,000 episode DQN training with automatic model checkpointing:
\`\`\`bash
python main.py --episodes 10000 --seed 42
\`\`\`

## Evaluation & Visualization
To run evaluation with saved checkpoint and generate 3D flight paths:
\`\`\`bash
python main.py --eval --resume-from-checkpoint checkpoints/best_dqn_drone.pth
\`\`\`
`);

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'autonomous_drone_rl_dqn.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Zip generation error:", err);
    } finally {
      setIsZipping(false);
    }
  };

  const filteredFiles = PYTHON_FILES.filter(f =>
    f.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-lg">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <FileCode className="w-5 h-5 text-cyan-400" />
            <span>Python Project Deliverables (8 Complete Files)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Strictly production-ready, type-hinted Gymnasium Env, PyTorch DQN, and Matplotlib visualizer suite.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadZip}
            disabled={isZipping}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            <FolderArchive className="w-4 h-4" />
            <span>{isZipping ? 'Zipping Files...' : 'Download Project (.zip)'}</span>
          </button>
        </div>
      </div>

      {/* Main IDE Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Sidebar: File Tree & Requirements checklist */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg space-y-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search files..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1">
              {filteredFiles.map(file => {
                const isSelected = file.id === selectedFileId;
                return (
                  <button
                    key={file.id}
                    onClick={() => setSelectedFileId(file.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-mono transition-all flex items-center justify-between group ${
                      isSelected
                        ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 font-medium'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileCode className={`w-4 h-4 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-400'}`} />
                      <span className="truncate">{file.filename}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 shrink-0 uppercase">
                      {file.filename.split('.').pop()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Code Requirements Compliance Checklist */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
            <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Project Requirements Verification</span>
            </h3>

            <div className="space-y-2 text-[11px] text-slate-300">
              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Gymnasium API:</strong> Env inherits <code>gymnasium.Env</code> returning tuple (obs, reward, terminated, truncated, info).</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>DQN Q-Network:</strong> Input (16-20) → Dense(128, ReLU) → Dense(64, ReLU) → Output 6 Q-values.</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Sensor & Physics Guards:</strong> Ray-sphere collision detection with zero-division epsilon protection (1e-9).</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>10,000 Episode Trainer:</strong> Target network sync, CSV metric logger, best & latest model checkpointing (.pth).</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>3D Matplotlib Visualizer:</strong> 3D trajectory plots with obstacles + 4-panel training metrics curves.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Pane: Code Viewer & Actions */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col h-[650px]">
          {/* File Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
            <div>
              <div className="text-xs font-semibold text-slate-200 font-mono flex items-center gap-2">
                <span>{selectedFile.filename}</span>
                <span className="text-[11px] text-slate-500 font-sans font-normal">({selectedFile.title})</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">{selectedFile.description}</div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-all active:scale-95 border border-slate-700"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>

              <button
                onClick={handleDownloadSingleFile}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 text-xs font-medium transition-all active:scale-95 border border-cyan-800/80"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>
          </div>

          {/* Code Body */}
          <div className="flex-1 overflow-auto bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-200 select-text">
            <pre className="whitespace-pre">
              {selectedFile.code.split('\n').map((line, idx) => (
                <div key={idx} className="table-row">
                  <span className="table-cell pr-4 text-right select-none text-slate-600 text-[11px]">
                    {idx + 1}
                  </span>
                  <span className="table-cell">{line}</span>
                </div>
              ))}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
