import { useState } from 'react';
import { ActionType, PermissionTriple, SpecialPermissions } from '../types';
import { evaluatePOSIXAction, octalToTriple, toSymbolicString } from '../utils/permissionUtils';
import { Terminal, CheckCircle2, XCircle, ArrowRight, ShieldCheck, Play } from 'lucide-react';

export function DecisionSandbox() {
  // Actor state
  const [currentUser, setCurrentUser] = useState('alice');
  const [currentUserGroups, setCurrentUserGroups] = useState<string[]>(['developers']);
  const [isRoot, setIsRoot] = useState(false);

  // Parent directory state
  const [parentOwner, setParentOwner] = useState('deployer');
  const [parentGroup, setParentGroup] = useState('developers');
  const [parentUserPerm, setParentUserPerm] = useState<PermissionTriple>({ read: true, write: true, execute: true });
  const [parentGroupPerm, setParentGroupPerm] = useState<PermissionTriple>({ read: true, write: false, execute: true });
  const [parentOthersPerm, setParentOthersPerm] = useState<PermissionTriple>({ read: true, write: false, execute: true });
  const [parentSticky, setParentSticky] = useState(false);

  // Target file state
  const [fileOwner, setFileOwner] = useState('deployer');
  const [fileGroup, setFileGroup] = useState('developers');
  const [fileUserPerm, setFileUserPerm] = useState<PermissionTriple>({ read: true, write: true, execute: false });
  const [fileGroupPerm, setFileGroupPerm] = useState<PermissionTriple>({ read: true, write: false, execute: false });
  const [fileOthersPerm, setFileOthersPerm] = useState<PermissionTriple>({ read: false, write: false, execute: false });
  const [fileSpecial, setFileSpecial] = useState<SpecialPermissions>({ suid: false, sgid: false, sticky: false });

  // Selected action
  const [action, setAction] = useState<ActionType>('file_read');

  const actionList: { id: ActionType; label: string; desc: string; target: 'dir' | 'file' }[] = [
    { id: 'dir_enter', label: 'cd /data/project', desc: '进入父目录', target: 'dir' },
    { id: 'dir_list', label: 'ls /data/project', desc: '列出目录中文件名', target: 'dir' },
    { id: 'dir_create', label: 'touch /data/project/new.log', desc: '在目录内新建文件', target: 'dir' },
    { id: 'file_read', label: 'cat config.json', desc: '读取目标文件内容', target: 'file' },
    { id: 'file_write', label: 'echo "ok" >> config.json', desc: '修改/追加写入目标文件', target: 'file' },
    { id: 'file_execute', label: './config.json', desc: '执行目标文件作为程序', target: 'file' },
    { id: 'dir_delete', label: 'rm config.json', desc: '从父目录删除目标文件', target: 'file' },
  ];

  // Evaluate
  const result = evaluatePOSIXAction({
    currentUser,
    currentUserGroups,
    isRoot,
    action,
    parentDir: {
      owner: parentOwner,
      group: parentGroup,
      user: parentUserPerm,
      groupPerm: parentGroupPerm,
      others: parentOthersPerm,
      sticky: parentSticky,
    },
    targetFile: {
      owner: fileOwner,
      group: fileGroup,
      user: fileUserPerm,
      groupPerm: fileGroupPerm,
      others: fileOthersPerm,
      special: fileSpecial,
    },
  });

  const parentSymbolic = toSymbolicString({
    fileType: 'd',
    user: parentUserPerm,
    group: parentGroupPerm,
    others: parentOthersPerm,
    special: { suid: false, sgid: false, sticky: parentSticky },
    filename: 'project',
    owner: parentOwner,
    groupName: parentGroup,
    sizeBytes: 4096,
  });

  const fileSymbolic = toSymbolicString({
    fileType: '-',
    user: fileUserPerm,
    group: fileGroupPerm,
    others: fileOthersPerm,
    special: fileSpecial,
    filename: 'config.json',
    owner: fileOwner,
    groupName: fileGroup,
    sizeBytes: 256,
  });

  const presetScenarios = [
    {
      name: '研发日常：同组读取配置文件',
      apply: () => {
        setIsRoot(false);
        setCurrentUser('alice');
        setCurrentUserGroups(['developers']);
        setParentOwner('deployer');
        setParentGroup('developers');
        setParentUserPerm(octalToTriple(7));
        setParentGroupPerm(octalToTriple(5));
        setParentOthersPerm(octalToTriple(5));
        setParentSticky(false);
        setFileOwner('deployer');
        setFileGroup('developers');
        setFileUserPerm(octalToTriple(6));
        setFileGroupPerm(octalToTriple(4));
        setFileOthersPerm(octalToTriple(0));
        setAction('file_read');
      },
    },
    {
      name: '典型拦截：其他人尝试写保护文件',
      apply: () => {
        setIsRoot(false);
        setCurrentUser('bob');
        setCurrentUserGroups(['guest']);
        setParentOwner('deployer');
        setParentGroup('developers');
        setParentUserPerm(octalToTriple(7));
        setParentGroupPerm(octalToTriple(5));
        setParentOthersPerm(octalToTriple(5));
        setParentSticky(false);
        setFileOwner('deployer');
        setFileGroup('developers');
        setFileUserPerm(octalToTriple(6));
        setFileGroupPerm(octalToTriple(4));
        setFileOthersPerm(octalToTriple(0));
        setAction('file_write');
      },
    },
    {
      name: '公共 /tmp 粘滞位拦截删除他人文件',
      apply: () => {
        setIsRoot(false);
        setCurrentUser('eve');
        setCurrentUserGroups(['eve']);
        setParentOwner('root');
        setParentGroup('root');
        setParentUserPerm(octalToTriple(7));
        setParentGroupPerm(octalToTriple(7));
        setParentOthersPerm(octalToTriple(7));
        setParentSticky(true); // Sticky Bit enabled!
        setFileOwner('alice');
        setFileGroup('alice');
        setFileUserPerm(octalToTriple(6));
        setFileGroupPerm(octalToTriple(4));
        setFileOthersPerm(octalToTriple(4));
        setAction('dir_delete');
      },
    },
    {
      name: 'Root 超级管理员特权执行',
      apply: () => {
        setIsRoot(true);
        setCurrentUser('root');
        setCurrentUserGroups(['root']);
        setParentOwner('deployer');
        setParentGroup('developers');
        setAction('file_read');
      },
    },
  ];

  return (
    <div className="space-y-8">
      {/* Intro */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <ShieldCheck className="w-6 h-6 text-cyan-400" />
              Linux 内核 POSIX 权限判决沙箱
            </h2>
            <p className="text-sm text-slate-300 max-w-3xl">
              模拟 Linux 虚拟文件系统 (VFS) 的 DAC 鉴权流水线。自由配置主体身份、父目录与文件属性，查看内核判断各环节。
            </p>
          </div>
          {/* Quick presets */}
          <div className="flex flex-wrap gap-2">
            {presetScenarios.map((sc, i) => (
              <button
                key={i}
                onClick={sc.apply}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800/80 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-200 border border-slate-700/80 transition-colors whitespace-nowrap"
              >
                {sc.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Controls vs Result Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Controls Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: Subject (Actor / User) */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                1. 访问主体 (Current Actor / Process)
              </span>
              <label className="flex items-center gap-2 text-xs cursor-pointer text-amber-300 font-medium">
                <input
                  type="checkbox"
                  checked={isRoot}
                  onChange={(e) => {
                    setIsRoot(e.target.checked);
                    if (e.target.checked) setCurrentUser('root');
                    else setCurrentUser('alice');
                  }}
                  className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-400 w-4 h-4"
                />
                <span>切换为 Root (UID 0 特权)</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">当前操作用户名 (UID)</label>
                <input
                  type="text"
                  disabled={isRoot}
                  value={currentUser}
                  onChange={(e) => setCurrentUser(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg font-mono text-cyan-300 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">所属用户组列表 (逗号分隔)</label>
                <input
                  type="text"
                  disabled={isRoot}
                  value={currentUserGroups.join(', ')}
                  onChange={(e) =>
                    setCurrentUserGroups(
                      e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean)
                    )
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg font-mono text-cyan-300 disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Parent Directory & Target File */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                2. 目标客体与父目录属性
              </span>
              <span className="text-xs font-mono text-cyan-400">
                父目录: {parentSymbolic} | 文件: {fileSymbolic}
              </span>
            </div>

            {/* Parent Dir quick setup */}
            <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-850 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">父目录 (/data/project)</span>
                <label className="flex items-center gap-1.5 cursor-pointer text-cyan-300">
                  <input
                    type="checkbox"
                    checked={parentSticky}
                    onChange={(e) => setParentSticky(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-cyan-500 w-3.5 h-3.5"
                  />
                  <span>Sticky Bit (+t 粘滞位)</span>
                </label>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px]">属主:</span>
                  <input
                    type="text"
                    value={parentOwner}
                    onChange={(e) => setParentOwner(e.target.value)}
                    className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-slate-200"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">属组:</span>
                  <input
                    type="text"
                    value={parentGroup}
                    onChange={(e) => setParentGroup(e.target.value)}
                    className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-slate-200"
                  />
                </div>
                <div className="col-span-2 flex items-center justify-end gap-2 pt-3">
                  <button
                    onClick={() => {
                      setParentUserPerm(octalToTriple(7));
                      setParentGroupPerm(octalToTriple(5));
                      setParentOthersPerm(octalToTriple(5));
                    }}
                    className="px-2 py-1 bg-slate-850 rounded hover:bg-slate-800 text-slate-300"
                  >
                    设为 755
                  </button>
                  <button
                    onClick={() => {
                      setParentUserPerm(octalToTriple(7));
                      setParentGroupPerm(octalToTriple(7));
                      setParentOthersPerm(octalToTriple(7));
                    }}
                    className="px-2 py-1 bg-slate-850 rounded hover:bg-slate-800 text-slate-300"
                  >
                    设为 777
                  </button>
                  <button
                    onClick={() => {
                      setParentUserPerm(octalToTriple(7));
                      setParentGroupPerm(octalToTriple(0));
                      setParentOthersPerm(octalToTriple(0));
                    }}
                    className="px-2 py-1 bg-slate-850 rounded hover:bg-slate-800 text-slate-300"
                  >
                    设为 700
                  </button>
                </div>
              </div>
            </div>

            {/* Target File quick setup */}
            <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-850 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">目标文件 (config.json)</span>
                <span className="font-mono text-cyan-400 text-[11px]">{fileSymbolic}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px]">属主:</span>
                  <input
                    type="text"
                    value={fileOwner}
                    onChange={(e) => setFileOwner(e.target.value)}
                    className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-slate-200"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">属组:</span>
                  <input
                    type="text"
                    value={fileGroup}
                    onChange={(e) => setFileGroup(e.target.value)}
                    className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-slate-200"
                  />
                </div>
                <div className="col-span-2 flex items-center justify-end gap-2 pt-3">
                  <button
                    onClick={() => {
                      setFileUserPerm(octalToTriple(6));
                      setFileGroupPerm(octalToTriple(4));
                      setFileOthersPerm(octalToTriple(4));
                    }}
                    className="px-2 py-1 bg-slate-850 rounded hover:bg-slate-800 text-slate-300"
                  >
                    设为 644
                  </button>
                  <button
                    onClick={() => {
                      setFileUserPerm(octalToTriple(6));
                      setFileGroupPerm(octalToTriple(0));
                      setFileOthersPerm(octalToTriple(0));
                    }}
                    className="px-2 py-1 bg-slate-850 rounded hover:bg-slate-800 text-slate-300"
                  >
                    设为 600
                  </button>
                  <button
                    onClick={() => {
                      setFileUserPerm(octalToTriple(7));
                      setFileGroupPerm(octalToTriple(5));
                      setFileOthersPerm(octalToTriple(5));
                    }}
                    className="px-2 py-1 bg-slate-850 rounded hover:bg-slate-800 text-slate-300"
                  >
                    设为 755
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Select Action */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-3">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              3. 选择尝试执行的 Linux 操作 (Action)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {actionList.map((act) => {
                const isSelected = action === act.id;
                return (
                  <button
                    key={act.id}
                    onClick={() => setAction(act.id)}
                    className={`p-3 rounded-lg border text-left font-mono transition-all ${
                      isSelected
                        ? 'bg-cyan-500/15 border-cyan-500/60 text-white shadow-sm'
                        : 'bg-slate-950/60 border-slate-850 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-semibold text-cyan-300 flex items-center justify-between">
                      <span>$ {act.label}</span>
                      <Play className="w-3 h-3 text-cyan-400" />
                    </div>
                    <div className="text-[11px] text-slate-400 font-sans mt-0.5">{act.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Evaluation Output Pipeline (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Result Banner */}
          <div
            className={`p-5 rounded-2xl border transition-all ${
              result.allowed
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-100 shadow-lg'
                : 'bg-rose-950/30 border-rose-500/40 text-rose-100 shadow-lg'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {result.allowed ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-400" />
                )}
                <span className="font-bold text-lg text-white">
                  {result.allowed ? '允许执行 (SUCCESS)' : '拒绝访问 (PERMISSION DENIED)'}
                </span>
              </div>
              <span className="font-mono text-xs px-2 py-1 rounded bg-slate-950/60 font-semibold">
                Exit: {result.exitCode}
              </span>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed mt-2">{result.reason}</p>

            <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-300">
              <span className="text-slate-400 font-sans">内核规范条目: </span>
              {result.kernelRule}
            </div>
          </div>

          {/* Step-by-Step Decision Pipeline */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                内核 DAC 鉴权流水线推演
              </span>
              <span className="text-xs text-slate-400">共 {result.steps.length} 个判定点</span>
            </div>

            <div className="space-y-3">
              {result.steps.map((st, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                    st.passed
                      ? 'bg-slate-950/80 border-emerald-500/30'
                      : 'bg-slate-950/80 border-rose-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-white flex items-center gap-1.5">
                      {st.passed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      )}
                      {st.title}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        st.passed
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {st.passed ? 'PASSED' : 'DENIED'}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">{st.description}</p>
                  {st.terminalMessage && (
                    <div className="font-mono text-[11px] text-rose-300 bg-rose-500/10 p-1.5 rounded border border-rose-500/20">
                      $ {st.terminalMessage}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quick takeaway tip */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 leading-relaxed flex items-start gap-2.5">
            <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p>
              <strong className="text-slate-200">POSIX 鉴权核心法则：</strong>
              若用户是文件的属主，内核<strong>只看属主位</strong>；即便属主位只有只读 (r--)，而组权限开放了可写 (rw-)，内核也绝不会向组权限溢出，操作依然会被拦截！
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
