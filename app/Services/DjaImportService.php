<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\DjaKegiatan;
use App\Models\DjaKomponen;
use App\Models\DjaKro;
use App\Models\DjaProgram;
use App\Models\DjaRevisi;
use App\Models\DjaRevisiDetail;
use App\Models\DjaRincianBiaya;
use App\Models\DjaRo;
use App\Models\DjaSasaran;
use App\Models\TahunAnggaran;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\IOFactory;

class DjaImportService
{
    /** Level separator di full path */
    private const SEP = '/';

    /** Level enum */
    private const LEVELS = ['program', 'sasaran', 'kro', 'ro', 'komponen', 'kegiatan', 'rincian_biaya'];

    /** Regex per level untuk deteksi baris Excel */
    private const REGEX_PROGRAM = '/^\d{3}\.\d{2}\.[A-Z]{2,3}$/';

    private const REGEX_SASARAN = '/^\d{4}$/';

    private const REGEX_KRO = '/^\d{4}\.[A-Z]{3}$/';

    private const REGEX_RO = '/^\d{4}\.[A-Z]{3}\.\d{3}$/';

    private const REGEX_KOMPONEN = '/^\d{3}$/';

    private const REGEX_KEGIATAN = '/^[A-Z]$/';

    private const REGEX_KODE_AKUN = '/^\d{6}$/';

    // ─── Public API ───────────────────────────────────────────────────────────────

    /** Parse Excel dan bangun preview perubahan */
    public function preview(string $filePath, TahunAnggaran $tahun): array
    {
        $excelMap = $this->buildExcelMap($filePath, $tahun->tahun);
        $dbMap = $this->buildDatabaseMap($tahun->tahun);

        return $this->diff($excelMap, $dbMap);
    }

    /** Commit revisi anggaran dalam satu transaksi */
    public function commit(array $previewData, int $userId, TahunAnggaran $tahun): DjaRevisi
    {
        return DB::transaction(function () use ($previewData, $userId, $tahun) {
            $revisi = DjaRevisi::create([
                'tahun_anggaran_id' => $tahun->id,
                'nomor_revisi' => DjaRevisi::nextNomorRevisi($tahun->id),
                'user_id' => $userId,
                'catatan' => $previewData['catatan'] ?? null,
            ]);

            $statuses = $previewData['items'] ?? [];
            $terpengaruh = [];

            $dbMap = $this->buildDatabaseMap($tahun->tahun);

            // Eksekusi per level — hapus dulu, lalu upsert
            $this->executeDeletes($statuses, $revisi, $dbMap);
            $this->executeUpserts($statuses, $revisi, $tahun, $terpengaruh);

            // Sinkronisasi flag overbudget
            $this->syncOverbudget($terpengaruh);

            return $revisi;
        });
    }

    // ─── Excel Parser ────────────────────────────────────────────────────────────

