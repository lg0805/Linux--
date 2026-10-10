import { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';

interface TerminalSnippetProps {
  command: string;
  title?: string;
  output?: string;
  className?: string;
}

export function TerminalSnippet({ command, title = '终端命令', output, className = '' }: TerminalSnippetProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = command;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`overflow-hidden rounded-xl border border-slate-800 bg-slate-950/80 shadow-md ${className}`}>
      <div className="flex items-center justify-between border-b border-slate-850 px-4 py-2.5 bg-slate-900/60">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
          </div>
          <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5 ml-2">
            <Terminal className="w-3.5 h-3.5 text-slate-400" />
            {title}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors whitespace-nowrap"
          title="复制命令"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">已复制</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>复制</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 font-mono text-sm leading-relaxed overflow-x-auto text-slate-200">
        <div className="flex items-start gap-2.5">
          <span className="text-emerald-400 select-none font-semibold">$</span>
          <span className="text-cyan-300 font-medium whitespace-pre break-all">{command}</span>
        </div>
        {output && (
          <div className="mt-2.5 pt-2.5 border-t border-slate-850 text-xs text-slate-400 leading-normal whitespace-pre font-mono">
            {output}
          </div>
        )}
      </div>
    </div>
  );
}
