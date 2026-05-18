import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DataTablePagination({ page, totalPages, goPage }: { page: number; totalPages: number; goPage: (p: number) => void }) {
    if (totalPages <= 1) return null;
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1);
    const showEllipsis = (arr: number[], idx: number) => idx > 0 && arr[idx] - arr[idx - 1] > 1;

    return (
        <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-gray-500">
                Halaman {page} dari {totalPages}
            </span>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => goPage(page - 1)}
                    disabled={page === 1}
                    className="px-2 py-1 text-xs rounded border disabled:opacity-30 hover:bg-gray-50"
                >
                    <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {pages.map((p, i) => (
                    <span key={p} className="flex items-center gap-1">
                        {showEllipsis(pages, i) && <span className="text-xs text-gray-400 px-1">...</span>}
                        <button
                            onClick={() => goPage(p)}
                            className={cn(
                                'min-w-[28px] px-2 py-1 text-xs rounded border',
                                page === p
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'hover:bg-gray-50'
                            )}
                        >
                            {p}
                        </button>
                    </span>
                ))}
                <button
                    onClick={() => goPage(page + 1)}
                    disabled={page === totalPages}
                    className="px-2 py-1 text-xs rounded border disabled:opacity-30 hover:bg-gray-50"
                >
                    <ChevronRight className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}
