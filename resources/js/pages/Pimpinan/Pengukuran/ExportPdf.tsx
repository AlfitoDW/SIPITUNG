import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Printer } from 'lucide-react';
import { Fragment, useState } from 'react';

type TimKerja  = { id: number; nama: string };
type MatrixRow = {
    sasaran_kode: string; sasaran_nama: string;
    iku_kode: string; iku_nama: string;
    iku_satuan: string; iku_target: string; iku_target_tw: string | null;
    pic_tim_kerjas: TimKerja[];
    input_by_tim_kerja: TimKerja | null;
    realisasi: string | null;
    progress_kegiatan: string | null;
    kendala: string | null;
    strategi_tindak_lanjut: string | null;
};
type LaporanItem = {
    tim_kerja_nama: string;
    status: string;
    rekomendasi_kabag: string | null;
    approved_at: string | null;
};
type Periode = { id: number; triwulan: string };
type Tahun   = { id: number; tahun: number; label: string };
type Props   = {
    tahun: Tahun;
    periode: Periode;
    matrix: MatrixRow[];
    laporans: LaporanItem[];
};

const TW_LABELS: Record<string, string> = {
    TW1: 'Triwulan I', TW2: 'Triwulan II', TW3: 'Triwulan III', TW4: 'Triwulan IV',
};

type SasaranGroup = { kode: string; nama: string; rows: MatrixRow[] };

function groupBySasaran(rows: MatrixRow[]): SasaranGroup[] {
    const groups: SasaranGroup[] = [];
    for (const row of rows) {
        const last = groups[groups.length - 1];
        if (last && last.kode === row.sasaran_kode) {
            last.rows.push(row);
        } else {
            groups.push({ kode: row.sasaran_kode, nama: row.sasaran_nama, rows: [row] });
        }
    }
    return groups;
}

// ─── Inline styles ────────────────────────────────────────────────────────────

const docFont: React.CSSProperties = { fontFamily: '"Times New Roman", Times, serif', fontSize: '11pt' };

const tdBase: React.CSSProperties = {
    ...docFont,
    border: '1px solid #000',
    padding: '5px 7px',
    verticalAlign: 'top',
};
const tdCenter: React.CSSProperties = { ...tdBase, textAlign: 'center', verticalAlign: 'middle' };
const thBase: React.CSSProperties = {
    ...docFont,
    border: '1px solid #000',
    padding: '5px 7px',
    textAlign: 'center',
    verticalAlign: 'middle',
    fontWeight: 'bold',
    backgroundColor: '#fff',
    color: '#000',
};

// ─── Numbered PIC helper ──────────────────────────────────────────────────────

