import { useState } from 'react';
import { Folder, FileCode, CheckCircle2, XCircle, ArrowRight, Lightbulb } from 'lucide-react';
import { TerminalSnippet } from './TerminalSnippet';

interface PitfallCase {
  id: string;
  title: string;
  dirPerm: string;
  filePerm: string;
  scenario: string;
  operations: {
    command: string;
    action: string;
    success: boolean;
    output: string;
    explanation: string;
  }[];
  kernelInsight: string;
}

const PITFALL_CASES: PitfallCase[] = [
  {
    id: 'case_no_exec_dir',
    title: '案例 1: 目录有读权限 r，但没有执行权限 x (chmod 400 dir)',
    dirPerm: 'dr--r--r-- (444)',
    filePerm: '-rw-r--r-- (644)',
    scenario: '目录仅开放 r 读权限，关闭了 x 执行权限。用户尝试 cd 进入、ls 列出目录、或读取目录下文件。',
    operations: [
      {
        command: 'cd mydir',
        action: '切换进入目录',
        success: false,
        output: '-bash: cd: mydir: Permission denied',
        explanation: '目录缺少 x (执行/穿透) 权限，无法将工作目录切换至此。',
      },
      {
        command: 'ls mydir',
        action: '查看目录文件名',
        success: true,
        output: 'file1.txt  file2.txt',
        explanation: '目录具有 r 权限，因此可以读取目录内部的目录项 (文件名列表)。',
      },
      {
        command: 'ls -l mydir',
        action: '获取详细属性 (ls -l)',
        success: false,
        output: 'ls: cannot access "mydir/file1.txt": Permission denied\n-????????? ? ? ? ? ? file1.txt',
        explanation: '经典怪象！没有 x 权限无法穿透解析 inode 元数据，ls -l 会出现一连串问号 ????，无法获取大小、属主和时间戳！',
      },
      {
        command: 'cat mydir/file1.txt',
        action: '读取目录内文件内容',
        success: false,
        output: 'cat: mydir/file1.txt: Permission denied',
        explanation: '无法跨越没有 x 权限的目录路径节点，直接在路径解析阶段被内核拦截。',
      },
    ],
    kernelInsight: 'Linux 目录的 x 权限被称为“搜索/遍历位 (Search/Traverse bit)”。若目录无 x 权限，任何跨越该目录的路径访问与 inode 解析都会被内核立即拒绝！',
  },
  {
    id: 'case_exec_only_dir',
    title: '案例 2: 目录只有执行权限 x，但没有读权限 r (chmod 111 dir)',
    dirPerm: 'd--x--x--x (111)',
    filePerm: '-rw-r--r-- (644)',
    scenario: '目录仅开放 x 权限，关闭了 r 读权限。用户不能列出文件名，但若知道精确文件名能否读取？',
    operations: [
      {
        command: 'cd mydir',
        action: '切换进入目录',
        success: true,
        output: '成功切换路径: /home/user/mydir',
        explanation: '具备 x 权限，成功进入目录。',
      },
      {
        command: 'ls mydir',
        action: '尝试列出文件名 (ls)',
        success: false,
        output: 'ls: cannot open directory "mydir": Permission denied',
        explanation: '缺少 r 权限，不能读取目录自身包含的文件名清单。',
      },
      {
        command: 'cat mydir/file1.txt',
        action: '已知确切文件名直接读取',
        success: true,
        output: 'Hello, Linux permission world!\nDatabase connection: SUCCESS',
        explanation: '神奇现象！只要具备目录 x 权限且知道准确文件名，就可以直接穿透目录读取内部文件！许多系统服务（如私有临时目录）会使用该特性隐藏文件列表但允许精准访问。',
      },
    ],
    kernelInsight: '“黑匣子目录模式”：目录的 r 权限控制 readdir() 读取目录项名称，而 x 权限控制 open/stat 路径解析。有 x 无 r 就像一个黑匣子，不知道名字看不到，知道名字就能直接拿！',
  },
  {
    id: 'case_delete_readonly_file',
    title: '案例 3: 目录可写，但文件是 000 / 444 只读，能否被删除？',
    dirPerm: 'drwxr-xr-x (755)',
    filePerm: '---------- (000) 或 -r--r--r-- (444)',
    scenario: '文件甚至连读写权限都没有 (000)，但当前用户是父目录的属主 (拥有父目录 w 和 x 权限)。用户执行 rm 命令。',
    operations: [
      {
        command: 'cat secret.txt',
        action: '读取 000 文件',
        success: false,
        output: 'cat: secret.txt: Permission denied',
        explanation: '文件自身没有 r 权限，无法读取内容。',
      },
      {
        command: 'echo "hack" > secret.txt',
        action: '向 000 文件写入',
        success: false,
        output: '-bash: secret.txt: Permission denied',
        explanation: '文件自身没有 w 权限，无法修改内容。',
      },
      {
        command: 'rm secret.txt',
        action: '删除该 000 文件',
        success: true,
        output: 'rm: remove write-protected regular empty file "secret.txt"? y\n(文件被成功彻底删除!)',
        explanation: '核心知识点！删除文件并不是修改文件本身，而是从父目录的目录项中剔除一个链接记录 (unlink)！只要对父目录有 w 和 x 权限，就能删除里面的任何文件，即便该文件权限是 000！',
      },
    ],
    kernelInsight: '“删文件看父目录，改内容看文件自身”。这也是为什么 Linux 需要 Sticky Bit (粘滞位) 的原因：若没有粘滞位，在公共可写目录 (/tmp) 里，任何人都能删掉别人只读甚至 000 的重要文件！',
  },
  {
    id: 'case_cant_delete_writable_file',
    title: '案例 4: 文件是 777 完全可写，但父目录只读 555，能否删除？',
    dirPerm: 'dr-xr-xr-x (555)',
    filePerm: '-rwxrwxrwx (777)',
    scenario: '文件本身拥有最高的 777 权限，但其所在父目录是只读的 (555，缺少 w 权限)。用户尝试删除该文件。',
    operations: [
      {
        command: 'cat app.log',
        action: '读取 777 文件',
        success: true,
        output: '[2026-10-09] Log entries normal...',
        explanation: '文件具备 r 权限，读取正常。',
      },
      {
        command: 'echo "new log" >> app.log',
        action: '写入追加内容',
        success: true,
        output: '写入成功，文件内容已追加',
        explanation: '文件具备 w 权限，修改内容正常。',
      },
      {
        command: 'rm app.log',
        action: '删除该 777 文件',
        success: false,
        output: 'rm: cannot remove "app.log": Permission denied',
        explanation: '被拒绝！因为父目录没有 w 权限，内核拒绝修改父目录的 inode 结构，即使文件自身是 777 也绝不可能被删除！',
      },
    ],
    kernelInsight: '再次印证铁律：能否修改文件内容取决于文件自身的 w 位；能否创建、重命名、删除文件取决于父目录的 w 位！',
  },
];

