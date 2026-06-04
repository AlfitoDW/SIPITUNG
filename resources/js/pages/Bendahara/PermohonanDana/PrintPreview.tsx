import { Head } from '@inertiajs/react';
import { useEffect } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

interface Item {
    id: number;
    kode_akun: string | null;
    uraian: string;
    volume: number;
    satuan: string;
    harga_satuan: string | number;
    total: string | number;
    jumlah_permintaan: string | number;
}

interface Dokumen {
    id: number;
    nama_jenis: string;
    nama_file: string;
}

interface Approver {
    id: number;
    nama_lengkap: string;
}

interface Pd {
    id: number;
    nomor_permohonan: string;
    judul_pekerjaan: string | null;
    keperluan: string;
    status: string;
    status_label: string;
    tanggal_mulai: string | null;
    tanggal_selesai: string | null;
    jam_pelaksanaan: string | null;
    tempat: string | null;
    tgl_pertanggungjawaban: string | null;
    total_anggaran: string | number;
    created_at: string;
    catatan_penolakan: string | null;
    dja_program?: { kode: string; nama: string };
    dja_sasaran?: { kode: string; nama: string };
    dja_kro?: { kode: string; nama: string };
    dja_ro?: { kode: string; nama: string };
    dja_komponen?: { kode: string; nama: string };
    dja_kegiatan?: { kode: string; nama: string };
    kapokja?: Approver | null;
    pic_keuangan?: Approver | null;
    katim_approved_by?: Approver | null;
    kabag_approved_by?: Approver | null;
    ppk_approved_by?: Approver | null;
    pic_approved_by?: Approver | null;
    dicairkan_by?: Approver | null;
    items: Item[];
    dokumens: Dokumen[];
}

interface Props { pd: Pd; }

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (s: string | null) =>
    s ? new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-';

const fmtRp = (n: string | number) =>
    'Rp ' + new Intl.NumberFormat('id-ID').format(Number(n));

const STATUS_CHAIN: { key: string; label: string; field: keyof Pd }[] = [
    { key: 'submitted',      label: 'Diajukan PUMK',          field: 'kapokja' },
    { key: 'katim_approved', label: 'Disetujui KA.TIM',        field: 'katim_approved_by' },
    { key: 'kabag_approved', label: 'Disetujui Kabag Umum',    field: 'kabag_approved_by' },
    { key: 'ppk_approved',   label: 'Disetujui PPK',           field: 'ppk_approved_by' },
    { key: 'pic_approved',   label: 'Disetujui PIC Keuangan',  field: 'pic_approved_by' },
    { key: 'dicairkan',      label: 'Dicairkan',               field: 'dicairkan_by' },
];

const STATUS_ORDER = ['submitted','katim_approved','kabag_approved','ppk_approved','pic_approved','dicairkan'];

// ── Main ─────────────────────────────────────────────────────────────────────