    private function buildExcelMap(string $filePath, string $tahun): array
    {
        $spreadsheet = IOFactory::load($filePath);
        $sheet = $spreadsheet->getActiveSheet();
        $rows = $sheet->toArray(null, true, true, true);

        $map = [];
        $current = [
            'program' => null, 'sasaran' => null, 'kro' => null,
            'ro' => null, 'komponen' => null, 'kegiatan' => null,
            'kode_akun' => null, 'nama_akun' => null, 'urutan' => 0,
        ];

        $paguInt = fn ($v) => (int) preg_replace('/[^\d]/', '', (string) ($v ?? 0));
        $parseDecimal = fn ($v) => (float) preg_replace('/[^\d.]/', '', str_replace(',', '', (string) ($v ?? 0)));

        foreach ($rows as $row) {
            $a = trim((string) ($row['A'] ?? ''));
            $b = trim((string) ($row['B'] ?? ''));
            $c = trim((string) ($row['C'] ?? ''));
            $d = trim((string) ($row['D'] ?? ''));
            $e = trim((string) ($row['E'] ?? ''));
            $f = trim((string) ($row['F'] ?? ''));

            if ($a === '' && $b === '') {
                continue;
            }

            // Program
            if (preg_match(self::REGEX_PROGRAM, $a)) {
                $path = "program:{$a}";
                $map[$path] = $this->node('program', $a, null, $b, $paguInt($f));
                $current = array_merge($current, [
                    'program' => $a, 'sasaran' => null, 'kro' => null,
                    'ro' => null, 'komponen' => null, 'kegiatan' => null,
                    'kode_akun' => null, 'nama_akun' => null, 'urutan' => 0,
                ]);

                continue;
            }

            // Sasaran
            if (preg_match(self::REGEX_SASARAN, $a) && $current['program']) {
                $path = "program:{$current['program']}".self::SEP."sasaran:{$a}";
                $map[$path] = $this->node('sasaran', $a, "program:{$current['program']}", $b, $paguInt($f));
                $current = array_merge($current, [
                    'sasaran' => $a, 'kro' => null, 'ro' => null,
                    'komponen' => null, 'kegiatan' => null,
                    'kode_akun' => null, 'nama_akun' => null, 'urutan' => 0,
                ]);

                continue;
            }

            // KRO
            if (preg_match(self::REGEX_KRO, $a) && $current['sasaran']) {
                $parentPath = "program:{$current['program']}".self::SEP."sasaran:{$current['sasaran']}";
                $path = $parentPath.self::SEP."kro:{$a}";
                $map[$path] = $this->node('kro', $a, $parentPath, $b, $paguInt($f));
                $current = array_merge($current, ['kro' => $a, 'ro' => null, 'komponen' => null, 'kegiatan' => null, 'kode_akun' => null, 'nama_akun' => null, 'urutan' => 0]);

                continue;
            }

            // RO
            if (preg_match(self::REGEX_RO, $a) && $current['kro']) {
                $parentPath = "program:{$current['program']}".self::SEP."sasaran:{$current['sasaran']}".self::SEP."kro:{$current['kro']}";
                $path = $parentPath.self::SEP."ro:{$a}";
                $map[$path] = $this->node('ro', $a, $parentPath, $b, $paguInt($f));
                $current = array_merge($current, ['ro' => $a, 'komponen' => null, 'kegiatan' => null, 'kode_akun' => null, 'nama_akun' => null, 'urutan' => 0]);

                continue;
            }

            // Komponen
            if (preg_match(self::REGEX_KOMPONEN, $a) && $current['ro']) {
                $parentPath = "program:{$current['program']}".self::SEP."sasaran:{$current['sasaran']}".self::SEP."kro:{$current['kro']}".self::SEP."ro:{$current['ro']}";
                $path = $parentPath.self::SEP."komponen:{$a}";
                $map[$path] = $this->node('komponen', $a, $parentPath, $b, $paguInt($f));
                $current = array_merge($current, ['komponen' => $a, 'kegiatan' => null, 'kode_akun' => null, 'nama_akun' => null, 'urutan' => 0]);

                continue;
            }

            // Kegiatan
            if (preg_match(self::REGEX_KEGIATAN, $a) && $current['komponen']) {
                $parentPath = "program:{$current['program']}".self::SEP."sasaran:{$current['sasaran']}".self::SEP."kro:{$current['kro']}".self::SEP."ro:{$current['ro']}".self::SEP."komponen:{$current['komponen']}";
                $path = $parentPath.self::SEP."kegiatan:{$a}";
                $map[$path] = $this->node('kegiatan', $a, $parentPath, $b, $paguInt($f));
                $current = array_merge($current, ['kegiatan' => $a, 'kode_akun' => null, 'nama_akun' => null, 'urutan' => 0]);

                continue;
            }

            // Kode Akun (hanya set state)
            if (preg_match(self::REGEX_KODE_AKUN, $a)) {
                $current['kode_akun'] = $a;
                $current['nama_akun'] = $b;
                $current['urutan'] = 0;

                continue;
            }

            // Rincian Biaya (A kosong, B adalah nama item)
            if ($a === '' && $b !== '' && $current['kegiatan'] && $current['kode_akun']) {
                $current['urutan']++;
                $parentPath = "program:{$current['program']}".self::SEP."sasaran:{$current['sasaran']}".self::SEP."kro:{$current['kro']}".self::SEP."ro:{$current['ro']}".self::SEP."komponen:{$current['komponen']}".self::SEP."kegiatan:{$current['kegiatan']}";
                $kodeRincian = $current['kode_akun'].':'.$b;
                $path = $parentPath.self::SEP."rincian_biaya:{$kodeRincian}";
                $map[$path] = $this->node('rincian_biaya', $kodeRincian, $parentPath, $b, $parseDecimal($f), [
                    'kode_akun' => $current['kode_akun'],
                    'nama_akun' => $current['nama_akun'] ?? '',
                    'harga_satuan' => $parseDecimal($e),
                    'satuan' => $d ?: 'OK',
                    'volume_default' => is_numeric($c) ? (float) $c : 0,
                    'urutan' => $current['urutan'],
                ]);
            }
        }

        return $map;
    }

