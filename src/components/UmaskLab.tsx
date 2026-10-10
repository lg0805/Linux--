import { useState } from 'react';
import { calculateUmask } from '../utils/permissionUtils';
import { TerminalSnippet } from './TerminalSnippet';
import { Sliders, Sparkles, Folder, FileText, ArrowDown, HelpCircle } from 'lucide-react';

export function UmaskLab() {
  const [umaskInput, setUmaskInput] = useState<number>(0o022);

  const presets = [
    {
      value: 0o022,
      str: '022',
      label: '标准系统默认 (022)',
      desc: '文件 644 (rw-r--r--)，目录 755 (rwxr-xr-x)。组和其他人只读。',
    },
    {
      value: 0o002,
      str: '002',
      label: '多用户组协同 (002)',
      desc: '文件 664 (rw-rw-r--)，目录 775 (rwxrwxr-x)。同组成员具备写入修改权。',
    },
    {
      value: 0o027,
      str: '027',
      label: '企业生产加固 (027)',
      desc: '文件 640 (rw-r-----)，目录 750 (rwxr-x---)。彻底隔绝对外 (others) 访问。',
    },
    {
      value: 0o077,
      str: '077',
      label: '高度隔离私密 (077)',
      desc: '文件 600 (rw-------)，目录 700 (rwx------)。仅属主一人能够读写。',
    },
  ];

  const umaskCalc = calculateUmask(umaskInput);

  return (
    <div className="space-y-8">
      {/* Intro Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-4">
        <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Sliders className="w-6 h-6 text-cyan-400" />
          Umask 权限掩码推演实验室
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed max-w-4xl">
          在 Linux 中，用户使用 <code className="text-cyan-300 font-mono">touch</code> 或 <code className="text-cyan-300 font-mono">mkdir</code> 创建新对象时，并不需要手动指定权限。系统会依据当前的 <code className="text-cyan-300 font-mono">umask</code> 掩码，在最大初始基准权限中<strong>“拿掉/屏蔽”</strong>对应的权限位。
        </p>
      </div>

      {/* Preset Profiles & Interactive Selector */}
      <div className="space-y-4">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>选择典型 Umask 场景预设</span>
          <span className="font-mono text-cyan-400 text-sm">当前生效: 0{umaskCalc.umaskStr}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {presets.map((p) => {
            const isSelected = umaskInput === p.value;
            return (
              <button
                key={p.str}
                onClick={() => setUmaskInput(p.value)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-cyan-500/15 border-cyan-500/60 text-white shadow-sm'
                    : 'bg-slate-900/40 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-sm text-cyan-300 font-mono">{p.label}</span>
                  <span className="font-mono text-xs bg-slate-950 px-2 py-0.5 rounded text-cyan-400">
                    {p.str}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-snug">{p.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Side-by-side Deduction Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Directory Deduction Card */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Folder className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold text-white text-base">新建目录推演 (mkdir)</h3>
            </div>
            <span className="text-xs font-mono text-cyan-300 font-semibold bg-cyan-500/10 px-2 py-1 rounded">
              最终: {umaskCalc.dirResultStr} ({umaskCalc.dirSymbolic})
            </span>
          </div>

          <div className="space-y-4 text-xs font-mono">
            {/* Step 1: Base */}
            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-850 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[11px] font-sans">目录初始满权限基准 (Base)</span>
                <span className="text-sm font-bold text-white">0777 (rwxrwxrwx)</span>
              </div>
              <span className="text-xs text-slate-400 font-sans">目录必须具备 x 才能进入</span>
            </div>

            <div className="flex justify-center text-slate-500">
              <ArrowDown className="w-4 h-4" />
            </div>

            {/* Step 2: Mask */}
            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-850 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[11px] font-sans">减去 / 屏蔽 Umask</span>
                <span className="text-sm font-bold text-rose-400">- 0{umaskCalc.umaskStr}</span>
              </div>
              <span className="text-xs text-slate-400 font-sans">对应剥夺的权限</span>
            </div>

            <div className="flex justify-center text-slate-500">
              <ArrowDown className="w-4 h-4" />
            </div>

            {/* Step 3: Result */}
            <div className="bg-cyan-500/10 p-4 rounded-xl border border-cyan-500/30 flex items-center justify-between">
              <div>
                <span className="text-cyan-300 block text-[11px] font-sans font-semibold">生成新目录最终权限</span>
                <span className="text-base font-bold text-cyan-200">
                  {umaskCalc.dirResultStr} ({umaskCalc.dirSymbolic})
                </span>
              </div>
              <span className="text-xs text-emerald-400 font-sans font-medium">执行状态: 正常</span>
            </div>
          </div>

          <div className="pt-2">
            <span className="text-xs text-slate-400 block mb-1.5 font-mono">模拟实际生成目录:</span>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre">
              <span className="text-cyan-400 font-semibold">{umaskCalc.dirSymbolic}</span>  2 user user 4096 Oct 09 19:35 my_new_folder/
            </div>
          </div>
        </div>

        {/* Regular File Deduction Card */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white text-base">新建普通文件推演 (touch/vim)</h3>
            </div>
            <span className="text-xs font-mono text-amber-300 font-semibold bg-amber-500/10 px-2 py-1 rounded">
              最终: {umaskCalc.fileResultStr} ({umaskCalc.fileSymbolic})
            </span>
          </div>

          <div className="space-y-4 text-xs font-mono">
            {/* Step 1: Base */}
            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-850 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[11px] font-sans">文件初始满权限基准 (Base)</span>
                <span className="text-sm font-bold text-white">0666 (rw-rw-rw-)</span>
              </div>
              <span className="text-xs text-slate-400 font-sans">出于安全考虑，默认无 x 执行位</span>
            </div>

            <div className="flex justify-center text-slate-500">
              <ArrowDown className="w-4 h-4" />
            </div>

            {/* Step 2: Mask */}
            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-850 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[11px] font-sans">减去 / 屏蔽 Umask</span>
                <span className="text-sm font-bold text-rose-400">- 0{umaskCalc.umaskStr}</span>
              </div>
              <span className="text-xs text-slate-400 font-sans">内核位运算屏蔽</span>
            </div>

            <div className="flex justify-center text-slate-500">
              <ArrowDown className="w-4 h-4" />
            </div>

            {/* Step 3: Result */}
            <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/30 flex items-center justify-between">
              <div>
                <span className="text-amber-300 block text-[11px] font-sans font-semibold">生成新文件最终权限</span>
                <span className="text-base font-bold text-amber-200">
                  {umaskCalc.fileResultStr} ({umaskCalc.fileSymbolic})
                </span>
              </div>
              <span className="text-xs text-amber-400 font-sans font-medium">无默认执行位</span>
            </div>
          </div>

          <div className="pt-2">
            <span className="text-xs text-slate-400 block mb-1.5 font-mono">模拟实际生成文件:</span>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre">
              <span className="text-amber-400 font-semibold">{umaskCalc.fileSymbolic}</span>  1 user user    0 Oct 09 19:35 my_new_file.txt
            </div>
          </div>
        </div>
      </div>

      {/* Bitwise vs Arithmetic Common Interview Trap */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-4">
        <div className="flex items-center gap-2.5 text-cyan-400 font-bold text-base">
          <HelpCircle className="w-5 h-5 text-cyan-400" />
          <span>核心考点与原理：为什么 Umask 并不是简单的算术减法？</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          许多教科书将新建文件权限简化写为 <code className="text-white font-mono">666 - umask</code>。在 Umask 每一位都是偶数（如 022、002）时，结果碰巧与算术减法一致。
          但当遇到<strong>奇数掩码</strong>（例如 umask 023）时：
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="bg-rose-950/20 border border-rose-500/30 p-3.5 rounded-xl space-y-1.5">
            <span className="text-rose-400 font-bold font-sans">❌ 错误直觉 (算术相减)：</span>
            <p className="text-slate-300">
              666 - 023 = 643 (-rw-r---wx)
            </p>
            <p className="text-[11px] text-slate-400 font-sans">
              算术减法算出了奇数 3，荒谬地给其他人赋予了 x 执行权限！
            </p>
          </div>
          <div className="bg-emerald-950/20 border border-emerald-500/30 p-3.5 rounded-xl space-y-1.5">
            <span className="text-emerald-400 font-bold font-sans">✅ 内核真实逻辑 (位运算与非)：</span>
            <p className="text-slate-300">
              0666 &amp; (~0023) = 0644 (-rw-r--r--)
            </p>
            <p className="text-[11px] text-slate-400 font-sans">
              掩码 3 (011) 意为剥夺写和执行，而原本就没有执行位，因此只被剥夺写位，剩下只读 (4)！
            </p>
          </div>
        </div>
      </div>

      {/* Persistence & Config snippet */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          持久化配置：如何在系统或用户层面永久生效 Umask？
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TerminalSnippet
            title="当前会话临时修改"
            command="umask 0027"
            output="直接运行生效，仅对当前终端及其派生的子进程起作用"
          />
          <TerminalSnippet
            title="单用户持久化配置 (~/.bashrc)"
            command="echo 'umask 0027' >> ~/.bashrc && source ~/.bashrc"
            output="写入用户 profile 文件，用户每次登录终端自动加载"
          />
        </div>
      </div>
    </div>
  );
}
