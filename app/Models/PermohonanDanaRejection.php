<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PermohonanDanaRejection extends Model
{
    protected $table = 'permohonan_dana_rejections';

    protected $fillable = [
        'permohonan_dana_id',
        'rejected_by',
        'rejected_at_step',
        'catatan',
        'rejected_at',
    ];

    protected $casts = [
        'rejected_at' => 'datetime',
    ];

    public function permohonanDana(): BelongsTo
    {
        return $this->belongsTo(PermohonanDana::class, 'permohonan_dana_id');
    }

    public function rejectedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rejected_by');
    }
}
