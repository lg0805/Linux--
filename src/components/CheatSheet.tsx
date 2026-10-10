import { useState } from 'react';
import { PRESET_PERMISSIONS } from '../data/cheatsheetData';
import { TerminalSnippet } from './TerminalSnippet';
import { Search, BookMarked, Copy, Check, FileCheck, Layers } from 'lucide-react';
import { AclGuide } from './AclGuide';

export function CheatSheet() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'matrix' | 'acl'>('matrix');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const filteredPresets = PRESET_PERMISSIONS.filter(
    (p) =>
      p.octal.includes(searchTerm) ||
      p.symbolic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.usage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopyCommand = async (cmd: string) => {
    try {
      await navigator.clipboard.writeText(cmd);
      setCopiedCmd(cmd);
      setTimeout(() => setCopiedCmd(null), 2000);
    } catch {
      setCopiedCmd(cmd);
      setTimeout(() => setCopiedCmd(null), 2000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Subtab navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab('matrix')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
            activeSubTab === 'matrix'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          <BookMarked className="w-4 h-4" />
          <span>高频权限速查字典</span>
        </button>
        <button
          onClick={() => setActiveSubTab('acl')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
            activeSubTab === 'acl'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>ACL 访问控制列表扩展</span>
        </button>
      </div>

      {activeSubTab === 'acl' ? (
        <AclGuide />
      ) : (
        <div className="space-y-6">
          {/* Search bar & summary */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索八进制 (如 755)、符号 (如 rwx) 或应用场景 (如 SSH)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400 placeholder:text-slate-500"
              />
            </div>
            <span className="text-xs text-slate-400 self-center">
              匹配到 <strong className="text-cyan-400 font-mono">{filteredPresets.length}</strong> 条标准配置
            </span>
          </div>

          {/* Preset Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPresets.map((item) => (
              <div
                key={item.octal}
                className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-3.5 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xl font-bold text-cyan-300 tabular-nums">
                        {item.octal}
                      </span>
                      <span className="font-mono text-xs text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                        {item.symbolic}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase ${
                        item.risk === 'safe'
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : item.risk === 'warning'
                          ? 'bg-amber-500/15 text-amber-300'
                          : item.risk === 'danger'
                          ? 'bg-rose-500/15 text-rose-300'
                          : 'bg-cyan-500/15 text-cyan-300'
                      }`}
                    >
                      {item.risk === 'safe'
                        ? '标准安全'
                        : item.risk === 'warning'
                        ? '特权关注'
                        : item.risk === 'danger'
                        ? '高危慎用'
                        : '特殊位'}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white">{item.name}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>

                  <div className="text-[11px] text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-850">
                    <span className="text-slate-500 block text-[10px]">典型使用场景:</span>
                    {item.usage}
                  </div>
                </div>

                {/* Quick copy command */}
                <div className="pt-2 border-t border-slate-850 flex items-center justify-between">
                  <code className="text-[11px] font-mono text-cyan-400 truncate max-w-[200px]">
                    $ {item.command}
                  </code>
                  <button
                    onClick={() => handleCopyCommand(item.command)}
                    className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                    title="复制命令"
                  >
                    {copiedCmd === item.command ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Grammar & Quick Reference Cards */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-cyan-400" />
              chmod 符号语法公式完全速查
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                <span className="text-cyan-400 font-bold block text-sm font-sans">1. 操作主体 (Who)</span>
                <ul className="space-y-1 text-slate-300">
                  <li><code className="text-amber-300 font-bold">u</code> : User (所有者/属主)</li>
                  <li><code className="text-emerald-300 font-bold">g</code> : Group (所属组)</li>
                  <li><code className="text-purple-300 font-bold">o</code> : Others (其他所有人)</li>
                  <li><code className="text-cyan-300 font-bold">a</code> : All (全部三人集 ugo)</li>
                </ul>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                <span className="text-cyan-400 font-bold block text-sm font-sans">2. 运算符 (Operator)</span>
                <ul className="space-y-1 text-slate-300">
                  <li><code className="text-emerald-400 font-bold">+</code> : 增加某权限位</li>
                  <li><code className="text-rose-400 font-bold">-</code> : 剥夺/移除某权限位</li>
                  <li><code className="text-cyan-400 font-bold">=</code> : 精确设定为此权限</li>
                </ul>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                <span className="text-cyan-400 font-bold block text-sm font-sans">3. 权限字符 (Permissions)</span>
                <ul className="space-y-1 text-slate-300">
                  <li><code className="text-white font-bold">r / w / x</code> : 读 / 写 / 执行</li>
                  <li><code className="text-rose-400 font-bold">s</code> : SUID 或 SGID</li>
                  <li><code className="text-cyan-400 font-bold">t</code> : Sticky Bit 粘滞位</li>
                  <li><code className="text-amber-400 font-bold">X</code> : 仅当目标是目录或已有 x 时添加</li>
                </ul>
              </div>
            </div>

            <div className="pt-2">
              <TerminalSnippet
                title="常用符号组合示例"
                command="chmod u+x,g-w,o=r deploy.sh && chmod -R a+rX /var/www/html"
                output="为属主增加执行、剥夺组写权限、其他人重设为只读；递归为所有人增加读权限，并只给目录和已有可执行文件补充 x"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
