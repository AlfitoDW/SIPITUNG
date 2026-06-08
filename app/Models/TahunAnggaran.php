<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TahunAnggaran extends Model
{
    use \Illuminate\Database\Eloquent\Factories\HasFactory;
    protected $table = 'tahun_anggaran';

    protected $fillable = [
        'tahun',
        'label',
        'is_active',
        'is_default',
        'batas_pengisian_ra',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_default' => 'boolean',
            'batas_pengisian_ra' => 'datetime',
        ];
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeDefault(Builder $query): Builder
    {
        return $query->where('is_default', true);
    }

    public function permohonanDana(): HasMany
    {
        return $this->hasMany(PermohonanDana::class, 'tahun_anggaran_id');
    }

    public function userAssignments(): HasMany
    {
        return $this->hasMany(UserTahunAnggaran::class, 'tahun_anggaran_id');
    }

    public function hasUserAssignments(): bool
    {
        return $this->userAssignments()->exists();
    }

    public static function forSession(): ?self
    {
        $id = session('tahun_anggaran_id');

        if ($id) {
            return static::find($id);
        }

        return static::where('is_default', true)->first();
    }
}
