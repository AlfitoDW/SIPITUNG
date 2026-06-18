<?php

use App\Models\DjaRincianBiaya;
use App\Models\PermohonanDana;
use App\Models\PermohonanDanaItemNominatif;
use App\Models\TahunAnggaran;
use App\Models\TimKerja;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->tahunAnggaran = TahunAnggaran::factory()->create();
    $this->timKerja = TimKerja::factory()->create();

    $this->pumk = User::factory()->pumk()->create([
        'tim_kerja_id' => $this->timKerja->id,
    ]);

    $this->kapokja = User::factory()->ketuaTim()->create([
        'tim_kerja_id' => $this->timKerja->id,
    ]);

    $this->pic = User::factory()->picKeuangan()->create();
});

describe('rincian biaya step 4', function () {
    it('blocks removing item that already has nominatif', function () {
        // ── Setup: buat hierarchy DJA & 2 rincian biaya ─────────────────────────
        $kegiatan = \App\Models\DjaKegiatan::factory()->create([
            'komponen_id' => \App\Models\DjaKomponen::factory()->create([
                'ro_id' => \App\Models\DjaRo::factory()->create([
                    'kro_id' => \App\Models\DjaKro::factory()->create([
                        'sasaran_id' => \App\Models\DjaSasaran::factory()->create([
                            'program_id' => \App\Models\DjaProgram::factory()->create()->id,
                        ])->id,
                    ])->id,
                ])->id,
            ])->id,
        ]);

        $rincianA = DjaRincianBiaya::factory()->create([
            'kegiatan_id' => $kegiatan->id,
            'kode_akun' => '521213',
            'nama_item' => 'Honor Output A',
            'pagu_total' => 5_000_000,
            'harga_satuan' => 1_000_000,
        ]);

        $rincianB = DjaRincianBiaya::factory()->create([
            'kegiatan_id' => $kegiatan->id,
            'kode_akun' => '521213',
            'nama_item' => 'Honor Output B',
            'pagu_total' => 5_000_000,
            'harga_satuan' => 500_000,
        ]);

        // ── Buat permohonan draft ────────────────────────────────────────────────
        $pd = PermohonanDana::factory()->draft()->create([
            'tahun_anggaran_id' => $this->tahunAnggaran->id,
            'tim_kerja_id' => $this->timKerja->id,
            'created_by' => $this->pumk->id,
            'kapokja_id' => $this->kapokja->id,
            'pic_keuangan_id' => $this->pic->id,
        ]);

        // ── Step 4: simpan item A + B ──────────────────────────────────────────
        $this->actingAs($this->pumk)
            ->patch(route('pumk.permohonan-dana.step4', $pd), [
                'items' => [
                    [
                        'dja_rincian_biaya_id' => $rincianA->id,
                        'volume' => 1,
                        'harga_satuan' => 1_000_000,
                        'jumlah_permintaan' => 1_000_000,
                    ],
                    [
                        'dja_rincian_biaya_id' => $rincianB->id,
                        'volume' => 1,
                        'harga_satuan' => 500_000,
                        'jumlah_permintaan' => 500_000,
                    ],
                ],
            ])
            ->assertRedirect();

        $pd->refresh();
        expect((float) $pd->total_anggaran)->toBe(1_500_000.0);
        expect($pd->items()->count())->toBe(2);

        // ── Step 5: isi nominatif untuk item A dan B ───────────────────────────
        $itemA = $pd->items()->where('dja_rincian_biaya_id', $rincianA->id)->first();
        $itemB = $pd->items()->where('dja_rincian_biaya_id', $rincianB->id)->first();

        $this->actingAs($this->pumk)
            ->post(route('pumk.permohonan-dana.nominatif.store', $pd), [
                'nominatif' => [
                    [
                        'item_id' => $itemA->id,
                        'nama' => 'Pegawai A',
                        'ref_nama_id' => null,
                        'volume' => 1,
                        'harga_satuan' => 1_000_000,
                        'pph21_persen' => 0,
                    ],
                    [
                        'item_id' => $itemB->id,
                        'nama' => 'Pegawai B',
                        'ref_nama_id' => null,
                        'volume' => 1,
                        'harga_satuan' => 500_000,
                        'pph21_persen' => 0,
                    ],
                ],
            ])
            ->assertRedirect();

        expect($pd->items()->count())->toBe(2);
        expect(PermohonanDanaItemNominatif::where('permohonan_dana_id', $pd->id)->count())->toBe(2);

        // ── Kembali ke Step 4: hapus item B dari form ──────────────────────────
        $response = $this->actingAs($this->pumk)
            ->patch(route('pumk.permohonan-dana.step4', $pd), [
                'items' => [
                    [
                        'dja_rincian_biaya_id' => $rincianA->id,
                        'volume' => 1,
                        'harga_satuan' => 1_000_000,
                        'jumlah_permintaan' => 1_000_000,
                    ],
                    // item B tidak dikirim (dihapus dari form)
                ],
            ]);

        // Assert: redirect dengan error
        $response->assertRedirect(route('pumk.permohonan-dana.wizard', $pd));
        $response->assertSessionHas('error');

        // Assert: item B + nominatif B masih ada (tidak jadi orphan)
        $pd->refresh();
        expect($pd->items()->count())->toBe(2);
        expect((float) $pd->total_anggaran)->toBe(1_500_000.0);
        expect(PermohonanDanaItemNominatif::where('permohonan_dana_id', $pd->id)->count())->toBe(2);
    });

    it('recalculates total_anggaran from database after upsert', function () {
        $kegiatan = \App\Models\DjaKegiatan::factory()->create([
            'komponen_id' => \App\Models\DjaKomponen::factory()->create([
                'ro_id' => \App\Models\DjaRo::factory()->create([
                    'kro_id' => \App\Models\DjaKro::factory()->create([
                        'sasaran_id' => \App\Models\DjaSasaran::factory()->create([
                            'program_id' => \App\Models\DjaProgram::factory()->create()->id,
                        ])->id,
                    ])->id,
                ])->id,
            ])->id,
        ]);

        $rincianA = DjaRincianBiaya::factory()->create([
            'kegiatan_id' => $kegiatan->id,
            'kode_akun' => '521213',
            'nama_item' => 'Honor Output A',
            'pagu_total' => 5_000_000,
            'harga_satuan' => 1_000_000,
        ]);

        $pd = PermohonanDana::factory()->draft()->create([
            'tahun_anggaran_id' => $this->tahunAnggaran->id,
            'tim_kerja_id' => $this->timKerja->id,
            'created_by' => $this->pumk->id,
            'kapokja_id' => $this->kapokja->id,
            'pic_keuangan_id' => $this->pic->id,
        ]);

        // Simpan item A (1jt)
        $this->actingAs($this->pumk)
            ->patch(route('pumk.permohonan-dana.step4', $pd), [
                'items' => [
                    [
                        'dja_rincian_biaya_id' => $rincianA->id,
                        'volume' => 1,
                        'harga_satuan' => 1_000_000,
                        'jumlah_permintaan' => 1_000_000,
                    ],
                ],
            ])
            ->assertRedirect();

        $pd->refresh();
        expect((float) $pd->total_anggaran)->toBe(1_000_000.0);

        // Edit: ganti volume jadi 2 → total harus jadi 2jt
        $this->actingAs($this->pumk)
            ->patch(route('pumk.permohonan-dana.step4', $pd), [
                'items' => [
                    [
                        'dja_rincian_biaya_id' => $rincianA->id,
                        'volume' => 2,
                        'harga_satuan' => 1_000_000,
                        'jumlah_permintaan' => 2_000_000,
                    ],
                ],
            ])
            ->assertRedirect();

        $pd->refresh();
        expect((float) $pd->total_anggaran)->toBe(2_000_000.0);
    });
});
