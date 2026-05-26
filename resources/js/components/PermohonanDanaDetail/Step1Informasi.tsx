import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ClipboardList, FileText, Hash, User, FolderTree,
    Target, Layers, Boxes, Workflow, Activity,
} from 'lucide-react';

interface DjaCode {
    kode?: string;
    nama: string;
}

export interface PermohonanStep1Data {
    nomor_permohonan: string;
    created_by_name?: string | null;
    judul_pekerjaan?: string | null;
    keperluan?: string | null;
    dja_program?: { nama: string } | null;
    dja_sasaran?: { nama: string } | null;
    dja_kro?: DjaCode | null;
    dja_ro?: { nama: string } | null;
    dja_komponen?: { nama: string } | null;
    dja_kegiatan?: DjaCode | null;
}

function Field({
    icon, label, value, mono, full,
}: {
    icon: ReactNode;
    label: string;
    value: ReactNode;
    mono?: boolean;
    full?: boolean;
}) {
    return (
        <div className={`flex items-start gap-2.5 p-3 rounded-lg border bg-slate-50/40 ${full ? 'sm:col-span-2' : ''}`}>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-100 text-blue-600">
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">{label}</div>
                <div className={`text-sm text-gray-900 font-medium break-words ${mono ? 'font-mono' : ''}`}>
                    {value || <span className="text-gray-400 italic font-normal">—</span>}
                </div>
            </div>
        </div>
    );
}

export default function Step1Informasi({ pd }: { pd: PermohonanStep1Data }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <ClipboardList className="h-4 w-4 text-blue-600" /> Informasi Kegiatan
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
                {/* ── Identitas Permohonan ── */}
                <div>
                    <h4 className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-2 px-1">Identitas Permohonan</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <Field
                            icon={<Hash className="h-3.5 w-3.5" />}
                            label="No. Permohonan"
                            value={pd.nomor_permohonan}
                            mono
                        />
                        <Field
                            icon={<User className="h-3.5 w-3.5" />}
                            label="Diajukan Oleh"
                            value={pd.created_by_name}
                        />
                        <Field
                            icon={<FileText className="h-3.5 w-3.5" />}
                            label="Judul Pekerjaan"
                            value={pd.judul_pekerjaan ?? pd.keperluan}
                            full
                        />
                    </div>
                </div>

                {/* ── Struktur Anggaran (DJA) ── */}
                <div>
                    <h4 className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-2 px-1 flex items-center gap-1.5">
                        <FolderTree className="h-3 w-3" /> Struktur Anggaran (DJA)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <Field
                            icon={<Target className="h-3.5 w-3.5" />}
                            label="Program"
                            value={pd.dja_program?.nama}
                        />
                        <Field
                            icon={<Activity className="h-3.5 w-3.5" />}
                            label="Sasaran"
                            value={pd.dja_sasaran?.nama}
                        />
                        <Field
                            icon={<Layers className="h-3.5 w-3.5" />}
                            label="KRO"
                            value={pd.dja_kro ? `${pd.dja_kro.kode} — ${pd.dja_kro.nama}` : null}
                        />
                        <Field
                            icon={<Layers className="h-3.5 w-3.5" />}
                            label="RO"
                            value={pd.dja_ro?.nama}
                        />
                        <Field
                            icon={<Boxes className="h-3.5 w-3.5" />}
                            label="Komponen"
                            value={pd.dja_komponen?.nama}
                        />
                        <Field
                            icon={<Workflow className="h-3.5 w-3.5" />}
                            label="Kegiatan"
                            value={pd.dja_kegiatan ? `${pd.dja_kegiatan.kode} — ${pd.dja_kegiatan.nama}` : null}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
