import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Perencanaan', href: '/super-admin/perencanaan' },
    { title: 'Rencana Aksi', href: '#' },
    { title: 'Penyusunan', href: '/super-admin/perencanaan/rencana-aksi/penyusunan' },
];

type Indikator = {
    kode: string;
    nama: string;
    satuan: string;
    target: string;
    triwulan: [string, string, string, string];
};

type SasaranData = {
    kode: string;
    nama: string;
    indikators: Indikator[];
};

const rencanaAksiData: SasaranData[] = [
    {
        kode: 'S 1',
        nama: 'Meningkatnya kualitas layanan Lembaga Layanan Pendidikan Tinggi (LLDIKTI)',
        indikators: [
            {
                kode: 'IKU 1.1',
                nama: 'Kepuasan pengguna terhadap layanan utama LLDIKTI',
                satuan: '%',
                target: '89,75',
                triwulan: ['89,75', '89,75', '89,75', '89,75'],
            },
            {
                kode: 'IKU 1.2',
                nama: 'Persentase PTS yang terakreditasi atau meningkatkan mutu dengan cara penggabungan dengan PTS lain',
                satuan: '%',
                target: '90,43',
                triwulan: ['88,00', '88,13', '89,00', '90,43'],
            },
        ],
    },
    {
        kode: 'S 2',
        nama: 'Meningkatnya efektivitas sosialisasi kebijakan pendidikan tinggi',
        indikators: [
            {
                kode: 'IKU 2.1',
                nama: 'Persentase PTS yang menyelenggarakan kegiatan pembelajaran di luar program studi',
                satuan: '%',
                target: '70,55',
                triwulan: ['70,52', '70,53', '70,54', '70,55'],
            },
            {
                kode: 'IKU 2.2',
                nama: 'Persentase mahasiswa S1 atau D4/D3/D2/D1 PTS yang menjalankan kegiatan pembelajaran di luar program studi atau meraih prestasi',
                satuan: '%',
                target: '11',
                triwulan: ['10,99', '10,99', '11', '11'],
            },
            {
                kode: 'IKU 2.3',
                nama: 'Persentase PTS yang mengimplementasikan kebijakan antiintoleransi, antikekerasan seksual, antiperundungan, antinarkoba, dan antikorupsi',
                satuan: '%',
                target: '71,88',
                triwulan: ['70,90', '71,00', '71,40', '71,88'],
            },
        ],
    },
    {
        kode: 'S 3',
        nama: 'Meningkatnya inovasi perguruan tinggi dalam rangka meningkatkan mutu pendidikan',
        indikators: [
            {
                kode: 'IKU 3.1',
                nama: 'Persentase PTS yang berhasil meningkatkan kinerja dengan meningkatkan jumlah dosen yang berkegiatan di luar kampus',
                satuan: '%',
                target: '62,6',
                triwulan: ['61,00', '61,50', '62,00', '62,6'],
            },
            {
                kode: 'IKU 3.2',
                nama: 'Persentase PTS yang berhasil meningkatkan kinerja dengan meningkatkan jumlah program studi yang bekerja sama dengan mitra',
                satuan: '%',
                target: '48,5',
                triwulan: ['48,00', '48,00', '48,30', '48,5'],
            },
        ],
    },
    // {
    //     kode: 'S 4',
    //     nama: 'Meningkatnya tata kelola Lembaga Layanan Pendidikan Tinggi (LLDIKTI)',
    //     indikators: [
    //         {
    //             kode: 'IKU 4.1',
    //             nama: 'Predikat SAKIP',
    //             satuan: 'Predikat',
    //             target: 'A',
    //             triwulan: ['-', '-', '-', 'A'],
    //         },
    //         {
    //             kode: 'IKU 4.2',
    //             nama: 'Nilai Kinerja Anggaran atas Pelaksanaan RKA-K/L',
    //             satuan: 'Nilai',
    //             target: '98,7',
    //             triwulan: ['0', '0', '0', '98,7'],
    //         },
    //     ],
    // },
];