    // ─── Database Map Builder ────────────────────────────────────────────────────

    private function buildDatabaseMap(string $tahun): array
    {
        $map = [];

        $programs = DjaProgram::where('tahun_anggaran', $tahun)->where('is_aktif', true)->get();
        foreach ($programs as $p) {
            $path = "program:{$p->kode}";
            $map[$path] = $this->node('program', $p->kode, null, $p->nama, $p->pagu, ['id' => $p->id]);

            $sasarans = DjaSasaran::where('program_id', $p->id)->where('is_aktif', true)->get();
            foreach ($sasarans as $s) {
                $sPath = $path.self::SEP."sasaran:{$s->kode}";
                $map[$sPath] = $this->node('sasaran', $s->kode, $path, $s->nama, $s->pagu, ['id' => $s->id]);

                $kros = DjaKro::where('sasaran_id', $s->id)->where('is_aktif', true)->get();
                foreach ($kros as $k) {
                    $kPath = $sPath.self::SEP."kro:{$k->kode}";
                    $map[$kPath] = $this->node('kro', $k->kode, $sPath, $k->nama, $k->pagu, ['id' => $k->id]);

                    $ros = DjaRo::where('kro_id', $k->id)->where('is_aktif', true)->get();
                    foreach ($ros as $r) {
                        $rPath = $kPath.self::SEP."ro:{$r->kode}";
                        $map[$rPath] = $this->node('ro', $r->kode, $kPath, $r->nama, $r->pagu, ['id' => $r->id]);

                        $komponens = DjaKomponen::where('ro_id', $r->id)->where('is_aktif', true)->get();
                        foreach ($komponens as $km) {
                            $kmPath = $rPath.self::SEP."komponen:{$km->kode}";
                            $map[$kmPath] = $this->node('komponen', $km->kode, $rPath, $km->nama, $km->pagu, ['id' => $km->id]);

                            $kegiatans = DjaKegiatan::where('komponen_id', $km->id)->where('is_aktif', true)->get();
                            foreach ($kegiatans as $kg) {
                                $kgPath = $kmPath.self::SEP."kegiatan:{$kg->kode}";
                                $map[$kgPath] = $this->node('kegiatan', $kg->kode, $kmPath, $kg->nama, $kg->pagu, ['id' => $kg->id]);

                                $rincians = DjaRincianBiaya::where('kegiatan_id', $kg->id)->where('is_aktif', true)->get();
                                foreach ($rincians as $rc) {
                                    $kodeRincian = $rc->kode_akun.':'.$rc->nama_item;
                                    $rcPath = $kgPath.self::SEP."rincian_biaya:{$kodeRincian}";
                                    $map[$rcPath] = $this->node('rincian_biaya', $kodeRincian, $kgPath, $rc->nama_item, $rc->pagu_total, [
                                        'id' => $rc->id,
                                        'kode_akun' => $rc->kode_akun,
                                        'nama_akun' => $rc->nama_akun,
                                        'terpakai' => (float) ($rc->terpakai ?? 0),
                                    ]);
                                }
                            }
                        }
                    }
                }
            }
        }

        return $map;
    }

    // ─── Diff Engine ─────────────────────────────────────────────────────────────

