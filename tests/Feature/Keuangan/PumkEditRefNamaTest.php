<?php

use App\Models\RefNama;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->pumk = User::factory()->pumk()->create();
});

describe('PUMK can edit ref nama (master data pegawai)', function () {
    it('allows PUMK to update pegawai data', function () {
        $pegawai = RefNama::factory()->create([
            'nama' => 'Budi Santoso',
            'no_rekening' => '1234567890',
            'nama_bank' => 'BNI',
        ]);

        $response = $this->actingAs($this->pumk)
            ->putJson(route('pumk.ref-pegawai.update', $pegawai), [
                'nama' => 'Budi Santoso Updated',
                'nip' => $pegawai->nip,
                'nik' => $pegawai->nik,
                'npwp' => $pegawai->npwp,
                'gol_ruang' => $pegawai->gol_ruang,
                'status_kepegawaian' => $pegawai->status_kepegawaian,
                'nama_rekening' => 'Budi S. Updated',
                'no_rekening' => '0987654321',
                'nama_bank' => 'BRI',
                'email' => $pegawai->email,
            ]);

        $response->assertOk()
            ->assertJsonPath('nama', 'Budi Santoso Updated')
            ->assertJsonPath('no_rekening', '0987654321')
            ->assertJsonPath('nama_bank', 'BRI');

        $pegawai->refresh();
        expect($pegawai->nama)->toBe('Budi Santoso Updated')
            ->and($pegawai->no_rekening)->toBe('0987654321')
            ->and($pegawai->nama_bank)->toBe('BRI');
    });

    it('recomputes pph21 after updating golongan', function () {
        $pegawai = RefNama::factory()->create([
            'status_kepegawaian' => 'PNS',
            'gol_ruang' => 'III/a',
            'npwp' => '123',
        ]);

        expect((float) $pegawai->pph21_persen)->toBe(5.0);

        $response = $this->actingAs($this->pumk)
            ->putJson(route('pumk.ref-pegawai.update', $pegawai), [
                'nama' => $pegawai->nama,
                'nip' => $pegawai->nip,
                'nik' => $pegawai->nik,
                'npwp' => $pegawai->npwp,
                'gol_ruang' => 'IV/a',
                'status_kepegawaian' => 'PNS',
                'nama_rekening' => $pegawai->nama_rekening,
                'no_rekening' => $pegawai->no_rekening,
                'nama_bank' => $pegawai->nama_bank,
                'email' => $pegawai->email,
            ]);

        $response->assertOk()
            ->assertJsonPath('pph21_persen', '15.00');

        $pegawai->refresh();
        expect((float) $pegawai->pph21_persen)->toBe(15.0);
    });

    it('allows PUMK to toggle pegawai status (soft deactivate)', function () {
        $pegawai = RefNama::factory()->create(['is_aktif' => true]);

        $response = $this->actingAs($this->pumk)
            ->patchJson(route('pumk.ref-pegawai.toggle-status', $pegawai));

        $response->assertOk()
            ->assertJsonPath('is_aktif', false);

        $pegawai->refresh();
        expect($pegawai->is_aktif)->toBeFalse();
    });

    it('allows PUMK to reactivate pegawai', function () {
        $pegawai = RefNama::factory()->create(['is_aktif' => false]);

        $response = $this->actingAs($this->pumk)
            ->patchJson(route('pumk.ref-pegawai.toggle-status', $pegawai));

        $response->assertOk()
            ->assertJsonPath('is_aktif', true);

        $pegawai->refresh();
        expect($pegawai->is_aktif)->toBeTrue();
    });

    it('prevents duplicate NIP on update', function () {
        $pegawai1 = RefNama::factory()->create(['nip' => '12345']);
        $pegawai2 = RefNama::factory()->create(['nip' => '67890']);

        $response = $this->actingAs($this->pumk)
            ->putJson(route('pumk.ref-pegawai.update', $pegawai2), [
                'nama' => $pegawai2->nama,
                'nip' => '12345', // duplicate
                'nik' => $pegawai2->nik,
                'npwp' => $pegawai2->npwp,
                'gol_ruang' => $pegawai2->gol_ruang,
                'status_kepegawaian' => $pegawai2->status_kepegawaian,
                'nama_rekening' => $pegawai2->nama_rekening,
                'no_rekening' => $pegawai2->no_rekening,
                'nama_bank' => $pegawai2->nama_bank,
                'email' => $pegawai2->email,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['nip']);
    });

    it('allows keeping same NIP on update', function () {
        $pegawai = RefNama::factory()->create(['nip' => '12345']);

        $response = $this->actingAs($this->pumk)
            ->putJson(route('pumk.ref-pegawai.update', $pegawai), [
                'nama' => 'Updated Name',
                'nip' => '12345', // same NIP
                'nik' => $pegawai->nik,
                'npwp' => $pegawai->npwp,
                'gol_ruang' => $pegawai->gol_ruang,
                'status_kepegawaian' => $pegawai->status_kepegawaian,
                'nama_rekening' => $pegawai->nama_rekening,
                'no_rekening' => $pegawai->no_rekening,
                'nama_bank' => $pegawai->nama_bank,
                'email' => $pegawai->email,
            ]);

        $response->assertOk();
    });

    it('allows changing status from PNS to Non-PNS', function () {
        $pegawai = RefNama::factory()->create([
            'status_kepegawaian' => 'PNS',
            'gol_ruang' => 'III/a',
        ]);

        $response = $this->actingAs($this->pumk)
            ->putJson(route('pumk.ref-pegawai.update', $pegawai), [
                'nama' => $pegawai->nama,
                'nip' => null,
                'nik' => $pegawai->nik,
                'npwp' => $pegawai->npwp,
                'gol_ruang' => 'Non PNS',
                'status_kepegawaian' => 'Non-PNS',
                'nama_rekening' => $pegawai->nama_rekening,
                'no_rekening' => $pegawai->no_rekening,
                'nama_bank' => $pegawai->nama_bank,
                'email' => $pegawai->email,
            ]);

        $response->assertOk()
            ->assertJsonPath('status_kepegawaian', 'Non-PNS')
            ->assertJsonPath('gol_ruang', 'Non PNS');

        $pegawai->refresh();
        expect($pegawai->status_kepegawaian)->toBe('Non-PNS');
    });
});
