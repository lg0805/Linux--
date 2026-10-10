import { useState } from 'react';
import {
  FileType,
  FullPermissionState,
} from '../types';
import {
  FILE_TYPE_NAMES,
  toSymbolicString,
  toOctalString,
  toBinaryString,
  parseOctalInput,
  parseSymbolicInput,
  tripleToOctal,
  specialToOctal,
} from '../utils/permissionUtils';
import { TerminalSnippet } from './TerminalSnippet';
import { PRESET_PERMISSIONS } from '../data/cheatsheetData';
import { Info, Sparkles, Shield, User, Users, Globe, Key } from 'lucide-react';

interface CalculatorProps {
  state: FullPermissionState;
  onChange: (newState: FullPermissionState) => void;
}

export function Calculator({ state, onChange }: CalculatorProps) {
  const [octalText, setOctalText] = useState(toOctalString(state));
  const [symbolicText, setSymbolicText] = useState(toSymbolicString(state));
  const [inputError, setInputError] = useState<string | null>(null);

  // Sync text inputs when state changes from outside
  const currentOctal = toOctalString(state);
  const currentSymbolic = toSymbolicString(state);
  const currentBinary = toBinaryString(state);

  const handleTogglePerm = (
    category: 'user' | 'group' | 'others',
    bit: 'read' | 'write' | 'execute'
  ) => {
    const updated = {
      ...state,
      [category]: {
        ...state[category],
        [bit]: !state[category][bit],
      },
    };
    onChange(updated);
    setOctalText(toOctalString(updated));
    setSymbolicText(toSymbolicString(updated));
    setInputError(null);
  };

  const handleToggleSpecial = (bit: 'suid' | 'sgid' | 'sticky') => {
    const updated = {
      ...state,
      special: {
        ...state.special,
        [bit]: !state.special[bit],
      },
    };
    onChange(updated);
    setOctalText(toOctalString(updated));
    setSymbolicText(toSymbolicString(updated));
    setInputError(null);
  };

  const handleFileTypeChange = (type: FileType) => {
    const updated = {
      ...state,
      fileType: type,
    };
    onChange(updated);
    setSymbolicText(toSymbolicString(updated));
  };

  const handleOctalInputChange = (val: string) => {
    setOctalText(val);
    const parsed = parseOctalInput(val, state);
    if (parsed) {
      onChange(parsed);
      setSymbolicText(toSymbolicString(parsed));
      setInputError(null);
    } else {
      if (val.trim().length >= 3) {
        setInputError('八进制数值格式需为 3 或 4 位数字 (如 755 或 0755，每位取值 0-7)');
      }
    }
  };

  const handleSymbolicInputChange = (val: string) => {
    setSymbolicText(val);
    const parsed = parseSymbolicInput(val, state);
    if (parsed) {
      onChange(parsed);
      setOctalText(toOctalString(parsed));
      setInputError(null);
    } else {
      if (val.trim().length >= 9) {
        setInputError('符号串格式示例：rwxr-xr-x 或 -rwxr-xr-x (共 9 或 10 字符)');
      }
    }
  };

  const applyPreset = (octal: string, type: FileType) => {
    const parsed = parseOctalInput(octal, { ...state, fileType: type });
    if (parsed) {
      onChange(parsed);
      setOctalText(toOctalString(parsed));
      setSymbolicText(toSymbolicString(parsed));
      setInputError(null);
    }
  };

  const userOctal = tripleToOctal(state.user);
  const groupOctal = tripleToOctal(state.group);
  const othersOctal = tripleToOctal(state.others);
  const specialOctal = specialToOctal(state.special);

  return (
    <div className="space-y-8">
      {/* Hero / Intro strip */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 lg:p-8 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <span>Linux 权限矩阵与双向计算器</span>
            </h1>
            <p className="text-sm lg:text-base text-slate-300 leading-relaxed">
              实时切换标准三层权限（Owner / Group / Others）与三类特殊权限位（SUID / SGID / Sticky）。
              支持八进制数字、符号字符串、二进制位的无缝双向换算与真实终端命令自动生成。
            </p>
          </div>

          {/* Quick presets tags */}
          <div className="flex flex-wrap gap-2 shrink-0">
            {PRESET_PERMISSIONS.slice(0, 5).map((preset) => (
              <button
                key={preset.octal}
                onClick={() => applyPreset(preset.octal, preset.type)}
                className="px-3 py-1.5 text-xs font-mono font-medium rounded-lg bg-slate-800/90 text-cyan-300 hover:bg-cyan-500/20 hover:text-cyan-200 border border-slate-700/60 hover:border-cyan-500/40 transition-colors whitespace-nowrap"
              >
                {preset.octal} ({preset.symbolic.slice(0, 4)}..)
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Left Matrix + Right Live Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 cols): The interactive Matrix */}
        <div className="lg:col-span-7 space-y-6">
          {/* File Type Row */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                文件类型标识 (File Type - 第 1 位)
              </label>
              <span className="text-xs font-mono text-cyan-400">
                当前: {FILE_TYPE_NAMES[state.fileType].name}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(FILE_TYPE_NAMES) as FileType[]).map((type) => {
                const isSelected = state.fileType === type;
                return (
                  <button
                    key={type}
                    onClick={() => handleFileTypeChange(type)}
                    className={`px-3 py-2 text-xs rounded-lg font-mono flex items-center justify-between border transition-all ${
                      isSelected
                        ? 'bg-cyan-500/15 border-cyan-500/60 text-cyan-300 font-semibold shadow-sm'
                        : 'bg-slate-950/50 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <span className="font-bold text-sm text-cyan-400">{type}</span>
                    <span className="truncate ml-1.5 text-[11px] font-sans">
                      {type === '-' ? '文件' : type === 'd' ? '目录' : type === 'l' ? '软链接' : type === 's' ? '套接字' : type === 'p' ? '管道' : type === 'c' ? '字符' : '块设备'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3x3 Standard Permission Matrix */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                九位基础权限矩阵 (User / Group / Others)
              </h2>
              <span className="text-xs text-slate-400">点击切换单个读写执行开关</span>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {/* Column 1: Owner (u) */}
              <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-4 space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                    <User className="w-3.5 h-3.5" />
                    <span>属主 (Owner / u)</span>
                  </div>
                  <span className="font-mono text-base font-bold text-amber-400 tabular-nums">
                    {userOctal}
                  </span>
                </div>

                <div className="space-y-2">
                  {/* Read */}
                  <button
                    onClick={() => handleTogglePerm('user', 'read')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono transition-all border ${
                      state.user.read
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-200 font-semibold'
                        : 'bg-slate-900/40 border-slate-850 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <span>读 r (4)</span>
                    <span>{state.user.read ? '开启' : '关闭'}</span>
                  </button>
                  {/* Write */}
                  <button
                    onClick={() => handleTogglePerm('user', 'write')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono transition-all border ${
                      state.user.write
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-200 font-semibold'
                        : 'bg-slate-900/40 border-slate-850 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <span>写 w (2)</span>
                    <span>{state.user.write ? '开启' : '关闭'}</span>
                  </button>
                  {/* Execute */}
                  <button
                    onClick={() => handleTogglePerm('user', 'execute')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono transition-all border ${
                      state.user.execute
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-200 font-semibold'
                        : 'bg-slate-900/40 border-slate-850 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <span>执行 x (1)</span>
                    <span>{state.user.execute ? '开启' : '关闭'}</span>
                  </button>
                </div>
              </div>

              {/* Column 2: Group (g) */}
              <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-4 space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                    <Users className="w-3.5 h-3.5" />
                    <span>所属组 (Group / g)</span>
                  </div>
                  <span className="font-mono text-base font-bold text-emerald-400 tabular-nums">
                    {groupOctal}
                  </span>
                </div>

                <div className="space-y-2">
                  {/* Read */}
                  <button
                    onClick={() => handleTogglePerm('group', 'read')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono transition-all border ${
                      state.group.read
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200 font-semibold'
                        : 'bg-slate-900/40 border-slate-850 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <span>读 r (4)</span>
                    <span>{state.group.read ? '开启' : '关闭'}</span>
                  </button>
                  {/* Write */}
                  <button
                    onClick={() => handleTogglePerm('group', 'write')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono transition-all border ${
                      state.group.write
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200 font-semibold'
                        : 'bg-slate-900/40 border-slate-850 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <span>写 w (2)</span>
                    <span>{state.group.write ? '开启' : '关闭'}</span>
                  </button>
                  {/* Execute */}
                  <button
                    onClick={() => handleTogglePerm('group', 'execute')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono transition-all border ${
                      state.group.execute
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200 font-semibold'
                        : 'bg-slate-900/40 border-slate-850 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <span>执行 x (1)</span>
                    <span>{state.group.execute ? '开启' : '关闭'}</span>
                  </button>
                </div>
              </div>

              {/* Column 3: Others (o) */}
              <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-4 space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-300">
                    <Globe className="w-3.5 h-3.5" />
                    <span>其他人 (Others / o)</span>
                  </div>
                  <span className="font-mono text-base font-bold text-purple-400 tabular-nums">
                    {othersOctal}
                  </span>
                </div>

                <div className="space-y-2">
                  {/* Read */}
                  <button
                    onClick={() => handleTogglePerm('others', 'read')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono transition-all border ${
                      state.others.read
                        ? 'bg-purple-500/15 border-purple-500/50 text-purple-200 font-semibold'
                        : 'bg-slate-900/40 border-slate-850 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <span>读 r (4)</span>
                    <span>{state.others.read ? '开启' : '关闭'}</span>
                  </button>
                  {/* Write */}
                  <button
                    onClick={() => handleTogglePerm('others', 'write')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono transition-all border ${
                      state.others.write
                        ? 'bg-purple-500/15 border-purple-500/50 text-purple-200 font-semibold'
                        : 'bg-slate-900/40 border-slate-850 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <span>写 w (2)</span>
                    <span>{state.others.write ? '开启' : '关闭'}</span>
                  </button>
                  {/* Execute */}
                  <button
                    onClick={() => handleTogglePerm('others', 'execute')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono transition-all border ${
                      state.others.execute
                        ? 'bg-purple-500/15 border-purple-500/50 text-purple-200 font-semibold'
                        : 'bg-slate-900/40 border-slate-850 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <span>执行 x (1)</span>
                    <span>{state.others.execute ? '开启' : '关闭'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Special Permissions Row (SUID / SGID / Sticky) */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-cyan-400" />
                特殊权限位 (Special Bits - 第 0 位八进制前缀)
              </label>
              <span className="font-mono text-xs text-cyan-400">
                特殊位权重总计: {specialOctal} (八进制 0{specialOctal}000)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* SUID */}
              <button
                onClick={() => handleToggleSpecial('suid')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  state.special.suid
                    ? 'bg-rose-500/15 border-rose-500/50 text-rose-200 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-sm text-rose-300">SUID (4000)</span>
                  <span className="text-[11px] font-mono">{state.special.suid ? '已启用' : '未开启'}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  u+s: 运行时以文件属主特权执行 (例如 /usr/bin/passwd)
                </p>
              </button>

              {/* SGID */}
              <button
                onClick={() => handleToggleSpecial('sgid')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  state.special.sgid
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-200 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-sm text-amber-300">SGID (2000)</span>
                  <span className="text-[11px] font-mono">{state.special.sgid ? '已启用' : '未开启'}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  g+s: 目录中新建文件自动继承目录属组 (团队协作核心)
                </p>
              </button>

              {/* Sticky Bit */}
              <button
                onClick={() => handleToggleSpecial('sticky')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  state.special.sticky
                    ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-200 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-sm text-cyan-300">Sticky Bit (1000)</span>
                  <span className="text-[11px] font-mono">{state.special.sticky ? '已启用' : '未开启'}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  +t: 只有文件所有者能删除文件 (典型如 /tmp 目录)
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Multi-format Display & Live Simulator */}
        <div className="lg:col-span-5 space-y-6">
          {/* Synchronized Representation Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-5">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              多维表示与直接输入
            </h2>

            {/* Inputs: Octal and Symbolic */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">八进制 (Octal)</label>
                <input
                  type="text"
                  value={octalText}
                  onChange={(e) => handleOctalInputChange(e.target.value)}
                  placeholder="如 755 或 0755"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg font-mono text-lg font-bold text-cyan-300 focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">符号串 (Symbolic)</label>
                <input
                  type="text"
                  value={symbolicText}
                  onChange={(e) => handleSymbolicInputChange(e.target.value)}
                  placeholder="如 -rwxr-xr-x"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg font-mono text-lg font-bold text-cyan-300 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {inputError && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2 font-mono">
                {inputError}
              </p>
            )}

            {/* Detailed Visual Anatomy of Current Symbolic String */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>字符位置解析 (Character Breakdown)</span>
                <span className="font-mono text-cyan-400">{currentSymbolic}</span>
              </div>
              <div className="flex items-center justify-between gap-1 text-center font-mono">
                {/* Type */}
                <div className="flex-1 bg-slate-900/80 p-2 rounded border border-slate-800">
                  <div className="text-lg font-bold text-cyan-400">{currentSymbolic[0]}</div>
                  <div className="text-[10px] text-slate-400 mt-1">类型</div>
                </div>
                {/* User 3 chars */}
                <div className="flex-3 bg-amber-500/10 p-2 rounded border border-amber-500/30">
                  <div className="text-lg font-bold text-amber-300 tracking-wider">
                    {currentSymbolic.substring(1, 4)}
                  </div>
                  <div className="text-[10px] text-amber-400/80 mt-1">属主 (u: {userOctal})</div>
                </div>
                {/* Group 3 chars */}
                <div className="flex-3 bg-emerald-500/10 p-2 rounded border border-emerald-500/30">
                  <div className="text-lg font-bold text-emerald-300 tracking-wider">
                    {currentSymbolic.substring(4, 7)}
                  </div>
                  <div className="text-[10px] text-emerald-400/80 mt-1">组 (g: {groupOctal})</div>
                </div>
                {/* Others 3 chars */}
                <div className="flex-3 bg-purple-500/10 p-2 rounded border border-purple-500/30">
                  <div className="text-lg font-bold text-purple-300 tracking-wider">
                    {currentSymbolic.substring(7, 10)}
                  </div>
                  <div className="text-[10px] text-purple-400/80 mt-1">其他 (o: {othersOctal})</div>
                </div>
              </div>

              {/* Binary layout */}
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1">
                <span>二进制位 (Binary):</span>
                <span className="text-slate-200 tracking-wider font-semibold">{currentBinary}</span>
              </div>
            </div>

            {/* Simulated `ls -ld` Terminal View */}
            <div className="space-y-1.5">
              <span className="text-xs font-mono text-slate-400">终端输出预览 (Simulated `ls -ld`)</span>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto whitespace-pre">
                <span className="text-cyan-400 font-bold">{currentSymbolic}</span>  1 {state.owner}  {state.groupName}  {state.sizeBytes.toString().padStart(5, ' ')} Oct 09 19:30 {state.filename}
              </div>
            </div>
          </div>

          {/* Ready-to-run Commands */}
          <div className="space-y-3">
            <TerminalSnippet
              title="应用八进制模式"
              command={`chmod ${currentOctal} ${state.filename}`}
            />
            <TerminalSnippet
              title="应用符号模式"
              command={`chmod u=${state.user.read ? 'r' : ''}${state.user.write ? 'w' : ''}${state.user.execute ? 'x' : ''},g=${state.group.read ? 'r' : ''}${state.group.write ? 'w' : ''}${state.group.execute ? 'x' : ''},o=${state.others.read ? 'r' : ''}${state.others.write ? 'w' : ''}${state.others.execute ? 'x' : ''} ${state.filename}`}
            />
            <TerminalSnippet
              title="变更属主与属组"
              command={`chown ${state.owner}:${state.groupName} ${state.filename}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