    private function diff(array $excelMap, array $dbMap): array
    {
        $excelKeys = array_keys($excelMap);
        $dbKeys = array_keys($dbMap);

        $added = array_diff($excelKeys, $dbKeys);
        $removed = array_diff($dbKeys, $excelKeys);
        $common = array_intersect($excelKeys, $dbKeys);

        $result = [];
        $addedCount = 0;
        $changedCount = 0;
        $removedCount = 0;
        $blockedCount = 0;
        $overbudgetCount = 0;
        $overbudgetTotal = 0;

        // Tambah
        foreach ($added as $key) {
            $node = $excelMap[$key];
            $node['jenis'] = 'tambah';
            $node['status_eksekusi'] = 'sukses';
            $result[$key] = $node;
            $addedCount++;
        }

        // Ubah
        foreach ($common as $key) {
            $excelNode = $excelMap[$key];
            $dbNode = $dbMap[$key];

            $paguChanged = (float) $excelNode['pagu'] !== (float) $dbNode['pagu'];
            $namaChanged = $excelNode['nama'] !== $dbNode['nama'];

            if ($paguChanged || $namaChanged) {
                $excelNode['jenis'] = 'ubah';
                $excelNode['pagu_lama'] = $dbNode['pagu'];
                $excelNode['pagu_baru'] = $excelNode['pagu'];
                $excelNode['dbId'] = $dbNode['id'] ?? null;
                $excelNode['status_eksekusi'] = 'sukses';

                // Proyeksi overbudget untuk rincian biaya yang pagunya turun
                if ($excelNode['level'] === 'rincian_biaya' && (float) $excelNode['pagu'] < (float) $dbNode['pagu']) {
                    $terpakai = $dbNode['terpakai'] ?? 0;
                    if ($terpakai > (float) $excelNode['pagu']) {
                        $excelNode['overbudget'] = (float) $terpakai - (float) $excelNode['pagu'];
                        $excelNode['overbudget_label'] = 'Overbudget: Rp '.number_format($excelNode['overbudget'], 0, ',', '.');
                        $overbudgetCount++;
                        $overbudgetTotal += $excelNode['overbudget'];
                    }
                }

                $result[$key] = $excelNode;
                $changedCount++;
            }
        }

        // ── Second pass: fallback matching untuk rincian biaya ──────────────────
        // Excel item dengan kode_akun X mungkin match dengan DB item yang
        // kode_akun-nya kosong (tapi nama_item dan parent_path sama).
        // Ini menangani kasus DB punya kode_akun empty sementara Excel ada.
        $fallbackMatched = [];
        $removedNew = $removed;

        foreach ($added as $idx => $key) {
            $excelNode = $excelMap[$key];
            if (($excelNode['level'] ?? '') !== 'rincian_biaya') {
                continue;
            }

            $parentPath = $excelNode['parent_path'] ?? '';
            $namaItem = $excelNode['nama'] ?? '';

            // Cari DB item dengan parent_path sama + nama_item sama + kode_akun kosong
            foreach ($dbMap as $dbKey => $dbNode) {
                if (($dbNode['level'] ?? '') !== 'rincian_biaya') {
                    continue;
                }
                if ($dbNode['nama'] !== $namaItem) {
                    continue;
                }
                if (($dbNode['parent_path'] ?? '') !== $parentPath) {
                    continue;
                }

                // DB item punya kode_akun kosong → fallback match
                $dbKodeAkun = $dbNode['kode_akun'] ?? $dbNode['kode'] ?? '';
                $dbKodeAkun = explode(':', $dbKodeAkun)[0] ?? '';
                if ($dbKodeAkun !== '') {
                    continue;
                }

                // Match ditemukan! Konversi dari tambah → ubah
                $excelNode['jenis'] = 'ubah';
                $excelNode['pagu_lama'] = $dbNode['pagu'];
                $excelNode['pagu_baru'] = $excelNode['pagu'];
                $excelNode['dbId'] = $dbNode['id'] ?? null;
                $excelNode['status_eksekusi'] = 'sukses';

                // Proyeksi overbudget
                if ((float) $excelNode['pagu'] < (float) ($dbNode['pagu'] ?? 0)) {
                    $terpakai = $dbNode['terpakai'] ?? 0;
                    if ($terpakai > (float) $excelNode['pagu']) {
                        $excelNode['overbudget'] = (float) $terpakai - (float) $excelNode['pagu'];
                        $excelNode['overbudget_label'] = 'Overbudget: Rp '.number_format($excelNode['overbudget'], 0, ',', '.');
                        $overbudgetCount++;
                        $overbudgetTotal += $excelNode['overbudget'];
                    }
                }

                $result[$key] = $excelNode;
                $changedCount++;
                $addedCount--;
                $fallbackMatched[] = $dbKey;

                continue 2; // lanjut ke added item berikutnya
            }
        }

        // Hapus DB items yang sudah di-fallback-match dari list removed
        $removed = array_diff($removed, $fallbackMatched);
        $excelCount = count($excelMap);
        $dbCount = count($dbMap);
        $isFullReplace = $dbCount > 0 && $excelCount >= ($dbCount * 0.8);

        foreach ($removed as $key) {
            $node = $dbMap[$key];

            if (! $isFullReplace) {
                // Impor parsial: skip, jangan hapus item yang tidak muncul di Excel
                $node['jenis'] = 'skip';
                $node['status_eksekusi'] = 'skip_parsial';
                $node['keterangan'] = 'Item tidak muncul di file Excel — tidak dihapus (impor parsial)';
                $result[$key] = $node;

                continue;
            }

            $node['jenis'] = 'hapus';
            $node['pagu_lama'] = $node['pagu'];
            $node['pagu_baru'] = 0;
            $node['dbId'] = $node['id'] ?? null;

            // Cek apakah ada permohonan terikat
            $terpakai = $node['terpakai'] ?? 0;
            if ($terpakai > 0 && $node['level'] === 'rincian_biaya') {
                $node['status_eksekusi'] = 'gagal_hapus_terikat';
                $node['keterangan'] = 'Gagal dihapus: masih terikat permohonan dana aktif';
                $blockedCount++;
            } elseif ($node['level'] !== 'rincian_biaya' && $this->hasChildrenWithTerpakai($node, $dbMap)) {
                $node['status_eksekusi'] = 'gagal_hapus_terikat';
                $node['keterangan'] = 'Gagal dihapus: masih ada rincian biaya terikat di bawahnya';
                $blockedCount++;
            } else {
                $node['status_eksekusi'] = 'sukses';
            }

            $result[$key] = $node;
            $removedCount++;
        }

        $skippedCount = count($removed) - $removedCount;

        $isRevisi = count($dbMap) > 0;

        return [
            'is_revisi' => $isRevisi,
            'is_full_replace' => $isFullReplace,
            'items' => $result,
            'summary' => [
                'added' => $addedCount,
                'changed' => $changedCount,
                'removed' => $removedCount,
                'skipped' => $skippedCount,
                'blocked' => $blockedCount,
                'overbudget_count' => $overbudgetCount,
                'overbudget_total' => $overbudgetTotal,
                'overbudget_total_formatted' => 'Rp '.number_format($overbudgetTotal, 0, ',', '.'),
            ],
            'hierarchical' => $this->buildHierarchicalPreview($result),
        ];
    }

