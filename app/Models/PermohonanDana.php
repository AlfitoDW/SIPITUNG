<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class PermohonanDana extends Model
{
    protected $table = 'permohonan_dana';

    protected $fillable = [
        'tahun_anggaran_id',
        'tim_kerja_id',
        // DJA Hierarchy
        'dja_program_id',
        'dja_sasaran_id',
        'dja_kro_id',
        'dja_ro_id',
        'dja_komponen_id',
        'dja_kegiatan_id',
        'judul_pekerjaan',
        // Identitas
        'nomor_permohonan',
        'keperluan',
        // Waktu
        'tanggal_mulai',
        'tanggal_selesai',
        'jam_pelaksanaan',
        'tgl_pertanggungjawaban',
        // PJ
        'kapokja_id',
        'pic_keuangan_id',
        'tempat',
        // Surat
        'no_sk', 'tgl_sk', 'no_st', 'tgl_st',
        'keterangan',
        'total_anggaran',
        'status',
        'wizard_step',
        // Approval
        'katim_approved_by', 'catatan_katim', 'katim_approved_at',
        'kabag_approved_by', 'catatan_kabag', 'kabag_approved_at',
        'ppk_approved_by',   'catatan_ppk',   'ppk_approved_at',
        'pic_approved_by',   'catatan_pic',   'pic_approved_at',
        'dicairkan_by',      'catatan_pencairan', 'dicairkan_at', 'tgl_nominatif',
        'rejected_at_step',  'catatan_penolakan', 'rejected_at',
        'submitted_at',
        'created_by',
        // Bukti bayar
        'bukti_bayar_path', 'bukti_bayar_nama_file', 'bukti_bayar_uploaded_at', 'bukti_bayar_uploaded_by',
    ];

    protected $casts = [
        'tanggal_mulai' => 'date',
        'tanggal_selesai' => 'date',
        'tgl_sk' => 'date',
        'tgl_st' => 'date',
        'tgl_pertanggungjawaban' => 'date',
        'total_anggaran' => 'decimal:2',
        'tgl_nominatif' => 'date',
        // Approval timestamps
        'submitted_at' => 'datetime',
        'katim_approved_at' => 'datetime',
        'kabag_approved_at' => 'datetime',
        'ppk_approved_at' => 'datetime',
        'pic_approved_at' => 'datetime',
        'dicairkan_at' => 'datetime',
        'rejected_at' => 'datetime',
        'bukti_bayar_uploaded_at' => 'datetime',
        'wizard_step' => 'integer',
    ];

    // ─── Status helpers ───────────────────────────────────────────────────────────

    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    public function isSubmitted(): bool
    {
        return $this->status === 'submitted';
    }

    public function isKatimApproved(): bool
    {
        return $this->status === 'katim_approved';
    }

    public function isKabagApproved(): bool
    {
        return $this->status === 'kabag_approved';
    }

    public function isPpkApproved(): bool
    {
        return $this->status === 'ppk_approved';
    }

    public function isPicApproved(): bool
    {
        return $this->status === 'pic_approved';
    }

    public function isDicairkan(): bool
    {
        return $this->status === 'dicairkan';
    }

    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }

    /** PUMK dapat edit saat draft atau rejected */
    public function isEditable(): bool
    {
        return in_array($this->status, ['draft', 'rejected']);
    }

    /** Label status untuk tampilan */
    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            'draft' => 'Draft',
            'submitted',
            'katim_approved',
            'kabag_approved',
            'ppk_approved',
            'pic_approved' => 'diajukan',
            'dicairkan' => 'Selesai',
            'rejected' => 'Revisi',
            default => $this->status,
        };
    }

    // ─── Relationships ─────────────────────────────────────────────────────────────

    public function tahunAnggaran(): BelongsTo
    {
        return $this->belongsTo(TahunAnggaran::class, 'tahun_anggaran_id');
    }

    public function timKerja(): BelongsTo
    {
        return $this->belongsTo(TimKerja::class, 'tim_kerja_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function katimApprovedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'katim_approved_by');
    }

    public function kabagApprovedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'kabag_approved_by');
    }

    public function ppkApprovedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'ppk_approved_by');
    }

    public function picApprovedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pic_approved_by');
    }

    public function dicairkanBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dicairkan_by');
    }

    public function buktiBayarUploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'bukti_bayar_uploaded_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(PermohonanDanaItem::class)->orderBy('urutan');
    }

    public function dokumens(): HasMany
    {
        return $this->hasMany(PermohonanDanaDokumen::class, 'permohonan_dana_id');
    }

    public function nominatifPeserta(): HasManyThrough
    {
        return $this->hasManyThrough(
            PermohonanDanaItemNominatif::class,
            PermohonanDanaItem::class,
            'permohonan_dana_id',
            'permohonan_dana_item_id',
        );
    }

    // ─── DJA Relationships ────────────────────────────────────────────────────────

    public function djaProgram(): BelongsTo
    {
        return $this->belongsTo(DjaProgram::class, 'dja_program_id');
    }

    public function djaSasaran(): BelongsTo
    {
        return $this->belongsTo(DjaSasaran::class, 'dja_sasaran_id');
    }

    public function djaKro(): BelongsTo
    {
        return $this->belongsTo(DjaKro::class, 'dja_kro_id');
    }

    public function djaRo(): BelongsTo
    {
        return $this->belongsTo(DjaRo::class, 'dja_ro_id');
    }

    public function djaKomponen(): BelongsTo
    {
        return $this->belongsTo(DjaKomponen::class, 'dja_komponen_id');
    }

    public function djaKegiatan(): BelongsTo
    {
        return $this->belongsTo(DjaKegiatan::class, 'dja_kegiatan_id');
    }

    public function kapokja(): BelongsTo
    {
        return $this->belongsTo(User::class, 'kapokja_id');
    }

    public function picKeuangan(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pic_keuangan_id');
    }

    /** Format nomor permohonan: SEQ/LL3/PerD/BULAN-ROMAWI/TAHUN */
    public static function generateNomor(int $tahunAnggaranId, string $tahun): string
    {
        $roman = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
        $bulan = $roman[(int) now()->format('n')];

        // Ambil nomor urut tertinggi yang sudah dipakai untuk tahun anggaran ini,
        // lalu increment — aman meski ada record yang dihapus.
        $lastNomor = static::where('tahun_anggaran_id', $tahunAnggaranId)
            ->whereNotNull('nomor_permohonan')
            ->max('nomor_permohonan');

        $seq = 1;
        if ($lastNomor) {
            // Format: "005/LL3/PerD/IV/2026" — ambil 3 karakter pertama
            $seq = (int) substr($lastNomor, 0, 3) + 1;
        }

        // Pastikan nomor belum dipakai (guard tambahan)
        do {
            $nomor = str_pad($seq, 3, '0', STR_PAD_LEFT).'/LL3/PerD/'.$bulan.'/'.$tahun;
            $exists = static::where('nomor_permohonan', $nomor)->exists();
            if ($exists) {
                $seq++;
            }
        } while ($exists);

        return $nomor;
    }
}
