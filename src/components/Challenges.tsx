import { useState } from 'react';
import { SCENARIO_CHALLENGES } from '../data/challengesData';
import { Trophy, CheckCircle2, XCircle, ArrowRight, BookOpen, AlertCircle } from 'lucide-react';
import { TerminalSnippet } from './TerminalSnippet';

export function Challenges() {
  const [activeChallengeId, setActiveChallengeId] = useState(SCENARIO_CHALLENGES[0].id);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [solvedChallenges, setSolvedChallenges] = useState<Record<string, boolean>>({});

  const challenge = SCENARIO_CHALLENGES.find((c) => c.id === activeChallengeId) || SCENARIO_CHALLENGES[0];
  const solvedCount = Object.values(solvedChallenges).filter(Boolean).length;

  const handleSelectOption = (idx: number) => {
    setSelectedOptionIdx(idx);
    if (challenge.options[idx].isCorrect) {
      setSolvedChallenges((prev) => ({ ...prev, [challenge.id]: true }));
    }
  };

  const handleSwitchChallenge = (id: string) => {
    setActiveChallengeId(id);
    setSelectedOptionIdx(null);
  };

  return (
    <div className="space-y-8">
      {/* Header & Score Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 lg:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1 max-w-2xl">
          <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Trophy className="w-6 h-6 text-amber-400" />
            Linux 权限排错与实战演练题库
          </h2>
          <p className="text-sm text-slate-300">
            精选真实生产环境中最高频的权限疑难杂症，通过实际故障排查掌握最小权限安全法则。
          </p>
        </div>

        {/* Progress Tracker */}
        <div className="bg-slate-950 px-5 py-3 rounded-xl border border-slate-800 flex items-center gap-4 shrink-0">
          <div className="text-right">
            <div className="text-xs text-slate-400">已攻克挑战</div>
            <div className="text-lg font-bold font-mono text-cyan-400">
              {solvedCount} / {SCENARIO_CHALLENGES.length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-cyan-500/30 flex items-center justify-center font-mono font-bold text-sm text-cyan-300 bg-cyan-500/10">
            {Math.round((solvedCount / SCENARIO_CHALLENGES.length) * 100)}%
          </div>
        </div>
      </div>

      {/* Challenge Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {SCENARIO_CHALLENGES.map((ch, idx) => {
          const isSelected = ch.id === challenge.id;
          const isSolved = solvedChallenges[ch.id];
          return (
            <button
              key={ch.id}
              onClick={() => handleSwitchChallenge(ch.id)}
              className={`p-4 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-cyan-500/15 border-cyan-500/60 text-white shadow-sm'
                  : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-mono text-cyan-400 font-semibold">
                  0{idx + 1}. {ch.badge}
                </span>
                {isSolved ? (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    已通过
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-500">待挑战</span>
                )}
              </div>
              <h3 className="font-semibold text-xs text-slate-200 line-clamp-1">{ch.title}</h3>
            </button>
          );
        })}
      </div>

      {/* Active Challenge Card */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-6">
        {/* Title and Setup */}
        <div className="space-y-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
              {challenge.badge}
            </span>
            <h3 className="text-xl font-bold text-white">{challenge.title}</h3>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">{challenge.description}</p>

          {/* Current Environment Badge */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-500 block text-[10px] font-sans">目标路径:</span>
              <span className="text-cyan-300 font-semibold">{challenge.currentSetup.path}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-sans">当前权限:</span>
              <span className="text-amber-300 font-semibold">{challenge.currentSetup.currentPermOctal}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-sans">属主与属组:</span>
              <span className="text-slate-300">
                {challenge.currentSetup.owner}:{challenge.currentSetup.group}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-sans">执行主体:</span>
              <span className="text-slate-300">{challenge.currentSetup.currentUser}</span>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300">故障排查目标：</span>
              {challenge.goal}
            </div>
          </div>
        </div>

        {/* Options to Choose */}
        <div className="space-y-3">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
            请选择最合规、最安全的解决命令或答案：
          </span>

          <div className="space-y-2.5">
            {challenge.options.map((opt, idx) => {
              const isSelected = selectedOptionIdx === idx;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  className={`w-full p-4 rounded-xl border text-left font-mono text-xs transition-all ${
                    isSelected
                      ? opt.isCorrect
                        ? 'bg-emerald-950/30 border-emerald-500/60 text-emerald-200 shadow-md'
                        : 'bg-rose-950/30 border-rose-500/60 text-rose-200 shadow-md'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-cyan-300">$ {opt.command}</span>
                    {isSelected && (
                      <span className="font-sans font-semibold flex items-center gap-1">
                        {opt.isCorrect ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span className="text-emerald-400">正确判定</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-rose-400" />
                            <span className="text-rose-400">错误或存在安全隐患</span>
                          </>
                        )}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <p className="mt-2 text-xs font-sans text-slate-300 border-t border-slate-800/80 pt-2 leading-relaxed">
                      {opt.explanation}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Detailed Walkthrough (Revealed once answered or requested) */}
        {selectedOptionIdx !== null && (
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3 text-xs leading-relaxed">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold">
              <BookOpen className="w-4 h-4" />
              <span>知识点深度解析：</span>
            </div>
            <p className="text-slate-300">{challenge.detailedWalkthrough}</p>
          </div>
        )}
      </div>
    </div>
  );
}