    // ─── Commit ──────────────────────────────────────────────────────────────────

    private function executeUpserts(array $statuses, DjaRevisi $revisi, TahunAnggaran $tahun, array &$terpengaruh): void
    {
        $tahunStr = $tahun->tahun;
        $paguInt = fn ($v) => (int) $v;

        // Sort by level untuk proses top-down: program dulu, baru sasaran, dst.
        $ordered = $this->sortByLevel($statuses);

        // State cache untuk lookup parent ID setelah upsert
        $parentIdCache = [];

        // Pre-populate cache dari DB untuk parent yang tidak diproses (skip/ubah tanpa perubahan)
        $dbMap = $this->buildDatabaseMap($tahunStr);

        foreach ($ordered as $key => $node) {
            $jenis = $node['jenis'] ?? null;
            $level = $node['level'];
            $kode = $node['kode'];
            $parentPath = $node['parent_path'] ?? null;

            // Dapatkan parent ID dari cache, atau lookup dari DB map
            $parentId = null;
            if ($parentPath) {
                if (isset($parentIdCache[$parentPath])) {
                    $parentId = $parentIdCache[$parentPath];
                } elseif (isset($dbMap[$parentPath])) {
                    $parentId = $dbMap[$parentPath]['id'] ?? null;
                }
            }

            // Hanya proses item yang perlu diubah (tambah/ubah)
            if (! in_array($jenis, ['tambah', 'ubah'])) {
                // Cache ID untuk child items yang mungkin perlu lookup
                if ($parentId === null && $level === 'program' && isset($dbMap[$key])) {
                    $parentIdCache[$key] = $dbMap[$key]['id'] ?? null;
                } elseif ($parentId && in_array($level, ['sasaran', 'kro', 'ro', 'komponen', 'kegiatan', 'rincian_biaya']) && isset($dbMap[$key])) {
                    $parentIdCache[$key] = $dbMap[$key]['id'] ?? null;
                }

                continue;
            }

            if ($level === 'program') {
                $model = DjaProgram::updateOrCreate(
                    ['kode' => $kode, 'tahun_anggaran' => $tahunStr],
                    ['nama' => $node['nama'], 'pagu' => $paguInt($node['pagu']), 'is_aktif' => true]
                );
                $parentIdCache[$key] = $model->id;
                $this->logDetail($revisi, $node, 'sukses');
            } elseif ($level === 'sasaran' && $parentId) {
                $model = DjaSasaran::updateOrCreate(
                    ['program_id' => $parentId, 'kode' => $kode],
                    ['nama' => $node['nama'], 'pagu' => $paguInt($node['pagu']), 'is_aktif' => true]
                );
                $parentIdCache[$key] = $model->id;
                $this->logDetail($revisi, $node, 'sukses');
            } elseif ($level === 'kro' && $parentId) {
                $model = DjaKro::updateOrCreate(
                    ['sasaran_id' => $parentId, 'kode' => $kode],
                    ['nama' => $node['nama'], 'pagu' => $paguInt($node['pagu']), 'is_aktif' => true]
                );
                $parentIdCache[$key] = $model->id;
                $this->logDetail($revisi, $node, 'sukses');
            } elseif ($level === 'ro' && $parentId) {
                $model = DjaRo::updateOrCreate(
                    ['kro_id' => $parentId, 'kode' => $kode],
                    ['nama' => $node['nama'], 'pagu' => $paguInt($node['pagu']), 'is_aktif' => true]
                );
                $parentIdCache[$key] = $model->id;
                $this->logDetail($revisi, $node, 'sukses');
            } elseif ($level === 'komponen' && $parentId) {
                $model = DjaKomponen::updateOrCreate(
                    ['ro_id' => $parentId, 'kode' => $kode],
                    ['nama' => $node['nama'], 'jenis' => 'Utama', 'pagu' => $paguInt($node['pagu']), 'is_aktif' => true]
                );
                $parentIdCache[$key] = $model->id;
                $this->logDetail($revisi, $node, 'sukses');
            } elseif ($level === 'kegiatan' && $parentId) {
                $model = DjaKegiatan::updateOrCreate(
                    ['komponen_id' => $parentId, 'kode' => $kode],
                    ['nama' => $node['nama'], 'pagu' => $paguInt($node['pagu']), 'is_aktif' => true]
                );
                $parentIdCache[$key] = $model->id;
                $this->logDetail($revisi, $node, 'sukses');
            } elseif ($level === 'rincian_biaya' && $parentId) {
                $extra = $node['extra'] ?? [];

                // Jika dari fallback match (dbId diset), update record existing langsung
                $dbId = $node['dbId'] ?? null;
                if ($dbId && ($node['status_eksekusi'] ?? '') === 'sukses') {
                    $record = DjaRincianBiaya::find($dbId);
                    if ($record && $record->kegiatan_id == $parentId) {
                        $record->update([
                            'kode_akun' => $extra['kode_akun'] ?? '',
                            'nama_akun' => $extra['nama_akun'] ?? '',
                            'volume_default' => $extra['volume_default'] ?? 0,
                            'satuan' => $extra['satuan'] ?? 'OK',
                            'harga_satuan' => $extra['harga_satuan'] ?? 0,
                            'pagu_total' => $node['pagu'] ?? 0,
                            'urutan' => $extra['urutan'] ?? 0,
                            'is_aktif' => true,
                        ]);
                        $model = $record;
                    } else {
                        $model = DjaRincianBiaya::updateOrCreate(
                            ['kegiatan_id' => $parentId, 'kode_akun' => $extra['kode_akun'] ?? '', 'nama_item' => $node['nama']],
                            [
                                'nama_akun' => $extra['nama_akun'] ?? '',
                                'volume_default' => $extra['volume_default'] ?? 0,
                                'satuan' => $extra['satuan'] ?? 'OK',
                                'harga_satuan' => $extra['harga_satuan'] ?? 0,
                                'pagu_total' => $node['pagu'] ?? 0,
                                'urutan' => $extra['urutan'] ?? 0,
                                'is_aktif' => true,
                            ]
                        );
                    }
                } else {
                    $model = DjaRincianBiaya::updateOrCreate(
                        ['kegiatan_id' => $parentId, 'kode_akun' => $extra['kode_akun'] ?? '', 'nama_item' => $node['nama']],
                        [
                            'nama_akun' => $extra['nama_akun'] ?? '',
                            'volume_default' => $extra['volume_default'] ?? 0,
                            'satuan' => $extra['satuan'] ?? 'OK',
                            'harga_satuan' => $extra['harga_satuan'] ?? 0,
                            'pagu_total' => $node['pagu'] ?? 0,
                            'urutan' => $extra['urutan'] ?? 0,
                            'is_aktif' => true,
                        ]
                    );
                }
                $parentIdCache[$key] = $model->id;
                $terpengaruh[] = $model->id;
                $this->logDetail($revisi, $node, 'sukses');
            }
        }
    }

