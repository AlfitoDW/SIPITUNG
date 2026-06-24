import { FileText, XCircle } from 'lucide-react';

function getFileType(path: string): 'pdf' | 'image' | 'other' {
    const ext = path.split('.').pop()?.toLowerCase() ?? '';
    if (ext === 'pdf') return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
    return 'other';
}

export default function DocPreviewModal({ url, nama, onClose }: { url: string; nama: string; onClose: () => void }) {
    const type = getFileType(nama);
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="relative flex flex-col bg-white rounded-xl shadow-2xl overflow-hidden"
                style={{ width: '90vw', maxWidth: 960, height: '90vh' }}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between gap-3 px-4 py-3 border-b bg-gray-50">
                    <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 shrink-0 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700 truncate">{nama}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <a href={url} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 underline underline-offset-2">
                            Buka di tab baru
                        </a>
                        <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-200 transition-colors">
                            <XCircle className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-hidden">
                    {type === 'pdf' && <iframe src={url} className="w-full h-full border-0" title={nama} />}
                    {type === 'image' && (
                        <div className="flex items-center justify-center h-full bg-gray-100 overflow-auto p-4">
                            <img src={url} alt={nama} className="max-w-full max-h-full object-contain rounded shadow" />
                        </div>
                    )}
                    {type === 'other' && (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-500">
                            <FileText className="w-16 h-16 text-gray-300" />
                            <p className="text-sm">Pratinjau tidak tersedia.</p>
                            <a href={url} target="_blank" rel="noopener noreferrer"
                                className="text-sm font-medium text-blue-600 hover:text-blue-800 underline">
                                Download / Buka file
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
