<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DjaRevisi extends Model
{
    public $timestamps = false;

    protected $table = 'dja_revisi';

    protected $fillable = [
        'tahun_anggaran_id',
        'nomor_revisi',
        'user_id',
        'catatan',
    ];

    protected $casts = [
        'nomor_revisi' => 'integer',
    ];

    public function tahunAnggaran(): BelongsTo
    {
        return $this->belongsTo(TahunAnggaran::class, 'tahun_anggaran_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function detail(): HasMany
    {
        return $this->hasMany(DjaRevisiDetail::class, 'dja_revisi_id');
    }

    /** Dapatkan nomor revisi berikutnya untuk tahun anggaran tertentu */
    public static function nextNomorRevisi(int $tahunAnggaranId): int
    {
        $last = static::where('tahun_anggaran_id', $tahunAnggaranId)
            ->max('nomor_revisi');

        return ($last ?? 0) + 1;
    }
}