    private function executeDeletes(array $statuses, DjaRevisi $revisi, array $dbMap): void
    {
        foreach ($statuses as $key => $node) {
            $jenis = $node['jenis'] ?? null;
            // Skip item yang bukan hapus (skip_parsial tidak perlu log)
            if ($jenis !== 'hapus') {
                continue;
            }
            if (($node['status_eksekusi'] ?? '') !== 'sukses') {
                $this->logDetail($revisi, $node, $node['status_eksekusi'] ?? 'gagal_hapus_terikat');

                continue;
            }

            $dbId = $node['dbId'] ?? null;
            $level = $node['level'];

            if (! $dbId) {
                // Cari dari DB map
                if (isset($dbMap[$key])) {
                    $dbId = $dbMap[$key]['id'] ?? null;
                }
            }

            if ($dbId) {
                match ($level) {
                    'rincian_biaya' => DjaRincianBiaya::where('id', $dbId)->update(['is_aktif' => false]),
                    'kegiatan' => DjaKegiatan::where('id', $dbId)->update(['is_aktif' => false]),
                    'komponen' => DjaKomponen::where('id', $dbId)->update(['is_aktif' => false]),
                    'ro' => DjaRo::where('id', $dbId)->update(['is_aktif' => false]),
                    'kro' => DjaKro::where('id', $dbId)->update(['is_aktif' => false]),
                    'sasaran' => DjaSasaran::where('id', $dbId)->update(['is_aktif' => false]),
                    'program' => DjaProgram::where('id', $dbId)->update(['is_aktif' => false]),
                    default => null,
                };
                $this->logDetail($revisi, $node, 'sukses');
            }
        }
    }

