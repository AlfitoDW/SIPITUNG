import { AlertTriangle, Clock, LockKeyhole } from 'lucide-react';
import { useEffect, useState } from 'react';

interface DeadlineCountdownProps {
    /** ISO 8601 deadline string dari server (null = tidak ada deadline) */
    deadline: string | null;
    /** ISO 8601 server time saat halaman di-render, untuk kalibrasi clock */
    serverNow: string;
    /** Label modul, misal "Rencana Aksi" atau "Pengukuran TW1" */
    label?: string;
    /** Dipanggil saat countdown mencapai 0 (deadline terlewati) */
    onExpire?: () => void;
}

function pad(n: number): string {
    return String(n).padStart(2, '0');
}

function formatDeadline(iso: string): string {
    return new Date(iso).toLocaleString('id-ID', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatRemaining(ms: number): string {
    const totalSec = Math.floor(ms / 1000);
    const totalMin = Math.floor(totalSec / 60);
    const hours = Math.floor(totalMin / 60);
    const minutes = totalMin % 60;
    const seconds = totalSec % 60;

    if (hours >= 24) {
        const days = Math.floor(hours / 24);
        const remHours = hours % 24;
        return `${days}h ${remHours}j lagi`;
    }
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Menampilkan countdown menuju deadline pengisian.
 * - Tidak ada deadline → tidak render apa pun
 * - > 24 jam → info strip biasa
 * - ≤ 24 jam → warning amber dengan countdown
 * - Deadline terlewati → banner merah kunci
 */
export function DeadlineCountdown({ deadline, serverNow, label = 'Batas pengisian', onExpire }: DeadlineCountdownProps) {
    const [mountClientMs] = useState(() => Date.now());
    const [tick, setTick] = useState(0);
    const [expired, setExpired] = useState(false);

    const deadlineMs = deadline ? new Date(deadline).getTime() : null;
    const serverMs = new Date(serverNow).getTime();

    const remainingAtMount = deadlineMs !== null ? deadlineMs - serverMs : null;
    const elapsed = Date.now() - mountClientMs;
    const remaining = remainingAtMount !== null ? remainingAtMount - elapsed : null;

    useEffect(() => {
        if (deadline === null) return;
        const id = setInterval(() => setTick((t) => t + 1), 1000);
        return () => clearInterval(id);
    }, [deadline]);

    useEffect(() => {
        if (remaining !== null && remaining <= 0 && !expired) {
            setExpired(true);
            onExpire?.();
        }
    }, [remaining, expired, onExpire]);

    if (deadline === null || remaining === null) return null;

    const isPast = remaining <= 0;
    const isWarning = !isPast && remaining <= 24 * 60 * 60 * 1000;

    const deadlineLabel = formatDeadline(deadline);

    if (isPast) {
        return (
            <div className="flex items-start gap-3 rounded-md border-l-4 border-l-red-500 border border-red-200 bg-red-50/60 px-4 py-3 dark:border-red-800 dark:border-l-red-500 dark:bg-red-950/20">
                <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <div>
                    <p className="text-sm font-semibold text-red-700 dark:text-red-400">Batas waktu telah berakhir</p>
                    <p className="text-xs text-red-600/80 dark:text-red-500 mt-0.5">
                        {label} ditutup pada {deadlineLabel}. Form pengisian dikunci.
                    </p>
                </div>
            </div>
        );
    }

    if (isWarning) {
        return (
            <div className="flex items-start gap-3 rounded-md border-l-4 border-l-amber-400 border border-amber-200 bg-amber-50/60 px-4 py-3 dark:border-amber-800 dark:border-l-amber-500 dark:bg-amber-950/20">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <div className="flex flex-1 flex-wrap items-start justify-between gap-x-6 gap-y-0.5">
                    <div>
                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Segera berakhir</p>
                        <p className="text-xs text-amber-700/80 dark:text-amber-400 mt-0.5">
                            {label} berakhir <span className="font-medium">{deadlineLabel}</span>
                        </p>
                    </div>
                    <span className="font-mono text-base font-bold tracking-widest text-amber-700 dark:text-amber-300 self-center">
                        {formatRemaining(remaining)}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50/80 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-800/40">
            <Clock className="h-4 w-4 shrink-0 text-slate-400" />
            <div className="flex flex-1 flex-wrap items-center justify-between gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-medium text-slate-800 dark:text-slate-200">{label}</span>
                    {' '}berakhir <span className="text-slate-700 dark:text-slate-300">{deadlineLabel}</span>
                </span>
                <span className="font-mono text-sm font-medium text-slate-500 dark:text-slate-400 tabular-nums">
                    {formatRemaining(remaining)}
                </span>
            </div>
        </div>
    );
}
