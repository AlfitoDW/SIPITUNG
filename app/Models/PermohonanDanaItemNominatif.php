<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PermohonanDanaItemNominatif extends Model
{
    protected $table = 'permohonan_dana_item_nominatif';

    protected $fillable = [
        'permohonan_dana_item_id',
        'permohonan_dana_id',
        'ref_nama_id',
        'nama', 'nip', 'nik', 'npwp', 'gol_ruang',
        'nama_rekening', 'no_rekening', 'nama_bank', 'email', 'pph21_persen',
        // Honor
        'jabatan', 'volume', 'harga_satuan', 'jumlah_bruto', 'jumlah_pajak', 'jumlah_diterima',
        // Perjadin
        'transport',
        'uang_harian_vol', 'uang_harian_satuan', 'uang_harian_jumlah',
        'fullboard_vol', 'fullboard_satuan', 'fullboard_jumlah',
        'fullday_vol', 'fullday_satuan', 'fullday_jumlah',
        'representasi', 'taksi_pp', 'tiket_pesawat', 'hotel', 'jumlah_perjadin',
        'urutan',
    ];

    protected $casts = [
        'pph21_persen' => 'decimal:2',
        'volume' => 'decimal:2',
        'harga_satuan' => 'decimal:2',
        'jumlah_bruto' => 'decimal:2',
        'jumlah_pajak' => 'decimal:2',
        'jumlah_diterima' => 'decimal:2',
        'transport' => 'decimal:2',
        'uang_harian_vol' => 'decimal:2',
        'uang_harian_satuan' => 'decimal:2',
        'uang_harian_jumlah' => 'decimal:2',
        'fullboard_vol' => 'decimal:2',
        'fullboard_satuan' => 'decimal:2',
        'fullboard_jumlah' => 'decimal:2',
        'fullday_vol' => 'decimal:2',
        'fullday_satuan' => 'decimal:2',
        'fullday_jumlah' => 'decimal:2',
        'representasi' => 'decimal:2',
        'taksi_pp' => 'decimal:2',
        'tiket_pesawat' => 'decimal:2',
        'hotel' => 'decimal:2',
        'jumlah_perjadin' => 'decimal:2',
    ];

    public function item(): BelongsTo
    {
        return $this->belongsTo(PermohonanDanaItem::class, 'permohonan_dana_item_id');
    }

    public function pegawai(): BelongsTo
    {
        return $this->belongsTo(RefNama::class, 'ref_nama_id');
    }
}
