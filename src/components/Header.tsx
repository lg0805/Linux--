interface HeaderProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  onQuickReset: () => void;
}

export function Header({ activeTab, onSelectTab, onQuickReset }: HeaderProps) {
  const navItems = [
    { id: 'calculator', label: '权限矩阵与换算' },
    { id: 'file_vs_dir', label: '文件与目录区别' },
    { id: 'special_bits', label: '特殊权限 (SUID/SGID)' },
    { id: 'umask', label: 'Umask 掩码推演' },
    { id: 'sandbox', label: '内核判决沙箱' },
    { id: 'challenges', label: '排错实战挑战' },
    { id: 'cheatsheet', label: '速查与 ACL' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-6 py-3.5">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => onSelectTab('calculator')}
          className="text-lg font-bold tracking-tight text-white hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 text-left"
        >
          Linux 权限实验室
        </button>

        {/* Zone 2: Nav links */}
        <nav className="hidden xl:flex items-center gap-6 text-sm font-medium text-slate-300">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`transition-colors whitespace-nowrap shrink-0 py-1 ${
                  isActive
                    ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onQuickReset}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 active:bg-cyan-500 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm"
          >
            重置为标准 755
          </button>
        </div>
      </div>

      {/* Responsive mobile/tablet horizontal scroll bar */}
      <div className="xl:hidden flex items-center gap-2 overflow-x-auto px-4 py-2 border-t border-slate-850 bg-slate-900/60 no-scrollbar">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-400 font-semibold border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white bg-slate-800/50'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}
