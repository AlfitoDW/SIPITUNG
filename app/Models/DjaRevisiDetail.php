<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DjaRevisiDetail extends Model
{
    public $timestamps = false;

    protected $table = 'dja_revisi_detail';

    protected $fillable = [
        'dja_revisi_id',
        'level',
        'kode_item',
        'parent_kode',
        'nama_item',
        'jenis_perubahan',
        'pagu_lama',
        'pagu_baru',
        'status_eksekusi',
        'keterangan',
    ];

    protected $casts = [
        'pagu_lama' => 'decimal:2',
        'pagu_baru' => 'decimal:2',
    ];

    public function djaRevisi(): BelongsTo
    {
        return $this->belongsTo(DjaRevisi::class, 'dja_revisi_id');
    }
}
