<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TimKerja extends Model
{
    use HasFactory;

    protected $table = 'tim_kerja';

    protected $fillable = [
        'nama',
        'kode',
        'nama_singkat',
        'deskripsi',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function users()
    {
        return $this->hasMany(User::class, 'tim_kerja_id');
    }

    public function ketua()
    {
        return $this->hasOne(User::class, 'tim_kerja_id')
            ->where('role', 'ketua_tim_kerja')
            ->where('is_active', true);
    }

    public function pumk()
    {
        return $this->hasOne(User::class, 'tim_kerja_id')
            ->where('role', 'pumk')
            ->where('is_active', true);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
