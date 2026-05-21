import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepBarProps {
    active: number;
    onChange: (s: number) => void;
    steps: readonly string[];
}

export default function StepBar({ active, onChange, steps }: StepBarProps) {
    return (
        <div className="flex items-center justify-center gap-0 mb-6">
            {steps.map((label, i) => {
                const step = i + 1;
                const isActive = active === step;
                const isDone = active > step;
                return (
                    <div key={step} className="flex items-center">
                        <button
                            type="button"
                            onClick={() => onChange(step)}
                            className={cn(
                                'flex flex-col items-center gap-1 min-w-[80px] group cursor-pointer',
                            )}
                        >
                            <div className={cn(
                                'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all',
                                isDone  && 'bg-emerald-500 border-emerald-500 text-white',
                                isActive && 'bg-blue-600 border-blue-600 text-white scale-110 shadow-md',
                                !isDone && !isActive && 'bg-white border-gray-300 text-gray-400 hover:border-blue-300 hover:scale-105',
                            )}>
                                {isDone ? <CheckCircle2 className="w-5 h-5" /> : step}
                            </div>
                            <span className={cn(
                                'text-[10px] font-medium text-center leading-tight transition-colors',
                                isActive ? 'text-blue-600' : isDone ? 'text-emerald-600' : 'text-gray-400',
                            )}>{label}</span>
                        </button>
                        {i < steps.length - 1 && (
                            <div className={cn(
                                'h-0.5 w-12 mx-1 mb-4 transition-colors',
                                active > i + 1 ? 'bg-emerald-400' : 'bg-gray-200',
                            )} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
