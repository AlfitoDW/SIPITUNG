import { useState, useMemo } from 'react';

export function usePaginatedTable<T extends Record<string, any>>(
    data: T[],
    searchKeys: string[],
    opts?: { pageSize?: number }
) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'aktif' | 'nonaktif'>('all');
    const [pageSize, setPageSize] = useState(opts?.pageSize ?? 10);
    const [page, setPage] = useState(1);

    const filtered = useMemo(() => {
        let list = [...data];
        if (statusFilter !== 'all') {
            const want = statusFilter === 'aktif';
            list = list.filter((d: any) => d.is_aktif === want);
        }
        const q = search.trim().toLowerCase();
        if (q) {
            list = list.filter((d: any) =>
                searchKeys.some(k => {
                    const v = k.split('.').reduce((o, p) => o?.[p], d);
                    return String(v ?? '').toLowerCase().includes(q);
                })
            );
        }
        return list;
    }, [data, search, statusFilter, searchKeys]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const from = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const to = Math.min(currentPage * pageSize, filtered.length);

    const goPage = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));

    // reset page when filters change
    useMemo(() => setPage(1), [search, statusFilter, pageSize, data.length]);

    return {
        search, setSearch,
        statusFilter, setStatusFilter,
        pageSize, setPageSize,
        page: currentPage, goPage,
        paginated, total: filtered.length, from, to, totalPages,
    };
}
