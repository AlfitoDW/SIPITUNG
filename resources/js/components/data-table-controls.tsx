import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function DataTableControls({
    search, setSearch,
    statusFilter, setStatusFilter,
    pageSize, setPageSize,
    total,
}: {
    search: string; setSearch: (v: string) => void;
    statusFilter: string; setStatusFilter: (v: 'all' | 'aktif' | 'nonaktif') => void;
    pageSize: number; setPageSize: (v: number) => void;
    total: number;
}) {
    return (
        <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                    placeholder="Cari..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 h-8 text-sm"
                />
            </div>
            <Select value={statusFilter} onValueChange={v => setStatusFilter(v as any)}>
                <SelectTrigger className="h-8 text-xs w-[130px]">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="aktif">Aktif</SelectItem>
                    <SelectItem value="nonaktif">Nonaktif</SelectItem>
                </SelectContent>
            </Select>
            <Select value={String(pageSize)} onValueChange={v => setPageSize(Number(v))}>
                <SelectTrigger className="h-8 text-xs w-[100px]">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {[10, 25, 50, 100].map(n => (
                        <SelectItem key={n} value={String(n)}>{n} / hal</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <span className="text-xs text-gray-500 ml-auto">{total} data</span>
        </div>
    );
}
