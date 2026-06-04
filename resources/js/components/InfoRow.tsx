import type { ReactNode } from 'react';

export default function InfoRow({ label, value, mono = false }: { label: string; value: ReactNode; mono?: boolean }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-xs text-gray-500">{label}</span>
            <span className={`text-sm text-gray-900 font-medium ${mono ? 'font-mono' : ''}`}>{value}</span>
        </div>
    );
}
