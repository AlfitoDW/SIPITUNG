import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { Fragment } from 'react';

type TimKerja  = { id: number; nama: string };
type TwData    = { tw: string; target: string | null; realisasi: string | null };
type MatrixRow = {
    sasaran_kode: string; sasaran_nama: string;
    iku_kode: string; iku_nama: string;
    iku_satuan: string; iku_target: string;
    pic_tim_kerjas: TimKerja[];
    input_by_tim_kerja: TimKerja | null;
    tw: TwData[];
};
type Tahun = { id: number; tahun: number; label: string };
type Props  = { tahun: Tahun; matrix: MatrixRow[] };

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

const font = { fontFamily: '"Times New Roman", Times, serif', fontSize: '10pt' };

const thBase: React.CSSProperties = {
    ...font,
    border: '1px solid #000',
    padding: '5px 6px',
    textAlign: 'center',
    verticalAlign: 'middle',
    color: '#fff',
    backgroundColor: '#003580',
    fontWeight: 'bold',
};

const thSub: React.CSSProperties = {
    ...thBase,
    backgroundColor: '#004099',
    fontWeight: 'normal',
    fontSize: '9pt',
};

const tdBase: React.CSSProperties = {
    ...font,
    border: '1px solid #000',
    padding: '5px 6px',
    verticalAlign: 'top',
};

const tdCenter: React.CSSProperties = { ...tdBase, textAlign: 'center', verticalAlign: 'middle' };

export default function ExportPdf({ tahun, matrix }: Props) {
    const groups = groupBySasaran(matrix);
    let no = 1;

    return (
        <>
            <Head title={`Export Realisasi Kinerja ${tahun.tahun}`} />

            <div className="p-4 print:p-0">
                <div className="flex justify-end mb-4 print:hidden">
                    <Button onClick={() => window.print()} className="gap-2">
                        <Printer className="h-4 w-4" /> Cetak / Simpan PDF
                    </Button>
                </div>

                <div style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                    {/* Title */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2px' }}>
                        <tbody>
                            <tr>
                                <td style={{
                                    ...font,
                                    border: '1px solid #000',
                                    padding: '7px 10px',
                                    textAlign: 'center',
                                    backgroundColor: '#003580',
                                    color: '#fff',
                                    fontWeight: 'bold',
                                    fontSize: '12pt',
                                    letterSpacing: '0.02em',
                                }}>
                                    Realisasi Kinerja — {tahun.label}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Main table */}
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            {/* Row 1 */}
                            <tr>
                                <th rowSpan={2} style={{ ...thBase, width: '22px' }}>No</th>
                                <th rowSpan={2} style={{ ...thBase, textAlign: 'left', width: '110px' }}>Sasaran</th>
                                <th rowSpan={2} style={{ ...thBase, width: '55px' }}>Kode IKU</th>
                                <th rowSpan={2} style={{ ...thBase, textAlign: 'left' }}>Indikator Kinerja</th>
                                <th rowSpan={2} style={{ ...thBase, width: '48px' }}>Satuan</th>
                                <th rowSpan={2} style={{ ...thBase, width: '48px' }}>Target PK</th>
                                <th rowSpan={2} style={{ ...thBase, width: '90px' }}>PIC Tim Kerja</th>
                                <th rowSpan={2} style={{ ...thBase, width: '80px' }}>Diisi Oleh</th>
                                {(['TW1', 'TW2', 'TW3', 'TW4'] as const).map(tw => (
                                    <th key={tw} colSpan={2} style={{ ...thBase, width: '96px' }}>
                                        {TW_LABELS[tw]}
                                    </th>
                                ))}
                            </tr>
                            {/* Row 2 — sub-headers */}
                            <tr>
                                {(['TW1', 'TW2', 'TW3', 'TW4'] as const).map(tw => (
                                    <Fragment key={tw}>
                                        <th style={{ ...thSub, width: '48px' }}>Target</th>
                                        <th style={{ ...thSub, width: '48px' }}>Realisasi</th>
                                    </Fragment>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {groups.map(group => (
                                <Fragment key={group.kode}>
                                    {group.rows.map((row, rowIdx) => {
                                        const currentNo = no++;
                                        return (
                                            <tr key={row.iku_kode}>
                                                <td style={tdCenter}>{currentNo}</td>

                                                {/* Sasaran — hanya di baris pertama grup */}
                                                {rowIdx === 0 && (
                                                    <td rowSpan={group.rows.length} style={{ ...tdBase, fontWeight: 'bold', verticalAlign: 'top' }}>
                                                        {group.kode}
                                                        <br />
                                                        <span style={{ fontWeight: 'normal', fontSize: '9pt' }}>{group.nama}</span>
                                                    </td>
                                                )}

                                                <td style={{ ...tdCenter, fontSize: '9pt', color: '#374151' }}>{row.iku_kode}</td>
                                                <td style={{ ...tdBase }}>{row.iku_nama}</td>
                                                <td style={tdCenter}>{row.iku_satuan}</td>
                                                <td style={tdCenter}>{row.iku_target}</td>

                                                {/* PIC — multi-PIC */}
                                                <td style={{ ...tdBase, textAlign: 'center', verticalAlign: 'middle', fontSize: '9pt' }}>
                                                    {row.pic_tim_kerjas.length > 0
                                                        ? row.pic_tim_kerjas.map(t => t.nama).join(', ')
                                                        : '—'}
                                                </td>

                                                <td style={{ ...tdBase, textAlign: 'center', verticalAlign: 'middle', fontSize: '9pt' }}>
                                                    {row.input_by_tim_kerja?.nama ?? '—'}
                                                </td>

                                                {row.tw.map(twItem => (
                                                    <Fragment key={twItem.tw}>
                                                        <td style={tdCenter}>{twItem.target ?? '—'}</td>
                                                        <td style={{ ...tdCenter, fontWeight: twItem.realisasi ? 'bold' : 'normal' }}>
                                                            {twItem.realisasi ?? '—'}
                                                        </td>
                                                    </Fragment>
                                                ))}
                                            </tr>
                                        );
                                    })}
                                </Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <style>{`
                @media print {
                    @page { size: A3 landscape; margin: 1cm; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .print\\:hidden { display: none !important; }
                }
            `}</style>
        </>
    );
}
