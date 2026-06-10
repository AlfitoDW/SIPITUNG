<?php

use App\Exports\NominatifExport;
use App\Models\PermohonanDana;
use App\Models\RefNama;
use App\Models\TahunAnggaran;
use App\Models\TimKerja;
use App\Models\User;
use Database\Seeders\NominatifSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PhpOffice\PhpSpreadsheet\IOFactory;

uses(RefreshDatabase::class);

it('creates one nominatif fixture containing all export account sheets', function () {
    TimKerja::factory()->create(['id' => 1]);
    TahunAnggaran::factory()->create(['id' => 2]);
    User::factory()->ketuaTim()->create(['id' => 1]);
    User::factory()->ppk()->create(['id' => 2]);
    User::factory()->ppk()->create(['id' => 3]);
    User::factory()->bendahara()->create(['id' => 4]);
    User::factory()->pumk()->create(['id' => 5]);
    RefNama::factory()->count(12)->create();

    $this->seed(NominatifSeeder::class);

    $pd = PermohonanDana::with('items.nominatif')
        ->where('nomor_permohonan', '999/LL3/NOMINATIF-ALL/V/2026')
        ->firstOrFail();

    expect($pd->items->pluck('kode_akun')->sort()->values()->all())->toBe([
        '521115',
        '521213',
        '522151',
        '524111',
        '524113',
        '524114',
        '524119',
    ]);

    foreach ($pd->items as $item) {
        expect($item->nominatif)->toHaveCount(12);
    }
});

it('exports the nominatif fixture without stale template headers or misplaced totals', function () {
    if (! file_exists(storage_path('app/templates/nominatif_template_clean.xlsx'))) {
        $this->markTestSkipped('Nominatif template is not available.');
    }

    TimKerja::factory()->create(['id' => 1]);
    TahunAnggaran::factory()->create(['id' => 2]);
    User::factory()->ketuaTim()->create(['id' => 1]);
    User::factory()->ppk()->create(['id' => 2]);
    User::factory()->ppk()->create(['id' => 3]);
    User::factory()->bendahara()->create(['id' => 4]);
    User::factory()->pumk()->create(['id' => 5]);
    RefNama::factory()->count(12)->create();

    $this->seed(NominatifSeeder::class);

    $pd = PermohonanDana::where('nomor_permohonan', '999/LL3/NOMINATIF-ALL/V/2026')->firstOrFail();
    $response = (new NominatifExport($pd))->download();
    $tempFile = tempnam(sys_get_temp_dir(), 'nominatif_export_test_');
    file_put_contents($tempFile, $response->getContent());

    $spreadsheet = IOFactory::load($tempFile);
    unlink($tempFile);

    $sheet521213 = $spreadsheet->getSheetByName('521213');
    expect($sheet521213->getCell('A3')->getValue())->toContain('SK-NOMINATIF-ALL/V/2026');
    expect($sheet521213->getCell('A6')->getValue())->toContain('DATA UJI EXPORT NOMINATIF');
    expect($sheet521213->getCell('A7')->getValue())->toContain('2026');
    expect($sheet521213->getCell('A8')->getValue())->toContain('JAKARTA');
    expect($sheet521213->getCell('A8')->getValue())->not->toContain('BEKASI');
    expect($sheet521213->getCell('B3')->getValue())->toBeNull();
    expect($sheet521213->getCell('B9')->getValue())->toBeNull();
    expect((float) $sheet521213->getCell('G27')->getCalculatedValue())->toBeGreaterThan(0);
    expect((float) $sheet521213->getCell('I27')->getCalculatedValue())->toBeGreaterThan(0);
    expect((float) $sheet521213->getCell('L27')->getCalculatedValue())->toBeGreaterThan(0);
    expect((float) $sheet521213->getCell('M27')->getCalculatedValue())->toBeGreaterThan(0);

    $sheet524111 = $spreadsheet->getSheetByName('524111');
    expect($sheet524111->getCell('B7')->getValue())->toContain('2026');
    expect($sheet524111->getCell('B8')->getValue())->not->toContain('BEKASI');
    expect($sheet524111->getCell('C45')->getValue())->toBeNull();
    foreach (['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q'] as $col) {
        expect((float) $sheet524111->getCell("{$col}45")->getCalculatedValue())->toBeGreaterThan(0);
    }
    expect((float) $sheet524111->getCell('N45')->getCalculatedValue())->toBeGreaterThan(0);
    expect($sheet524111->getCell('S45')->getValue())->toBeNull();

    $sheet524113 = $spreadsheet->getSheetByName('524113');
    expect($sheet524113->getCell('C44')->getValue())->toBeNull();
    foreach (['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'] as $col) {
        expect((float) $sheet524113->getCell("{$col}44")->getCalculatedValue())->toBeGreaterThan(0);
    }
    expect($sheet524113->getCell('Q44')->getValue())->toBeNull();
});