export function FileVsDir() {
  const [selectedCaseId, setSelectedCaseId] = useState(PITFALL_CASES[0].id);
  const activeCase = PITFALL_CASES.find((c) => c.id === selectedCaseId) || PITFALL_CASES[0];

  return (
    <div className="space-y-8">
      {/* Concept Comparison Matrix */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-6">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
            文件权限 vs 目录权限：本质语义差异
          </h2>
          <p className="text-sm text-slate-300 mt-1 max-w-3xl">
            Linux 中相同的 r / w / x 符号，作用于普通文件与作用于目录时，底层对应完全不同的系统调用与安全语义。
          </p>
        </div>

        {/* Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Read (r) */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <span className="font-mono text-lg font-bold text-cyan-400">读权限 r (4)</span>
              <span className="text-xs text-slate-400 font-mono">Read Bit</span>
            </div>
            <div className="space-y-3 text-xs leading-relaxed">
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850">
                <div className="font-semibold text-amber-300 flex items-center gap-1.5 mb-1">
                  <FileCode className="w-3.5 h-3.5" />
                  作用于文件 (Regular File)
                </div>
                <p className="text-slate-300">
                  允许查看文件中的数据内容。对应系统命令：<code className="text-cyan-300 font-mono">cat</code>, <code className="text-cyan-300 font-mono">less</code>, <code className="text-cyan-300 font-mono">grep</code>, <code className="text-cyan-300 font-mono">head</code>。
                </p>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850">
                <div className="font-semibold text-cyan-300 flex items-center gap-1.5 mb-1">
                  <Folder className="w-3.5 h-3.5" />
                  作用于目录 (Directory)
                </div>
                <p className="text-slate-300">
                  允许读取目录内的<span className="text-white font-semibold">文件名列表</span>。对应系统命令：<code className="text-cyan-300 font-mono">ls</code>。注意：若无 x 权限，无法获取文件的详细属性 (ls -l)。
                </p>
              </div>
            </div>
          </div>

          {/* Write (w) */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <span className="font-mono text-lg font-bold text-amber-400">写权限 w (2)</span>
              <span className="text-xs text-slate-400 font-mono">Write Bit</span>
            </div>
            <div className="space-y-3 text-xs leading-relaxed">
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850">
                <div className="font-semibold text-amber-300 flex items-center gap-1.5 mb-1">
                  <FileCode className="w-3.5 h-3.5" />
                  作用于文件 (Regular File)
                </div>
                <p className="text-slate-300">
                  允许修改或追加文件中的内容。对应系统命令：<code className="text-cyan-300 font-mono">vim</code>, <code className="text-cyan-300 font-mono">nano</code>, <code className="text-cyan-300 font-mono">echo &gt;&gt;</code>。<span className="text-rose-400 font-medium">注意：不能控制文件是否可被删除！</span>
                </p>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850">
                <div className="font-semibold text-cyan-300 flex items-center gap-1.5 mb-1">
                  <Folder className="w-3.5 h-3.5" />
                  作用于目录 (Directory)
                </div>
                <p className="text-slate-300">
                  允许在目录中<span className="text-white font-semibold">新建、重命名、删除文件</span>！对应命令：<code className="text-cyan-300 font-mono">touch</code>, <code className="text-cyan-300 font-mono">rm</code>, <code className="text-cyan-300 font-mono">mv</code>。需配合 x 权限生效。
                </p>
              </div>
            </div>
          </div>

          {/* Execute (x) */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <span className="font-mono text-lg font-bold text-emerald-400">执行权限 x (1)</span>
              <span className="text-xs text-slate-400 font-mono">Execute Bit</span>
            </div>
            <div className="space-y-3 text-xs leading-relaxed">
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850">
                <div className="font-semibold text-amber-300 flex items-center gap-1.5 mb-1">
                  <FileCode className="w-3.5 h-3.5" />
                  作用于文件 (Regular File)
                </div>
                <p className="text-slate-300">
                  允许将该文件作为二进制程序或 Shell 脚本载入内存执行。对应命令：<code className="text-cyan-300 font-mono">./script.sh</code>。
                </p>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850">
                <div className="font-semibold text-cyan-300 flex items-center gap-1.5 mb-1">
                  <Folder className="w-3.5 h-3.5" />
                  作用于目录 (Directory)
                </div>
                <p className="text-slate-300">
                  允许<span className="text-white font-semibold">进入目录 (Search/Traverse)</span>。对应命令：<code className="text-cyan-300 font-mono">cd</code>。没有 x 权限，任何跨越该目录的路径都会被拦截！
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Pitfall Cases Sandbox */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            实战陷阱案例沙箱演练
          </h3>
          <span className="text-xs text-slate-400">选择典型生产疑难场景进行动态剖析</span>
        </div>

        {/* Case Selector Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {PITFALL_CASES.map((item) => {
            const isSelected = item.id === selectedCaseId;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedCaseId(item.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-cyan-500/15 border-cyan-500/50 text-white shadow-sm'
                    : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="font-mono text-xs text-cyan-300 font-semibold truncate mb-1">
                  {item.title.split(':')[0]}
                </div>
                <div className="text-xs text-slate-300 line-clamp-1">
                  {item.title.split(':')[1] || item.title}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Case Detail Deck */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h4 className="text-lg font-bold text-white">{activeCase.title}</h4>
            <p className="text-xs text-slate-300 mt-1">{activeCase.scenario}</p>
            <div className="flex flex-wrap gap-4 mt-3 text-xs font-mono">
              <span className="text-slate-400">
                父目录权限: <strong className="text-amber-300">{activeCase.dirPerm}</strong>
              </span>
              <span className="text-slate-400">
                内部文件权限: <strong className="text-cyan-300">{activeCase.filePerm}</strong>
              </span>
            </div>
          </div>

          {/* Simulated Operations Grid */}
          <div className="space-y-4">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              命令执行结果与内核判定过程
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeCase.operations.map((op, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border space-y-2.5 ${
                    op.success
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-100'
                      : 'bg-rose-950/20 border-rose-500/30 text-rose-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {op.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <span className="font-mono text-xs font-semibold text-white">
                        $ {op.command}
                      </span>
                    </div>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                        op.success
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {op.success ? '执行成功 (0)' : '拒绝访问 (Denied)'}
                    </span>
                  </div>

                  <div className="font-mono text-xs bg-slate-950/80 p-2.5 rounded border border-slate-850 text-slate-300 whitespace-pre">
                    {op.output}
                  </div>

                  <p className="text-xs text-slate-300 leading-normal">
                    <span className="font-semibold text-white">解释：</span>
                    {op.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Deep Insight Callout */}
          <div className="bg-cyan-950/20 border border-cyan-500/30 rounded-xl p-4 flex items-start gap-3 text-xs text-cyan-200 leading-relaxed">
            <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block mb-0.5">内核机制归纳：</span>
              {activeCase.kernelInsight}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
