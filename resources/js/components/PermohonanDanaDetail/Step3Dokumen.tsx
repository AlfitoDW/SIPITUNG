import { FileText, Eye, FileType, FileSpreadsheet, Image as ImageIcon, FileImage, File } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface Dokumen {
    id: number;
    nama_jenis: string;
    nama_file: string;
    path_file: string;
}

const getFileIcon = (nama: string) => {
    const ext = nama.split('.').pop()?.toLowerCase() ?? '';
    if (ext === 'pdf') return { Icon: FileType, color: 'text-red-500 bg-red-50 border-red-100' };
    if (['xls', 'xlsx', 'csv'].includes(ext)) return { Icon: FileSpreadsheet, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' };
    if (['doc', 'docx'].includes(ext)) return { Icon: FileText, color: 'text-blue-600 bg-blue-50 border-blue-100' };
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return { Icon: FileImage, color: 'text-purple-600 bg-purple-50 border-purple-100' };
    return { Icon: File, color: 'text-slate-500 bg-slate-50 border-slate-100' };
};

const getFileExt = (nama: string) => nama.split('.').pop()?.toUpperCase() ?? 'FILE';

export default function Step3Dokumen({
    dokumens,
    onPreview,
}: {
    dokumens: Dokumen[];
    onPreview: (dok: Dokumen) => void;
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <FileText className="h-4 w-4 text-blue-600" /> Dokumen Pendukung
                    {dokumens.length > 0 && (
                        <span className="ml-auto text-xs font-normal text-gray-400">{dokumens.length} dokumen</span>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {dokumens.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                            <ImageIcon className="w-6 h-6 text-slate-300" />
                        </div>
                        <p className="text-sm text-gray-500">Belum ada dokumen diupload</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {dokumens.map((dok, i) => {
                            const { Icon, color } = getFileIcon(dok.nama_file);
                            const ext = getFileExt(dok.nama_file);
                            return (
                                <div
                                    key={dok.id}
                                    className="group rounded-lg border bg-white hover:border-blue-300 hover:shadow-sm transition-all p-3"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border', color)}>
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-[10px] font-mono text-gray-400">#{i + 1}</span>
                                                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                                    {ext}
                                                </span>
                                            </div>
                                            <h4 className="text-sm font-semibold text-gray-900 truncate" title={dok.nama_jenis}>
                                                {dok.nama_jenis}
                                            </h4>
                                            <p className="text-[11px] text-gray-500 truncate mt-0.5" title={dok.nama_file}>
                                                {dok.nama_file}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end mt-3 pt-3 border-t border-slate-100">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button
                                                    type="button"
                                                    onClick={() => onPreview(dok)}
                                                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2.5 py-1 rounded-md transition-colors font-medium"
                                                >
                                                    <Eye className="w-3.5 h-3.5" /> Lihat Dokumen
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent>Preview {dok.nama_jenis}</TooltipContent>
                                        </Tooltip>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