function PicNumbered({ pics }: { pics: TimKerja[] }) {
    if (pics.length === 0) return <span style={docFont}>—</span>;
    return (
        <span style={{ ...docFont, fontSize: '9.5pt' }}>
            {pics.map((t, i) => (
                <Fragment key={t.id}>
                    {i + 1}. {t.nama}{i < pics.length - 1 ? <br /> : null}
                </Fragment>
            ))}
        </span>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ExportPdf({ tahun, periode, matrix, laporans }: Props) {
    const [rekomendasiPimpinan, setRekomendasiPimpinan] = useState('');

    const groups   = groupBySasaran(matrix);
    const twLabel  = TW_LABELS[periode.triwulan] ?? periode.triwulan;
    let no = 1;

    return (
        <>
            <Head title={`Laporan Kinerja ${twLabel} ${tahun.tahun}`} />

            {/* ─── Screen toolbar ───────────────────────────────────── */}
            <div className="flex justify-end gap-2 p-4 print:hidden">
                <Button onClick={() => window.print()} className="gap-2">
                    <Printer className="h-4 w-4" /> Cetak / Simpan PDF
                </Button>
            </div>

            {/* ─── Document ─────────────────────────────────────────── */}
            <div style={{ ...docFont, maxWidth: '794px', margin: '0 auto', padding: '24px 32px', backgroundColor: '#fff' }}>

                {/* ── Kop Surat ──────────────────────────────────────── */}
                <div style={{ textAlign: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '3px solid #000' }}>
                    <img
                        src="/Logo_of_Ministry_of_Education_and_Culture_of_Republic_of_Indonesia.svg"
                        alt="Logo Kemendikti"
                        style={{ width: '90px', height: '90px', objectFit: 'contain', display: 'block', margin: '0 auto 8px' }}
                    />
                    <p style={{ margin: 0, fontSize: '11pt', fontWeight: 'bold' }}>Kementerian Pendidikan Tinggi, Sains, dan Teknologi</p>
                    <p style={{ margin: '2px 0 0', fontSize: '11pt', fontWeight: 'bold' }}>Lembaga Layanan Pendidikan Tinggi Wilayah III DKI Jakarta</p>
                </div>

                {/* ── Judul ──────────────────────────────────────────── */}
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <p style={{ ...docFont, fontWeight: 'bold', fontSize: '12pt', margin: 0 }}>
                        Laporan Kinerja {twLabel}
                    </p>
                    <p style={{ ...docFont, fontWeight: 'bold', fontSize: '12pt', margin: '2px 0 0' }}>
                        Lembaga Layanan Pendidikan Tinggi Wilayah III DKI Jakarta
                    </p>
                    <p style={{ ...docFont, fontSize: '12pt', margin: '2px 0 0' }}>Tahun {tahun.tahun}</p>
                </div>

                {/* ── Kalimat pengantar ──────────────────────────────── */}
                <p style={{ ...docFont, textAlign: 'justify', marginBottom: '16px' }}>
                    Berikut ini kami sampaikan hasil capaian kinerja pada Lembaga Layanan Pendidikan Tinggi
                    Wilayah III DKI Jakarta selama {twLabel} tahun {tahun.tahun}.
                </p>

                {/* ══════════════════════════════════════════════════════
                    A. Progress Capaian Kinerja
                ══════════════════════════════════════════════════════ */}
                <p style={{ ...docFont, fontWeight: 'bold', marginBottom: '6px' }}>A. Progress Capaian Kinerja</p>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                    <thead>
                        <tr>
                            <th rowSpan={2} style={{ ...thBase, width: '26px' }}>No</th>
                            <th rowSpan={2} style={{ ...thBase, textAlign: 'left' }}>Sasaran / Indikator Kinerja</th>
                            <th rowSpan={2} style={{ ...thBase, width: '55px' }}>Target PK</th>
                            <th rowSpan={2} style={{ ...thBase, width: '48px' }}>Satuan</th>
                            <th colSpan={2} style={{ ...thBase }}>{twLabel}</th>
                            <th rowSpan={2} style={{ ...thBase, width: '90px' }}>PIC Tim Kerja</th>
                        </tr>
                        <tr>
                            <th style={{ ...thBase, width: '52px', fontSize: '9.5pt' }}>Target</th>
                            <th style={{ ...thBase, width: '52px', fontSize: '9.5pt' }}>Realisasi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groups.map(group => (
                            <Fragment key={group.kode}>
                                {/* ─ Sasaran header row ─ */}
                                <tr>
                                    <td colSpan={7} style={{
                                        ...tdBase,
                                        fontWeight: 'bold',
                                        backgroundColor: '#fff',
                                    }}>
                                        [{group.kode}] {group.nama}
                                    </td>
                                </tr>
                                {/* ─ IKU rows ─ */}
                                {group.rows.map(row => {
                                    const currentNo = no++;
                                    return (
                                        <tr key={row.iku_kode}>
                                            <td style={tdCenter}>{currentNo}</td>
                                            <td style={{ ...tdBase, paddingLeft: '16px' }}>
                                                [{row.iku_kode}] {row.iku_nama}
                                            </td>
                                            <td style={tdCenter}>{row.iku_target}</td>
                                            <td style={tdCenter}>{row.iku_satuan}</td>
                                            <td style={tdCenter}>{row.iku_target_tw ?? '—'}</td>
                                            <td style={{
                                                ...tdCenter,
                                                fontWeight: row.realisasi ? 'bold' : 'normal',
                                                color: row.realisasi ? '#000' : '#6b7280',
                                            }}>
                                                {row.realisasi ?? '—'}
                                            </td>
                                            <td style={{ ...tdBase, fontSize: '9.5pt' }}>
                                                <PicNumbered pics={row.pic_tim_kerjas} />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </Fragment>
                        ))}
                    </tbody>
                </table>

                {/* ══════════════════════════════════════════════════════
                    B. Analisis Hasil Capaian Kinerja
                ══════════════════════════════════════════════════════ */}
                <p style={{ ...docFont, fontWeight: 'bold', marginBottom: '10px' }}>B. Analisis Hasil Capaian Kinerja</p>

                {groups.map(group => (
                    <div key={group.kode} style={{ marginBottom: '8px' }}>
                        {/* ── Sasaran heading ── */}
                        <p style={{ ...docFont, fontWeight: 'bold', marginBottom: '4px' }}>
                            [{group.kode}] {group.nama}
                        </p>

                        {group.rows.map(row => (
                            <div key={row.iku_kode} style={{ marginBottom: '16px', paddingLeft: '12px' }}>
                                {/* IKU heading */}
                                <p style={{ ...docFont, fontWeight: 'bold', marginBottom: '8px' }}>
                                    [{row.iku_kode}] {row.iku_nama}
                                </p>

                                {/* Progress/Kegiatan */}
                                <p style={{ ...docFont, fontWeight: 'bold', margin: '0 0 2px' }}>Progress/Kegiatan</p>
                                <p style={{ ...docFont, textAlign: 'justify', marginBottom: '8px', paddingLeft: '8px' }}>
                                    {row.progress_kegiatan
                                        ? row.progress_kegiatan
                                        : <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>—</span>
                                    }
                                </p>

                                {/* Kendala/Permasalahan */}
                                <p style={{ ...docFont, fontWeight: 'bold', margin: '0 0 2px' }}>Kendala/Permasalahan</p>
                                <p style={{ ...docFont, textAlign: 'justify', marginBottom: '8px', paddingLeft: '8px' }}>
                                    {row.kendala
                                        ? row.kendala
                                        : <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>—</span>
                                    }
                                </p>

                                {/* Strategi/Tindak Lanjut */}
                                <p style={{ ...docFont, fontWeight: 'bold', margin: '0 0 2px' }}>Strategi/Tindak Lanjut</p>
                                <p style={{ ...docFont, textAlign: 'justify', marginBottom: '0', paddingLeft: '8px' }}>
                                    {row.strategi_tindak_lanjut
                                        ? row.strategi_tindak_lanjut
                                        : <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>—</span>
                                    }
                                </p>
                            </div>
                        ))}
                    </div>
                ))}

                {/* ══════════════════════════════════════════════════════
                    C. Rekomendasi Pimpinan
                ══════════════════════════════════════════════════════ */}
                <div style={{ marginTop: '24px' }}>
                    <p style={{ ...docFont, fontWeight: 'bold', marginBottom: '8px' }}>C. Rekomendasi Pimpinan</p>

                    {/* Screen: editable textarea */}
                    <div className="print:hidden mb-2">
                        <p className="text-xs text-muted-foreground mb-1">
                            Isi rekomendasi pimpinan sebelum mencetak:
                        </p>
                        <Textarea
                            rows={5}
                            placeholder="Tuliskan rekomendasi pimpinan di sini..."
                            value={rekomendasiPimpinan}
                            onChange={e => setRekomendasiPimpinan(e.target.value)}
                            className="font-serif text-sm"
                        />
                    </div>

                    {/* Print: show text */}
                    <div style={{ ...docFont, paddingLeft: '8px', minHeight: '80px' }}>
                        {rekomendasiPimpinan
                            ? rekomendasiPimpinan.split('\n').map((line, i) => (
                                <p key={i} style={{ margin: '0 0 4px' }}>{line || <br />}</p>
                            ))
                            : (
                                // Show placeholder lines for manual fill-in when printed without input
                                <p style={{ color: '#9ca3af', fontStyle: 'italic' }} className="print:hidden">
                                    (belum diisi)
                                </p>
                            )
                        }
                        {!rekomendasiPimpinan && (
                            <div className="hidden print:block">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <p key={i} style={{ margin: '0 0 14px', borderBottom: '1px dotted #999', width: '100%' }}>&nbsp;</p>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ══════════════════════════════════════════════════════
                    Tanda Tangan
                ══════════════════════════════════════════════════════ */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '40px' }}>
                    <tbody>
                        <tr>
                            <td style={{ ...docFont, width: '50%', textAlign: 'center', verticalAlign: 'top', padding: '4px' }}>
                                <p style={{ margin: 0 }}>Mengetahui,</p>
                                <p style={{ margin: '2px 0 0', fontWeight: 'bold' }}>Kepala Bagian Umum</p>
                                <div style={{ height: '64px' }}></div>
                                <p style={{ margin: 0 }}>(__________________________)</p>
                            </td>
                            <td style={{ ...docFont, width: '50%', textAlign: 'center', verticalAlign: 'top', padding: '4px' }}>
                                <p style={{ margin: 0 }}>Jakarta, ___________________</p>
                                <p style={{ margin: '2px 0 0', fontWeight: 'bold' }}>Kepala LLDIKTI Wilayah III</p>
                                <div style={{ height: '64px' }}></div>
                                <p style={{ margin: 0 }}>(__________________________)</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <style>{`
                @media print {
                    @page { size: A4 portrait; margin: 1.5cm; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .print\\:hidden { display: none !important; }
                    .hidden.print\\:block { display: block !important; }
                }
            `}</style>
        </>
    );
}
