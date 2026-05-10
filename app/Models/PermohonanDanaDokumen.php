<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PermohonanDanaDokumen extends Model
{
    protected $table = 'permohonan_dana_dokumen';

    protected $fillable = [
        'permohonan_dana_id', 'jenis_dokumen_id', 'nama_jenis',
        'nama_file', 'path_file', 'ukuran_file',
    ];

    public static array $JENIS = [
        1 => 'Rincian Kebutuhan Biaya',
        2 => 'Surat Keputusan Pelaksanaan Kegiatan',
        3 => 'Surat Tugas Kepanitian',
        4 => 'Surat Undangan Kegiatan',
        5 => 'Surat Pernyataan Kegiatan Luar Kantor',
        6 => 'Kuitansi / Bukti Pembayaran',
        7 => 'SPK / Surat Perjanjian',
        8 => 'Dokumen Lainnya',
    ];

    public function permohonanDana(): BelongsTo
    {
        return $this->belongsTo(PermohonanDana::class, 'permohonan_dana_id');
    }
}
