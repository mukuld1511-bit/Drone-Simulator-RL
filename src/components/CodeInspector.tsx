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
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <h2 className="text-lg font-medium text-neutral-900 tracking-tight">
            Python Source Code
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Complete production-ready Gymnasium Env and PyTorch DQN implementation.
          </p>
        </div>

        <button
          onClick={handleDownloadZip}
          disabled={isZipping}
          className="flex items-center gap-2 px-4 py-2 border border-neutral-900 text-neutral-900 bg-white hover:bg-neutral-50 text-xs font-semibold uppercase tracking-widest transition-colors disabled:opacity-50"
        >
          <FolderArchive className="w-4 h-4" />
          <span>{isZipping ? 'Zipping...' : 'Download Project'}</span>
        </button>
      </div>

      {/* Main IDE Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar */}
        <div className="lg:col-span-3 space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search files..."
                className="w-full bg-white border border-neutral-200 rounded-none pl-9 pr-3 py-2 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors"
              />
            </div>

            <div className="space-y-1">
              {filteredFiles.map(file => {
                const isSelected = file.id === selectedFileId;
                return (
                  <button
                    key={file.id}
                    onClick={() => setSelectedFileId(file.id)}
                    className={`w-full text-left px-3 py-2 text-sm font-mono transition-colors flex items-center justify-between group ${
                      isSelected
                        ? 'bg-neutral-900 text-white font-medium'
                        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                    }`}
                  >
                    <span className="truncate">{file.filename}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-200 space-y-3">
            <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-widest">
              Requirements Check
            </h3>
            <div className="space-y-2 text-xs text-neutral-600">
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-neutral-900 shrink-0" />
                <span>Gymnasium Env API</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-neutral-900 shrink-0" />
                <span>DQN Q-Network structure</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-neutral-900 shrink-0" />
                <span>Sensor & collision physics</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-neutral-900 shrink-0" />
                <span>10k Episode Trainer</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Pane */}
        <div className="lg:col-span-9 border border-neutral-200 bg-white flex flex-col h-[700px]">
          {/* File Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
            <div>
              <div className="text-sm font-medium text-neutral-900 font-mono">
                {selectedFile.filename}
              </div>
              <div className="text-xs text-neutral-500 mt-1">{selectedFile.description}</div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 text-neutral-600 hover:text-neutral-900 text-xs font-semibold uppercase tracking-widest transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={handleDownloadSingleFile}
                className="flex items-center gap-1.5 px-3 py-1.5 text-neutral-600 hover:text-neutral-900 text-xs font-semibold uppercase tracking-widest transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Save</span>
              </button>
            </div>
          </div>

          {/* Code Body */}
          <div className="flex-1 overflow-auto bg-neutral-50 p-6 font-mono text-sm leading-relaxed text-neutral-800 select-text">
            <pre className="whitespace-pre">
              {selectedFile.code.split('\n').map((line, idx) => (
                <div key={idx} className="table-row">
                  <span className="table-cell pr-6 text-right select-none text-neutral-400 text-xs">
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