    private function syncOverbudget(array $rincianIds): void
    {
        $rincians = DjaRincianBiaya::whereIn('id', $rincianIds)->get();
        foreach ($rincians as $rc) {
            $rc->syncOverbudgetFlag();
        }
        DjaRincianBiaya::invalidateTerpakaiBatch($rincianIds);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────────

    private function node(string $level, string $kode, ?string $parentPath, string $nama, float|int|string $pagu, array $extra = []): array
    {
        return array_merge([
            'level' => $level,
            'kode' => $kode,
            'parent_path' => $parentPath,
            'nama' => $nama,
            'pagu' => (float) $pagu,
            'extra' => $extra,
        ], $extra);
    }

    private function hasChildrenWithTerpakai(array $node, array $dbMap): bool
    {
        // Cari kunci di dbMap yang parent_path-nya = path dari node ini
        $nodePath = null;
        foreach ($dbMap as $path => $n) {
            if (($n['kode'] ?? '') === ($node['kode'] ?? '') && ($n['level'] ?? '') === ($node['level'] ?? '')) {
                $nodePath = $path;
                break;
            }
        }

        if (! $nodePath) {
            return false;
        }

        foreach ($dbMap as $path => $n) {
            if (($n['parent_path'] ?? '') === $nodePath) {
                if (($n['level'] ?? '') === 'rincian_biaya' && ($n['terpakai'] ?? 0) > 0) {
                    return true;
                }
                // Rekursif ke anak yang lebih dalam
                if ($n['level'] !== 'rincian_biaya') {
                    $childNode = $n;
                    $childNode['kode'] = $n['kode'] ?? '';
                    $childNode['level'] = $n['level'] ?? '';
                    if ($this->hasChildrenWithTerpakaiInMap($path, $dbMap)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    private function hasChildrenWithTerpakaiInMap(string $parentPath, array $dbMap): bool
    {
        foreach ($dbMap as $path => $n) {
            if (($n['parent_path'] ?? '') === $parentPath) {
                if (($n['level'] ?? '') === 'rincian_biaya' && ($n['terpakai'] ?? 0) > 0) {
                    return true;
                }
                if (($n['level'] ?? '') !== 'rincian_biaya') {
                    if ($this->hasChildrenWithTerpakaiInMap($path, $dbMap)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    private function logDetail(DjaRevisi $revisi, array $node, string $statusEksekusi): void
    {
        DjaRevisiDetail::create([
            'dja_revisi_id' => $revisi->id,
            'level' => $node['level'] ?? '',
            'kode_item' => mb_substr($node['kode'] ?? '', 0, 400),
            'parent_kode' => mb_substr($node['parent_path'] ?? '', 0, 500),
            'nama_item' => mb_substr($node['nama'] ?? '', 0, 400),
            'jenis_perubahan' => $node['jenis'] ?? '',
            'pagu_lama' => $node['pagu_lama'] ?? null,
            'pagu_baru' => $node['pagu_baru'] ?? null,
            'status_eksekusi' => $statusEksekusi,
            'keterangan' => $node['keterangan'] ?? null,
        ]);
    }

    private function sortByLevel(array $items): array
    {
        $order = array_flip(self::LEVELS);
        $sorted = $items;
        uksort($sorted, function ($a, $b) use ($order, $items) {
            $levelA = $items[$a]['level'] ?? '';
            $levelB = $items[$b]['level'] ?? '';
            $orderA = $order[$levelA] ?? 99;
            $orderB = $order[$levelB] ?? 99;

            return $orderA <=> $orderB;
        });

        return $sorted;
    }

    private function buildHierarchicalPreview(array $flatItems): array
    {
        $tree = [];

        foreach ($flatItems as $path => $item) {
            $parts = explode(self::SEP, $path);
            $current = &$tree;

            foreach ($parts as $i => $part) {
                $colonPos = strpos($part, ':');
                if ($colonPos === false) {
                    $level = '';
                    $kode = $part;
                } else {
                    $level = substr($part, 0, $colonPos);
                    $kode = substr($part, $colonPos + 1);
                }
                $key = "{$level}:{$kode}";

                if (! isset($current[$key])) {
                    $current[$key] = [
                        'level' => $level,
                        'kode' => $kode,
                        'nama' => $item['nama'] ?? '',
                        'children' => [],
                    ];
                }

                // Di level paling dalam, tambahkan info perubahan
                if ($i === count($parts) - 1) {
                    $current[$key] = array_merge($current[$key], [
                        'jenis' => $item['jenis'] ?? null,
                        'pagu_lama' => $item['pagu_lama'] ?? null,
                        'pagu_baru' => $item['pagu_baru'] ?? null,
                        'pagu' => $item['pagu'] ?? 0,
                        'status_eksekusi' => $item['status_eksekusi'] ?? null,
                        'keterangan' => $item['keterangan'] ?? null,
                        'overbudget' => $item['overbudget'] ?? null,
                        'overbudget_label' => $item['overbudget_label'] ?? null,
                    ]);
                }

                $current = &$current[$key]['children'];
            }
        }

        return $this->cleanTree($tree);
    }

    /** Konversi tree dari associative ke indexed array + hapus empty children */
    private function cleanTree(array $tree): array
    {
        $result = [];
        foreach ($tree as $item) {
            $item['children'] = $this->cleanTree($item['children']);
            $result[] = $item;
        }

        return $result;
    }
}
