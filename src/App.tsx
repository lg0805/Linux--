import { useState } from 'react';
import { FullPermissionState } from './types';
import { Header } from './components/Header';
import { Calculator } from './components/Calculator';
import { FileVsDir } from './components/FileVsDir';
import { SpecialPermissions } from './components/SpecialPermissions';
import { UmaskLab } from './components/UmaskLab';
import { DecisionSandbox } from './components/DecisionSandbox';
import { Challenges } from './components/Challenges';
import { CheatSheet } from './components/CheatSheet';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('calculator');

  // Global shared permission state for calculator & quick reset
  const [permState, setPermState] = useState<FullPermissionState>({
    fileType: '-',
    user: { read: true, write: true, execute: true }, // 7
    group: { read: true, write: false, execute: true }, // 5
    others: { read: true, write: false, execute: true }, // 5
    special: { suid: false, sgid: false, sticky: false },
    filename: 'deploy.sh',
    owner: 'alice',
    groupName: 'developers',
    sizeBytes: 4096,
  });

  const handleQuickReset = () => {
    setPermState({
      fileType: '-',
      user: { read: true, write: true, execute: true },
      group: { read: true, write: false, execute: true },
      others: { read: true, write: false, execute: true },
      special: { suid: false, sgid: false, sticky: false },
      filename: 'deploy.sh',
      owner: 'alice',
      groupName: 'developers',
      sizeBytes: 4096,
    });
    setActiveTab('calculator');
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Bar adhering to the Top Bar Contract */}
      <Header
        activeTab={activeTab}
        onSelectTab={(tabId) => setActiveTab(tabId)}
        onQuickReset={handleQuickReset}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'calculator' && (
          <Calculator state={permState} onChange={setPermState} />
        )}
        {activeTab === 'file_vs_dir' && <FileVsDir />}
        {activeTab === 'special_bits' && <SpecialPermissions />}
        {activeTab === 'umask' && <UmaskLab />}
        {activeTab === 'sandbox' && <DecisionSandbox />}
        {activeTab === 'challenges' && <Challenges />}
        {activeTab === 'cheatsheet' && <CheatSheet />}
      </main>

      {/* Clean Unboxed Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>Linux 权限管理系统</span>
            <span aria-hidden="true">·</span>
            <span>POSIX.1-2017 DAC 规范兼容</span>
            <span aria-hidden="true">·</span>
            <span>chmod / chown / umask / setfacl</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Linux 权限机制交互式实验台</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