export default function PrintPreview({ pd }: Props) {
    // Auto-trigger print dialog on page load
    useEffect(() => {
        const timer = setTimeout(() => window.print(), 600);
        return () => clearTimeout(timer);
    }, []);

    const currentStatusIdx = STATUS_ORDER.indexOf(pd.status);
    const grandTotal = Number(pd.total_anggaran ?? 0);
    const judul = pd.judul_pekerjaan ?? pd.keperluan;

    return (
        <>
            <Head title={`Cetak — ${pd.nomor_permohonan}`} />

            {/* Print-only global styles */}
            <style>{`
                @media print {
                    body { margin: 0; }
                    .no-print { display: none !important; }
                    @page { size: A4 portrait; margin: 15mm 15mm 15mm 20mm; }
                }
                body { font-family: 'Arial', sans-serif; background: #f3f4f6; }
                .page { background: #fff; max-width: 210mm; margin: 20px auto; padding: 20mm 15mm 15mm 20mm; box-shadow: 0 2px 16px rgba(0,0,0,.12); }
                @media print { .page { margin: 0; box-shadow: none; padding: 0; } }
            `}</style>

            {/* Print button — hidden when printing */}
            <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-indigo-700 transition-colors"
                >
                    🖨️ Cetak Dokumen
                </button>
                <button
                    onClick={() => {
                        try {
                            window.close();
                            setTimeout(() => {
                                if (!window.closed) window.history.back();
                            }, 300);
                        } catch {
                            window.history.back();
                        }
                    }}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow"
                >
                    ✕ Tutup
                </button>
            </div>

            <div className="page">
                {/* ── Kop Surat ──────────────────────────────────────────── */}
                <div style={{ borderBottom: '3px solid #1e3a8a', paddingBottom: '8px', marginBottom: '16px' }}>
                    <table style={{ width: '100%' }}>
                        <tbody>
                            <tr>
                                <td style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '13pt', fontWeight: 'bold', color: '#1e3a8a', textTransform: 'uppercase' }}>
                                        LEMBAGA LAYANAN PENDIDIKAN TINGGI WILAYAH III
                                    </div>
                                    <div style={{ fontSize: '9pt', color: '#374151' }}>
                                        Jl. SMA 14 No. 1 Cawang, Jakarta Timur 13630
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* ── Judul Dokumen ───────────────────────────────────────── */}
                <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                    <div style={{ fontSize: '12pt', fontWeight: 'bold', textDecoration: 'underline', textTransform: 'uppercase' }}>
                        PERMOHONAN DANA
                    </div>
                    <div style={{ fontSize: '10pt', color: '#374151', marginTop: '2px' }}>
                        Nomor: {pd.nomor_permohonan}
                    </div>
                    <div style={{ fontSize: '9pt', color: '#6b7280', marginTop: '2px' }}>
                        Status: <strong>{pd.status_label}</strong>
                    </div>
                </div>

                {/* ── Info Kegiatan ───────────────────────────────────────── */}
                <SectionTitle>A. Informasi Kegiatan</SectionTitle>
                <InfoTable rows={[
                    ['Judul Pekerjaan', judul],
                    ['Program', pd.dja_program ? `${pd.dja_program.kode} — ${pd.dja_program.nama}` : '-'],
                    ['Sasaran', pd.dja_sasaran ? `${pd.dja_sasaran.kode} — ${pd.dja_sasaran.nama}` : '-'],
                    ['KRO', pd.dja_kro ? `${pd.dja_kro.kode} — ${pd.dja_kro.nama}` : '-'],
                    ['RO', pd.dja_ro ? `${pd.dja_ro.kode} — ${pd.dja_ro.nama}` : '-'],
                    ['Komponen', pd.dja_komponen ? `${pd.dja_komponen.kode} — ${pd.dja_komponen.nama}` : '-'],
                    ['Kegiatan', pd.dja_kegiatan ? `${pd.dja_kegiatan.kode} — ${pd.dja_kegiatan.nama}` : '-'],
                ]} />

                {/* ── Waktu & PJ ──────────────────────────────────────────── */}
                <SectionTitle>B. Waktu &amp; Penanggung Jawab</SectionTitle>
                <InfoTable rows={[
                    ['Tanggal Pelaksanaan Awal', fmtDate(pd.tanggal_mulai)],
                    ['Tanggal Pelaksanaan Akhir', fmtDate(pd.tanggal_selesai)],
                    ['Waktu Pelaksanaan', pd.jam_pelaksanaan ?? '-'],
                    ['Tempat', pd.tempat ?? '-'],
                    ['Waktu Penyelesaian Pertanggungjawaban (sesuai RPD)', fmtDate(pd.tgl_pertanggungjawaban)],
                    ['Ketua Tim Kerja', pd.kapokja?.nama_lengkap ?? '-'],
                    ['PIC Keuangan', pd.pic_keuangan?.nama_lengkap ?? '-'],
                ]} />

                {/* ── Rincian Biaya ────────────────────────────────────────── */}
                <SectionTitle>C. Rincian Biaya</SectionTitle>
                {pd.items.length === 0 ? (
                    <p style={{ fontSize: '9pt', color: '#6b7280', fontStyle: 'italic' }}>Belum ada rincian biaya.</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt', marginBottom: '6px' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#1e3a8a', color: '#fff' }}>
                                <Th align="center" w="4%">No</Th>
                                <Th align="center" w="10%">Kode Akun</Th>
                                <Th align="left" w="36%">Uraian</Th>
                                <Th align="center" w="8%">Vol</Th>
                                <Th align="center" w="8%">Sat</Th>
                                <Th align="right" w="17%">Harga Satuan</Th>
                                <Th align="right" w="17%">Jumlah</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {pd.items.map((item, i) => (
                                <tr key={item.id} style={{ backgroundColor: i % 2 === 0 ? '#f9fafb' : '#fff' }}>
                                    <Td align="center">{i + 1}</Td>
                                    <Td align="center">{item.kode_akun ?? '-'}</Td>
                                    <Td align="left">{item.uraian}</Td>
                                    <Td align="center">{Number(item.volume).toLocaleString('id-ID')}</Td>
                                    <Td align="center">{item.satuan}</Td>
                                    <Td align="right">{fmtRp(item.harga_satuan)}</Td>
                                    <Td align="right">{fmtRp(item.jumlah_permintaan)}</Td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr style={{ backgroundColor: '#dbeafe', fontWeight: 'bold' }}>
                                <Td align="right" colSpan={6}>Total Permohonan:</Td>
                                <Td align="right">{fmtRp(grandTotal)}</Td>
                            </tr>
                        </tfoot>
                    </table>
                )}

                {/* ── Dokumen Pendukung ─────────────────────────────────────── */}
                {pd.dokumens.length > 0 && (
                    <>
                        <SectionTitle>D. Dokumen Pendukung</SectionTitle>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt', marginBottom: '6px' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#1e3a8a', color: '#fff' }}>
                                    <Th align="center" w="5%">No</Th>
                                    <Th align="left" w="35%">Jenis Dokumen</Th>
                                    <Th align="left" w="60%">Nama File</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {pd.dokumens.map((dok, i) => (
                                    <tr key={dok.id} style={{ backgroundColor: i % 2 === 0 ? '#f9fafb' : '#fff' }}>
                                        <Td align="center">{i + 1}</Td>
                                        <Td align="left">{dok.nama_jenis}</Td>
                                        <Td align="left">{dok.nama_file}</Td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )}

                {/* ── Riwayat Persetujuan ───────────────────────────────────── */}
                <SectionTitle>E. Riwayat Persetujuan</SectionTitle>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt', marginBottom: '16px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#1e3a8a', color: '#fff' }}>
                            <Th align="center" w="5%">No</Th>
                            <Th align="left" w="40%">Tahapan</Th>
                            <Th align="left" w="35%">Oleh</Th>
                            <Th align="center" w="20%">Status</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {STATUS_CHAIN.map((chain, i) => {
                            const reached = currentStatusIdx >= STATUS_ORDER.indexOf(chain.key);
                            const approver = pd[chain.field] as Approver | null | undefined;
                            return (
                                <tr key={chain.key} style={{ backgroundColor: i % 2 === 0 ? '#f9fafb' : '#fff' }}>
                                    <Td align="center">{i + 1}</Td>
                                    <Td align="left">{chain.label}</Td>
                                    <Td align="left">{approver ? approver.nama_lengkap : '-'}</Td>
                                    <Td align="center">
                                        <span style={{
                                            fontSize: '7.5pt',
                                            fontWeight: 'bold',
                                            padding: '1px 6px',
                                            borderRadius: '9999px',
                                            backgroundColor: reached ? '#dcfce7' : '#f3f4f6',
                                            color: reached ? '#166534' : '#9ca3af',
                                        }}>
                                            {reached ? '✓ Selesai' : 'Belum'}
                                        </span>
                                    </Td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* ── Tanda Tangan ──────────────────────────────────────────── */}
                <div style={{ marginTop: '24px' }}>
                    <table style={{ width: '100%', fontSize: '9pt' }}>
                        <tbody>
                            <tr>
                                <td style={{ width: '50%', textAlign: 'center', paddingTop: '4px' }}>
                                    <div>Jakarta, {fmtDate(pd.created_at)}</div>
                                    <div style={{ marginTop: '2px', color: '#6b7280', fontSize: '8pt' }}>Dibuat oleh PUMK</div>
                                    <div style={{ height: '56px' }} />
                                    <div style={{ borderTop: '1px solid #374151', width: '70%', margin: '0 auto', paddingTop: '3px' }}>
                                        <strong>( ……………………………… )</strong>
                                    </div>
                                    <div style={{ fontSize: '8pt', color: '#6b7280', marginTop: '2px' }}>PUMK Pengaju</div>
                                </td>
                                <td style={{ width: '50%', textAlign: 'center', paddingTop: '4px' }}>
                                    <div>Mengetahui,</div>
                                    <div style={{ marginTop: '2px', color: '#6b7280', fontSize: '8pt' }}>
                                        Kapokja: {pd.kapokja?.nama_lengkap ?? '……………………………'}
                                    </div>
                                    <div style={{ height: '56px' }} />
                                    <div style={{ borderTop: '1px solid #374151', width: '70%', margin: '0 auto', paddingTop: '3px' }}>
                                        <strong>( {pd.kapokja?.nama_lengkap ?? '……………………………'} )</strong>
                                    </div>
                                    <div style={{ fontSize: '8pt', color: '#6b7280', marginTop: '2px' }}>Ketua Tim Kerja</div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div style={{ marginTop: '20px', borderTop: '1px solid #e5e7eb', paddingTop: '6px', textAlign: 'center', fontSize: '7.5pt', color: '#9ca3af' }}>
                    Dicetak dari SIPITUNG — Sistem Informasi LLDIKTI Wilayah III · {pd.nomor_permohonan}
                </div>
            </div>
        </>
    );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <div style={{
            fontSize: '9.5pt', fontWeight: 'bold', color: '#1e3a8a',
            borderBottom: '1.5px solid #1e3a8a', paddingBottom: '2px',
            marginTop: '12px', marginBottom: '6px', textTransform: 'uppercase',
        }}>
            {children}
        </div>
    );
}

function InfoTable({ rows }: { rows: [string, string][] }) {
    return (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', marginBottom: '4px' }}>
            <tbody>
                {rows.map(([label, value]) => (
                    <tr key={label}>
                        <td style={{ width: '30%', padding: '2.5px 4px', color: '#6b7280', verticalAlign: 'top' }}>{label}</td>
                        <td style={{ width: '2%', padding: '2.5px 4px', color: '#6b7280', verticalAlign: 'top' }}>:</td>
                        <td style={{ width: '68%', padding: '2.5px 4px', color: '#111827', fontWeight: 500 }}>{value}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function Th({ children, align, w }: { children: React.ReactNode; align?: string; w?: string }) {
    return (
        <th style={{
            border: '1px solid #1e40af', padding: '4px 6px',
            textAlign: (align as React.CSSProperties['textAlign']) ?? 'left',
            width: w ?? 'auto', fontWeight: 'bold',
        }}>
            {children}
        </th>
    );
}

function Td({ children, align, colSpan }: { children: React.ReactNode; align?: string; colSpan?: number }) {
    return (
        <td style={{
            border: '1px solid #d1d5db', padding: '3px 6px',
            textAlign: (align as React.CSSProperties['textAlign']) ?? 'left',
        }} colSpan={colSpan}>
            {children}
        </td>
    );
}
