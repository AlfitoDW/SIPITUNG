<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RefNama extends Model
{
    use HasFactory;
    protected $table = 'ref_nama';

    protected $fillable = [
        'nama', 'nip', 'nik', 'npwp',
        'gol_ruang', 'status_kepegawaian',
        'nama_rekening', 'no_rekening', 'nama_bank',
        'email', 'pph21_persen', 'is_aktif',
    ];

    protected $casts = [
        'is_aktif' => 'boolean',
        'pph21_persen' => 'decimal:2',
    ];

    public function scopeAktif($query)
    {
        return $query->where('is_aktif', true);
    }

    /**
     * Hitung tarif PPh21 otomatis berdasarkan golongan & status kepegawaian.
     * Sesuai aturan SIPITUNG lama.
     */
    public static function hitungPph21(string $status, ?string $gol, ?string $npwp): float
    {
        if ($status === 'Non-PNS') {
            return $npwp ? 3.0 : 2.5;
        }

        // PNS — berdasarkan golongan
        if (! $gol) {
            return 0;
        }
        $golKelas = strtoupper(explode('/', $gol)[0]); // 'II', 'III', 'IV'

        return match (true) {
            str_starts_with($golKelas, 'IV') => 15.0,
            str_starts_with($golKelas, 'III') => 5.0,
            default => 0.0,
        };
    }
}
