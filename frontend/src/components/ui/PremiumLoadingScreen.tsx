import { useEffect, useRef, useState } from 'react';
import {
  HiOutlineArrowDownTray,
  HiOutlineCheck,
  HiOutlineChatBubbleLeftRight,
  HiOutlineShieldCheck,
  HiOutlineSignal,
  HiOutlineSparkles,
} from 'react-icons/hi2';

type Phase = {
  label: string;
  icon: typeof HiOutlineSignal;
  start: number;
  end: number;
};

const PHASES: Phase[] = [
  { label: 'Connecting to server', icon: HiOutlineSignal, start: 0, end: 25 },
  { label: 'Authenticating', icon: HiOutlineShieldCheck, start: 25, end: 50 },
  { label: 'Fetching workspace data', icon: HiOutlineArrowDownTray, start: 50, end: 75 },
  { label: 'Preparing your workspace', icon: HiOutlineSparkles, start: 75, end: 100 },
];

function getCurrentStep(progress: number) {
  for (let i = PHASES.length - 1; i >= 0; i--) {
    if (progress >= PHASES[i].start) return i;
  }
  return 0;
}

type Props = { onComplete: () => void };

function SkeletonBlock({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`rounded-lg bg-gradient-to-r from-white/10 via-white/20 to-white/10 bg-[length:240%_100%] animate-[shimmer_1.2s_ease-in-out_infinite] ${className ?? ''}`}
      style={style}
    />
  );
}

export function PremiumLoadingScreen({ onComplete }: Props) {
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const doneRef = useRef(false);

  useEffect(() => {
    startRef.current = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startRef.current;
      const duration = 3200;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(Math.round(eased * 100));
      if (t < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    if (progress >= 100 && !doneRef.current) {
      doneRef.current = true;
      setExiting(true);
      const id = setTimeout(onComplete, 450);
      return () => clearTimeout(id);
    }
  }, [progress, onComplete]);

  const currentStep = getCurrentStep(progress);

  return (
    <div className={`fixed inset-0 z-50 grid place-items-center bg-gradient-to-br from-[#0a1f22] via-[#13292d] to-[#1a3a3f] transition-all duration-400 ${exiting ? 'opacity-0 scale-[1.02] pointer-events-none' : ''}`}>
      {/* Skeleton layout behind */}
      <div className="absolute inset-0 grid grid-cols-[260px_minmax(0,1fr)] opacity-5 pointer-events-none">
        <div className="h-svh p-5 bg-surface">
          <div className="flex items-center gap-3 pb-5 border-b border-white/14">
            <SkeletonBlock className="w-10 h-10 shrink-0" />
            <div className="grid gap-1.5 flex-1">
              <SkeletonBlock className="h-3.5 w-[70%]" />
              <SkeletonBlock className="h-2.5 w-[50%]" />
            </div>
          </div>
          <div className="grid gap-1.5 mt-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg">
                <SkeletonBlock className="w-5 h-5 shrink-0" />
                <SkeletonBlock className="h-3" style={{ width: `${55 + (i % 3) * 10}%` }} />
              </div>
            ))}
          </div>
        </div>
        <div className="p-7">
          <SkeletonBlock className="h-7 w-56 mb-2" />
          <SkeletonBlock className="h-3.5 w-96" />
          <div className="h-px bg-white/10 my-6" />
          <div className="grid grid-cols-4 gap-3.5 mb-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="grid gap-1.5 p-4 rounded-lg bg-white/5 border border-white/10">
                <SkeletonBlock className="h-2.5 w-[65%]" />
                <SkeletonBlock className="h-6 w-[40%]" />
                <SkeletonBlock className="h-2.5 w-[80%]" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-5">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="rounded-lg bg-white/5 border border-white/10 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/10 bg-white/3">
                  <SkeletonBlock className="h-3.5 w-36" />
                </div>
                <div className="grid gap-2.5 p-4">
                  <SkeletonBlock className="h-3 w-[90%]" />
                  <SkeletonBlock className="h-3 w-[75%]" />
                  <SkeletonBlock className="h-3 w-[82%]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Loading panel */}
      <div className="relative z-10 grid gap-6 justify-items-center w-full max-w-[420px] mx-4 px-10 py-11 bg-white/7 backdrop-blur-2xl border border-white/12 rounded-2xl">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-11 h-11 rounded-[10px] bg-white/12 text-surface-foreground">
            <HiOutlineChatBubbleLeftRight size={24} />
          </div>
          <strong className="text-lg text-white tracking-tight">Speak To Reach</strong>
        </div>

        {/* Percentage */}
        <div className="text-[72px] font-extrabold leading-none text-white tabular-nums tracking-tight" aria-live="polite" aria-label={`${progress}% loaded`}>
          {progress}<span className="text-[36px] font-semibold opacity-60 ml-0.5">%</span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary via-teal-400 to-emerald-300 transition-[width] duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Steps */}
        <div className="grid gap-2.5 w-full" role="list" aria-label="Loading progress">
          {PHASES.map((phase, i) => {
            const isCompleted = progress > phase.end || (progress === 100 && i <= currentStep);
            const isActive = i === currentStep && !isCompleted;
            const Icon = phase.icon;

            return (
              <div
                key={phase.label}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${isActive ? 'text-white bg-white/8' : isCompleted ? 'text-white/60' : 'text-white/35'}`}
                role="listitem"
              >
                <div className={`flex items-center justify-center w-7 h-7 rounded-full shrink-0 transition-colors ${isActive ? 'bg-primary/35 animate-pulse' : isCompleted ? 'bg-success/30 text-emerald-300' : 'bg-white/6'}`}>
                  {isCompleted ? <HiOutlineCheck size={14} /> : <Icon size={14} />}
                </div>
                <span>{phase.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
