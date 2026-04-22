<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class TahunAnggaran extends Model
{
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

    public static function forSession(): ?self
    {
        $id = session('tahun_anggaran_id');

        if ($id) {
            return static::find($id);
        }

        return static::where('is_default', true)->first();
    }
}
