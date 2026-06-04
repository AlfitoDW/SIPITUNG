import {
    Calendar, Clock, MapPin, User, Briefcase,
    CalendarCheck, CalendarRange,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const fmtDate = (s?: string | null) =>
    s ? new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : null;

interface PersonRef {
    nama_lengkap: string;
}

export interface PermohonanStep2Data {
    tanggal_mulai?: string | null;
    tanggal_selesai?: string | null;
    jam_pelaksanaan?: string | null;
    tempat?: string | null;
    tgl_pertanggungjawaban?: string | null;
    kapokja?: PersonRef | null;
    pic_keuangan?: PersonRef | null;
}

function Field({
    icon, label, value, full,
}: {
    icon: ReactNode;
    label: string;
    value: ReactNode;
    full?: boolean;
}) {
    return (
        <div className={`flex items-start gap-2.5 p-3 rounded-lg border bg-slate-50/40 ${full ? 'sm:col-span-2' : ''}`}>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-100 text-blue-600">
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">{label}</div>
                <div className="text-sm text-gray-900 font-medium break-words">
                    {value || <span className="text-gray-400 italic font-normal">—</span>}
                </div>
            </div>
        </div>
    );
}

function PersonField({ label, person, role }: { label: string; person: PersonRef | null | undefined; role: 'kapokja' | 'pic' }) {
    return (
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-slate-50/40">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                role === 'kapokja' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
            }`}>
                <User className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">{label}</div>
                <div className="text-sm text-gray-900 font-semibold truncate">
                    {person?.nama_lengkap || <span className="text-gray-400 italic font-normal">—</span>}
                </div>
            </div>
        </div>
    );
}

export default function Step2Waktu({ pd }: { pd: PermohonanStep2Data }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <Calendar className="h-4 w-4 text-blue-600" /> Waktu & Penanggung Jawab
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
                {/* ── Pelaksanaan Kegiatan ── */}
                <div>
                    <h4 className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-2 px-1 flex items-center gap-1.5">
                        <CalendarRange className="h-3 w-3" /> Pelaksanaan Kegiatan
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <Field
                            icon={<Calendar className="h-3.5 w-3.5" />}
                            label="Tanggal Mulai"
                            value={fmtDate(pd.tanggal_mulai)}
                        />
                        <Field
                            icon={<Calendar className="h-3.5 w-3.5" />}
                            label="Tanggal Selesai"
                            value={fmtDate(pd.tanggal_selesai)}
                        />
                        <Field
                            icon={<Clock className="h-3.5 w-3.5" />}
                            label="Waktu Pelaksanaan"
                            value={pd.jam_pelaksanaan}
                        />
                        <Field
                            icon={<MapPin className="h-3.5 w-3.5" />}
                            label="Tempat"
                            value={pd.tempat}
                        />
                        <Field
                            icon={<CalendarCheck className="h-3.5 w-3.5" />}
                            label="Waktu Penyelesaian Pertanggungjawaban (sesuai RPD)"
                            value={fmtDate(pd.tgl_pertanggungjawaban)}
                            full
                        />
                    </div>
                </div>

                {/* ── Penanggung Jawab ── */}
                <div>
                    <h4 className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-2 px-1 flex items-center gap-1.5">
                        <Briefcase className="h-3 w-3" /> Penanggung Jawab
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <PersonField label="Ketua Tim Kerja" person={pd.kapokja} role="kapokja" />
                        <PersonField label="PIC Keuangan" person={pd.pic_keuangan} role="pic" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// File extension untuk dokumen tipe lainnya bisa ditambahkan di sini.
