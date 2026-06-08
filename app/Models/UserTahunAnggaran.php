<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserTahunAnggaran extends Model
{
    use HasFactory;

    protected $table = 'user_tahun_anggaran';

    protected $fillable = [
        'user_id',
        'tahun_anggaran_id',
        'tim_kerja_id',
        'role',
        'pimpinan_type',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function tahunAnggaran(): BelongsTo
    {
        return $this->belongsTo(TahunAnggaran::class);
    }

    public function timKerja(): BelongsTo
    {
        return $this->belongsTo(TimKerja::class);
    }
}
