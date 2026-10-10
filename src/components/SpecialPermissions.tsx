import { useState } from 'react';
import { TerminalSnippet } from './TerminalSnippet';
import { ShieldAlert, AlertTriangle, Key, Users, Lock, Sparkles } from 'lucide-react';

export function SpecialPermissions() {
  // Interactive test state for lowercase vs uppercase demonstration
  const [testUserExec, setTestUserExec] = useState(true);
  const [testSuid, setTestSuid] = useState(true);

  const [testGroupExec, setTestGroupExec] = useState(true);
  const [testSgid, setTestSgid] = useState(true);

  const [testOthersExec, setTestOthersExec] = useState(true);
  const [testSticky, setTestSticky] = useState(true);

  const suidDisplay = testSuid ? (testUserExec ? 's (小写)' : 'S (大写)') : testUserExec ? 'x' : '-';
  const sgidDisplay = testSgid ? (testGroupExec ? 's (小写)' : 'S (大写)') : testGroupExec ? 'x' : '-';
  const stickyDisplay = testSticky ? (testOthersExec ? 't (小写)' : 'T (大写)') : testOthersExec ? 'x' : '-';

  return (
    <div className="space-y-8">
      {/* Intro */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-4">
        <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Key className="w-6 h-6 text-cyan-400" />
          特殊权限深度剖析：SUID / SGID / Sticky Bit
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed max-w-4xl">
          除了基础的 rwx 三重权限，Linux 内核还提供了第 4 个八进制位用于应对进程特权提升、多用户团队目录继承和公共缓冲区防删保护等复杂安全场景。
        </p>
      </div>

      {/* 3 Core Special Bits Deep-Dive Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SUID Card */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-850 pb-3">
            <div>
              <span className="font-mono text-xl font-bold text-rose-400">SUID (SetUID)</span>
              <div className="text-xs text-slate-400 font-mono mt-0.5">八进制: 4000 (u+s)</div>
            </div>
            <span className="p-2 bg-rose-500/10 text-rose-400 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </span>
          </div>

          <div className="space-y-3 text-xs leading-relaxed text-slate-300">
            <p>
              <strong className="text-white">生效对象：</strong>
              <span className="text-rose-300 font-medium">仅对二进制可执行程序有效</span>（Linux 内核默认对 Shell 脚本忽略 SUID 以防漏洞）。
            </p>
            <p>
              <strong className="text-white">内核机制：</strong>
              当普通用户运行该程序时，进程的<span className="text-white font-semibold">有效用户 ID (EUID)</span> 临时变更为<span className="text-rose-300 font-semibold">该文件所有者的 UID</span>，获得属主特权。
            </p>
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-850 space-y-1">
              <div className="text-amber-300 font-semibold">经典实名案例：/usr/bin/passwd</div>
              <div className="font-mono text-[11px] text-slate-400">
                -rwsr-xr-x 1 root root /usr/bin/passwd
              </div>
              <p className="text-[11px] text-slate-400">
                普通用户没有 /etc/shadow 的写权限，但 passwd 带有 SUID，运行时代替用户以 root 身份安全写入哈希。
              </p>
            </div>
          </div>

          <div className="pt-2">
            <TerminalSnippet
              title="设置命令"
              command="chmod u+s /path/to/binary # 或 chmod 4755 /path/to/binary"
            />
          </div>
        </div>

        {/* SGID Card */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-850 pb-3">
            <div>
              <span className="font-mono text-xl font-bold text-amber-400">SGID (SetGID)</span>
              <div className="text-xs text-slate-400 font-mono mt-0.5">八进制: 2000 (g+s)</div>
            </div>
            <span className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
              <Users className="w-5 h-5" />
            </span>
          </div>

          <div className="space-y-3 text-xs leading-relaxed text-slate-300">
            <p>
              <strong className="text-white">生效对象：</strong>
              <span className="text-amber-300 font-medium">可执行文件 OR 目录</span>（在目录上极其常用）。
            </p>
            <p>
              <strong className="text-white">作用于目录的神奇特性：</strong>
              在带有 SGID 的目录下，任何具备写权限的用户新建的文件和子目录，其<span className="text-white font-semibold">所属组均会自动继承父目录的所属组</span>，而不是创建者的当前主组！
            </p>
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-850 space-y-1">
              <div className="text-amber-300 font-semibold">团队多人协同必备：</div>
              <div className="font-mono text-[11px] text-slate-400">
                drwxrwsr-x 1 root devteam /data/projects
              </div>
              <p className="text-[11px] text-slate-400">
                解决 Alice 创建的文件 Bob 无法修改的团队协作痛点，实现自动组对齐。
              </p>
            </div>
          </div>

          <div className="pt-2">
            <TerminalSnippet
              title="设置命令"
              command="chmod g+s /data/projects # 或 chmod 2775 /data/projects"
            />
          </div>
        </div>

        {/* Sticky Bit Card */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-850 pb-3">
            <div>
              <span className="font-mono text-xl font-bold text-cyan-400">Sticky Bit (粘滞位)</span>
              <div className="text-xs text-slate-400 font-mono mt-0.5">八进制: 1000 (+t)</div>
            </div>
            <span className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg">
              <Lock className="w-5 h-5" />
            </span>
          </div>

          <div className="space-y-3 text-xs leading-relaxed text-slate-300">
            <p>
              <strong className="text-white">生效对象：</strong>
              <span className="text-cyan-300 font-medium">主要作用于公共目录</span>。
            </p>
            <p>
              <strong className="text-white">防删保护机制：</strong>
              即使目录向所有人开放完全可写权限 (777)，开启粘滞位后，<span className="text-white font-semibold">只有文件的属主、目录的属主或 root 超级用户</span>才有权删除或重命名其中的文件！
            </p>
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-850 space-y-1">
              <div className="text-cyan-300 font-semibold">经典系统目录：/tmp 与 /var/tmp</div>
              <div className="font-mono text-[11px] text-slate-400">
                drwxrwxrwt 1 root root /tmp
              </div>
              <p className="text-[11px] text-slate-400">
                允许所有程序自由建立临时通信数据，但绝不允许普通用户恶意删除其他服务的文件。
              </p>
            </div>
          </div>

          <div className="pt-2">
            <TerminalSnippet
              title="设置命令"
              command="chmod +t /tmp # 或 chmod 1777 /tmp"
            />
          </div>
        </div>
      </div>

      {/* Interactive S/s and T/t Case Demystifier */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              大小写符号之谜：为什么有时是小写 s/t，有时是大写 S/T？
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              核心法则：小写字母 (s, t) 代表底层具备执行位 (x)；大写字母 (S, T) 属于警告状态，代表缺失执行位 (x)！
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* User SUID test */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-300">属主位 (u) 符号状态</span>
              <span className="font-mono text-sm font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                {suidDisplay}
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white">
                <span>开启 SUID (4000)</span>
                <input
                  type="checkbox"
                  checked={testSuid}
                  onChange={(e) => setTestSuid(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-rose-500 focus:ring-rose-400 w-4 h-4"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white">
                <span>具备基础执行位 (+x)</span>
                <input
                  type="checkbox"
                  checked={testUserExec}
                  onChange={(e) => setTestUserExec(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-rose-500 focus:ring-rose-400 w-4 h-4"
                />
              </label>
            </div>
            <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-850">
              {testSuid && !testUserExec ? (
                <span className="text-amber-300 font-medium">
                  ⚠️ 出现大写 S：程序设置了 SUID 却无法执行，属于无意义或配置错误的无效状态！
                </span>
              ) : testSuid ? (
                <span className="text-emerald-400 font-medium">
                  ✅ 正常小写 s：拥有执行权且附带 SUID 提权能力。
                </span>
              ) : (
                '未开启特殊权限，常规显示。'
              )}
            </p>
          </div>

          {/* Group SGID test */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-300">组位 (g) 符号状态</span>
              <span className="font-mono text-sm font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                {sgidDisplay}
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white">
                <span>开启 SGID (2000)</span>
                <input
                  type="checkbox"
                  checked={testSgid}
                  onChange={(e) => setTestSgid(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-400 w-4 h-4"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white">
                <span>具备基础执行位 (+x)</span>
                <input
                  type="checkbox"
                  checked={testGroupExec}
                  onChange={(e) => setTestGroupExec(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-400 w-4 h-4"
                />
              </label>
            </div>
            <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-850">
              {testSgid && !testGroupExec ? (
                <span className="text-amber-300 font-medium">
                  ⚠️ 出现大写 S：目录或文件开启了 SGID 但缺少 x 位，目录无法穿透！
                </span>
              ) : testSgid ? (
                <span className="text-emerald-400 font-medium">
                  ✅ 正常小写 s：组执行权正常且启用了组继承。
                </span>
              ) : (
                '未开启特殊权限，常规显示。'
              )}
            </p>
          </div>

          {/* Others Sticky test */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-cyan-300">其他人位 (o) 符号状态</span>
              <span className="font-mono text-sm font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                {stickyDisplay}
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white">
                <span>开启 Sticky Bit (1000)</span>
                <input
                  type="checkbox"
                  checked={testSticky}
                  onChange={(e) => setTestSticky(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-400 w-4 h-4"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white">
                <span>具备基础执行位 (+x)</span>
                <input
                  type="checkbox"
                  checked={testOthersExec}
                  onChange={(e) => setTestOthersExec(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-400 w-4 h-4"
                />
              </label>
            </div>
            <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-850">
              {testSticky && !testOthersExec ? (
                <span className="text-amber-300 font-medium">
                  ⚠️ 出现大写 T：启用了粘滞位但其他人连进入目录的 x 都没有，多为误配。
                </span>
              ) : testSticky ? (
                <span className="text-emerald-400 font-medium">
                  ✅ 正常小写 t：标准粘滞位防删保护目录状态。
                </span>
              ) : (
                '未开启特殊权限，常规显示。'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Security Auditing Commands Section */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-4">
        <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm uppercase tracking-wider">
          <AlertTriangle className="w-4 h-4" />
          系统安全审计：全盘检索潜在高危特殊权限文件
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          黑客入侵后常通过留下带有 SUID 的后门程序（如隐藏的 /tmp/bash）实现持久化无密码提权。系统管理员应定期扫描系统：
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <TerminalSnippet
            title="查找全盘所有 SUID 提权文件"
            command="find / -perm -4000 -type f -exec ls -ld {} \; 2>/dev/null"
          />
          <TerminalSnippet
            title="查找所有人可写且无 Sticky 的高危目录"
            command="find / -perm -0002 -type d ! -perm -1000 -exec ls -ld {} \; 2>/dev/null"
          />
        </div>
      </div>
    </div>
  );
}