const sasaranColors: Record<string, { sasaranBg: string; kodeBadge: string }> = {
    'S 1': { sasaranBg: 'bg-blue-50 dark:bg-blue-950/40',       kodeBadge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    'S 2': { sasaranBg: 'bg-emerald-50 dark:bg-emerald-950/40', kodeBadge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' },
    'S 3': { sasaranBg: 'bg-violet-50 dark:bg-violet-950/40',   kodeBadge: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200' },
    'S 4': { sasaranBg: 'bg-amber-50 dark:bg-amber-950/40',     kodeBadge: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
};

const sasaranAccent: Record<string, string> = {
    'S 1': 'border-l-4 border-l-blue-500',
    'S 2': 'border-l-4 border-l-emerald-500',
    'S 3': 'border-l-4 border-l-violet-500',
    'S 4': 'border-l-4 border-l-amber-500',
};

export default function Penyusunan() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Penyusunan — Rencana Aksi" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold tracking-tight">Penyusunan Rencana Aksi</h1>
                    <p className="text-muted-foreground">Target kinerja per triwulan tahun anggaran berjalan</p>
                </div>

                <div className="rounded-xl border shadow-sm overflow-hidden">
                    <Table className="[&_td]:border-b [&_td]:border-r [&_th]:border-r">
                        <TableHeader>
                            {/* Baris header pertama */}
                            <TableRow className="hover:bg-transparent" style={{ backgroundColor: '#003580' }}>
                                <TableHead
                                    rowSpan={2}
                                    className="border-r border-white/20 text-center align-middle font-semibold text-white w-60"
                                >
                                    Sasaran
                                </TableHead>
                                <TableHead
                                    rowSpan={2}
                                    className="border-r border-white/20 text-center align-middle font-semibold text-white"
                                >
                                    Indikator
                                </TableHead>
                                <TableHead
                                    rowSpan={2}
                                    className="border-r border-white/20 text-center align-middle font-semibold text-white w-24"
                                >
                                    Satuan
                                </TableHead>
                                <TableHead
                                    rowSpan={2}
                                    className="border-r border-white/20 text-center align-middle font-semibold text-white w-20"
                                >
                                    Target
                                </TableHead>
                                <TableHead
                                    colSpan={4}
                                    className="text-center font-semibold text-white border-b border-white/20"
                                >
                                    Triwulan
                                </TableHead>
                            </TableRow>
                            {/* Baris header kedua — label triwulan */}
                            <TableRow className="hover:bg-transparent" style={{ backgroundColor: '#003580' }}>
                                {(['I', 'II', 'III', 'IV'] as const).map((tw, i) => (
                                    <TableHead
                                        key={tw}
                                        className={`text-center font-semibold text-white w-[80px]${i < 3 ? ' border-r border-white/20' : ''}`}
                                    >
                                        {tw}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {rencanaAksiData.map((sasaran) => {
                                const colors = sasaranColors[sasaran.kode] ?? sasaranColors['S 1'];
                                const accent = sasaranAccent[sasaran.kode] ?? '';

                                return sasaran.indikators.map((iku, ikuIdx) => (
                                    <TableRow
                                        key={`${sasaran.kode}-${iku.kode}`}
                                        className="align-top hover:bg-muted/30"
                                    >
                                        {ikuIdx === 0 && (
                                            <TableCell
                                                rowSpan={sasaran.indikators.length}
                                                className={`align-top text-sm ${colors.sasaranBg} ${accent}`}
                                            >
                                                <span className={`inline-block mb-1.5 rounded px-1.5 py-0.5 text-xs font-bold ${colors.kodeBadge}`}>
                                                    {sasaran.kode}
                                                </span>
                                                <p className="leading-snug text-foreground">{sasaran.nama}</p>
                                            </TableCell>
                                        )}

                                        <TableCell className="text-sm align-top">
                                            <span className="inline-block mb-1 text-xs font-semibold text-muted-foreground">
                                                {iku.kode}
                                            </span>
                                            <p className="leading-snug">{iku.nama}</p>
                                        </TableCell>

                                        <TableCell className="text-center text-sm text-muted-foreground">
                                            {iku.satuan}
                                        </TableCell>

                                        <TableCell className="text-center text-sm font-semibold">
                                            {iku.target}
                                        </TableCell>

                                        {iku.triwulan.map((val, i) => (
                                            <TableCell
                                                key={i}
                                                className="text-center text-sm"
                                            >
                                                {val}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ));
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </AppLayout>
    );
}
