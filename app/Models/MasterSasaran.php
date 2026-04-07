<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MasterSasaran extends Model
{
    protected $table = 'master_sasaran';

    protected $fillable = ['tahun_anggaran_id', 'kode', 'nama', 'urutan'];

    public function tahunAnggaran(): BelongsTo
    {
        return $this->belongsTo(TahunAnggaran::class);
    }
}
