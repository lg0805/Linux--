import { useState } from 'react';
import { TerminalSnippet } from './TerminalSnippet';
import { ShieldCheck, Plus, Trash2, Sliders, Layers } from 'lucide-react';

interface AclEntry {
  id: string;
  type: 'user' | 'group';
  name: string;
  r: boolean;
  w: boolean;
  x: boolean;
}

export function AclGuide() {
  const [aclEntries, setAclEntries] = useState<AclEntry[]>([
    { id: '1', type: 'user', name: 'alice', r: true, w: true, x: false },
    { id: '2', type: 'group', name: 'marketing', r: true, w: false, x: false },
    { id: '3', type: 'user', name: 'auditor', r: true, w: false, x: false },
  ]);

  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'user' | 'group'>('user');
  const [newR, setNewR] = useState(true);
  const [newW, setNewW] = useState(false);
  const [newX, setNewX] = useState(false);

  const handleAddEntry = () => {
    if (!newName.trim()) return;
    setAclEntries([
      ...aclEntries,
      {
        id: Date.now().toString(),
        type: newType,
        name: newName.trim(),
        r: newR,
        w: newW,
        x: newX,
      },
    ]);
    setNewName('');
  };

  const handleRemoveEntry = (id: string) => {
    setAclEntries(aclEntries.filter((e) => e.id !== id));
  };

  const formatPerm = (r: boolean, w: boolean, x: boolean) =>
    `${r ? 'r' : '-'}${w ? 'w' : '-'}${x ? 'x' : '-'}`;

  const generatedCommands = aclEntries.map((e) => {
    const perm = `${e.r ? 'r' : ''}${e.w ? 'w' : ''}${e.x ? 'x' : ''}` || '-';
    return `setfacl -m ${e.type === 'user' ? 'u' : 'g'}:${e.name}:${perm} data_report.xlsx`;
  });

  const simulatedGetfacl = `# file: data_report.xlsx
# owner: root
# group: root
user::rw-
${aclEntries
  .map((e) => `${e.type}:${e.name}:${formatPerm(e.r, e.w, e.x)}`)
  .join('\n')}
group::r--
mask::rwx
other::---`;

  return (
    <div className="space-y-8">
      {/* Intro */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-4">
        <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Layers className="w-6 h-6 text-cyan-400" />
          POSIX ACL 访问控制列表扩展
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed max-w-4xl">
          传统 Linux UGO 模型仅能设定一个所有者和一个所有组。当面临复杂的跨部门权限需求（例如：Alice 需读写，Bob 仅只读，审计组只读，其他员工完全禁止）时，<strong>ACL (Access Control Lists)</strong> 提供了细粒度的任意多用户和多组权限配置能力。
        </p>
      </div>

      {/* Interactive ACL Builder */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Interactive Config (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                配置自定义用户/组 ACL 条目
              </span>
              <span className="text-xs text-slate-400">目前生效条目: {aclEntries.length} 个</span>
            </div>

            {/* List existing entries */}
            <div className="space-y-2">
              {aclEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-slate-950 p-3 rounded-lg border border-slate-850 flex items-center justify-between text-xs font-mono"
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded bg-slate-900 text-cyan-300 text-[11px] font-sans">
                      {entry.type === 'user' ? '用户 (u)' : '组 (g)'}
                    </span>
                    <span className="text-white font-bold">{entry.name}</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-amber-300 font-bold bg-slate-900 px-2 py-1 rounded">
                      {formatPerm(entry.r, entry.w, entry.x)}
                    </span>
                    <button
                      onClick={() => handleRemoveEntry(entry.id)}
                      className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                      title="删除此规则"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add new entry form */}
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3 pt-3">
              <span className="text-xs text-slate-300 font-semibold block">添加新的细粒度主体规则</span>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as 'user' | 'group')}
                  className="sm:col-span-3 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200"
                >
                  <option value="user">指定用户 (u)</option>
                  <option value="group">指定用户组 (g)</option>
                </select>
                <input
                  type="text"
                  placeholder="用户名或组名 (如 qa_team)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="sm:col-span-5 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono"
                />
                <div className="sm:col-span-4 flex items-center justify-between gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                  <label className="flex items-center gap-1 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={newR}
                      onChange={(e) => setNewR(e.target.checked)}
                      className="rounded bg-slate-950 text-cyan-400 w-3.5 h-3.5"
                    />
                    <span>r</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={newW}
                      onChange={(e) => setNewW(e.target.checked)}
                      className="rounded bg-slate-950 text-cyan-400 w-3.5 h-3.5"
                    />
                    <span>w</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={newX}
                      onChange={(e) => setNewX(e.target.checked)}
                      className="rounded bg-slate-950 text-cyan-400 w-3.5 h-3.5"
                    />
                    <span>x</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={handleAddEntry}
                  className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>添加 ACL 规则</span>
                </button>
              </div>
            </div>
          </div>

          {/* Generated setfacl bash commands */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              生成的执行命令 (setfacl)
            </span>
            <TerminalSnippet
              title="应用全部 ACL 规则"
              command={generatedCommands.join(' && ')}
            />
          </div>
        </div>

        {/* Right: getfacl visualizer (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                getfacl 终端查询模拟视图
              </span>
              <span className="text-xs font-mono text-cyan-400">$ getfacl</span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 font-mono text-xs leading-relaxed text-slate-300 whitespace-pre overflow-x-auto">
              {simulatedGetfacl}
            </div>

            <div className="text-xs text-slate-400 space-y-2 pt-2 border-t border-slate-850">
              <div className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                <span>注：ACL 标志符号提示</span>
              </div>
              <p>
                当文件启用了额外 ACL 时，使用常规 <code className="text-white">ls -l</code> 查看，权限末尾会出现一个加号 <code className="text-cyan-300 font-bold">+</code>（如 <code className="text-amber-300">-rw-r-----+</code>），表示该文件正处于 ACL 高级访问控制列表中！
              </p>
            </div>
          </div>

          {/* Handy ACL Command Quick Sheet */}
          <div className="space-y-3">
            <TerminalSnippet
              title="清空文件所有 ACL 规则"
              command="setfacl -b data_report.xlsx"
            />
            <TerminalSnippet
              title="设置目录默认继承 ACL (-d)"
              command="setfacl -d -m g:devteam:rwx /data/projects"
              output="添加 -d (default) 后，该目录下未来创建的所有新文件都会自动继承此 ACL"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
