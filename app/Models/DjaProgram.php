<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DjaProgram extends Model
{
    protected $table = 'dja_program';

    protected $fillable = ['tahun_anggaran', 'kode', 'nama', 'pagu', 'is_aktif'];

    protected $casts = ['is_aktif' => 'boolean', 'pagu' => 'integer'];

    public function sasarans(): HasMany
    {
        return $this->hasMany(DjaSasaran::class, 'program_id');
    }
}
