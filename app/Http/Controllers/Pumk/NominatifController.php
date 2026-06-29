<?php

namespace App\Http\Controllers\Pumk;

use App\Http\Controllers\Controller;
use App\Models\PermohonanDana;
use App\Models\PermohonanDanaItem;
use App\Models\PermohonanDanaItemNominatif;
use App\Models\RefNama;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NominatifController extends Controller
{
    // ─── Index — Form Input Nominatif ─────────────────────────────────────────

    public function index(Request $request, PermohonanDana $pd): Response
    {
        abort_if($pd->created_by !== $request->user()->id, 403);

        $pd->load(['items.nominatif', 'items.djaRincianBiaya.subKegiatan', 'timKerja']);

        $refNama = RefNama::aktif()
            ->orderBy('nama')
            ->get(['id', 'nama', 'nip', 'nik', 'npwp', 'gol_ruang', 'status_kepegawaian',
                'nama_rekening', 'no_rekening', 'nama_bank', 'email', 'pph21_persen'])
            ->each(function (RefNama $r) {
                // Recompute PPh21 on-the-fly so frontend always gets correct value
                $r->pph21_persen = RefNama::hitungPph21(
                    $r->status_kepegawaian,
                    $r->gol_ruang,
                    $r->npwp
                );
            });

        // Build rincian biaya data grouped by kode_akun (same format as Wizard Step 4)
        $rincianBiaya = [];
        foreach ($pd->items as $item) {
            $terpakai = \App\Models\PermohonanDanaItem::where('dja_rincian_biaya_id', $item->dja_rincian_biaya_id)
                ->whereHas('permohonanDana', fn ($q) => $q
                    ->whereNotIn('status', ['draft', 'rejected'])
                    ->where('id', '!=', $pd->id))
                ->sum('jumlah_permintaan');

            $dja = $item->djaRincianBiaya;

            $data = [
                'id' => $item->id, // permohonan_dana_item id (used as item_id in nominatif)
                'kode_akun' => $item->kode_akun,
                'nama_akun' => $dja?->subKegiatan?->nama_akun ?? '-',
                'nama_item' => $item->uraian,
                'satuan' => $item->satuan,
                'harga_satuan' => $dja?->harga_satuan ?? 0,
                'pagu_total' => $dja?->pagu_total ?? 0,
                'terpakai' => $terpakai,
                'sisa_anggaran' => max(0, ($dja?->pagu_total ?? 0) - $terpakai),
                'volume' => $item->volume,
                'harga_satuan_aktual' => $item->harga_satuan,
                'total' => $item->total,
                'jumlah_permintaan' => $item->jumlah_permintaan,
                'tipe_nominatif' => $item->tipe_nominatif,
                'nominatif_count' => $item->nominatif->count(),
                'nominatif' => $item->nominatif,
            ];

            $key = $item->kode_akun.'|'.($dja?->subKegiatan?->nama_akun ?? '-');
            $rincianBiaya[$key][] = $data;
        }

        return Inertia::render('Pumk/PermohonanDana/Nominatif', [
            'permohonan' => array_merge($pd->toArray(), ['status_label' => $pd->status_label]),
            'rincian_biaya' => array_values($rincianBiaya),
            'ref_nama' => $refNama,
        ]);
    }

    // ─── Store — Simpan Nominatif ─────────────────────────────────────────────

    public function store(Request $request, PermohonanDana $pd): RedirectResponse
    {
        abort_if($pd->created_by !== $request->user()->id, 403);
        abort_if(! $pd->isEditable(), 403, 'Permohonan tidak dapat diedit pada status ini.');

        $request->validate([
            'nominatif' => 'nullable|array',
            'nominatif.*.item_id' => 'required|exists:permohonan_dana_item,id',
            'nominatif.*.nama' => 'required|string|max:150',
            'nominatif.*.jabatan' => 'nullable|string|max:100',
            'nominatif.*.volume' => 'nullable|numeric|min:0',
            'nominatif.*.harga_satuan' => 'nullable|numeric|min:0',
            'nominatif.*.pph21_persen' => 'nullable|numeric|min:0',
            // Perjadin
            'nominatif.*.transport' => 'nullable|numeric|min:0',
            'nominatif.*.uang_harian_vol' => 'nullable|numeric|min:0',
            'nominatif.*.uang_harian_satuan' => 'nullable|numeric|min:0',
            'nominatif.*.fullboard_vol' => 'nullable|numeric|min:0',
            'nominatif.*.fullboard_satuan' => 'nullable|numeric|min:0',
            'nominatif.*.fullday_vol' => 'nullable|numeric|min:0',
            'nominatif.*.fullday_satuan' => 'nullable|numeric|min:0',
            'nominatif.*.representasi' => 'nullable|numeric|min:0',
            'nominatif.*.taksi_pp' => 'nullable|numeric|min:0',
            'nominatif.*.tiket_pesawat' => 'nullable|numeric|min:0',
            'nominatif.*.hotel' => 'nullable|numeric|min:0',
        ]);

        // ── Validasi: total nominatif harus sama dengan total rincian biaya ──
        $rows = $request->input('nominatif', []);
        if (! empty($rows)) {
            $rowsByItem = collect($rows)->groupBy('item_id');
            $itemIds = $rowsByItem->keys()->toArray();
            $items = PermohonanDanaItem::whereIn('id', $itemIds)->get()->keyBy('id');

            foreach ($rowsByItem as $itemId => $itemRows) {
                $item = $items[$itemId] ?? null;
                if (! $item) {
                    continue;
                }

                $totalNominatif = 0;

                foreach ($itemRows as $row) {
                    $vol = (float) ($row['volume'] ?? 1);
                    $harga = (float) ($row['harga_satuan'] ?? 0);
                    $totalNominatif += round($vol * $harga, 2);
                }

                $totalRincian = (float) $item->total;

                if (abs($totalNominatif - $totalRincian) > 0.01) {
                    return redirect()->back()->with('error',
                        "Total nominatif untuk [{$item->kode_akun}] {$item->uraian} ".
                        '(Rp '.number_format($totalNominatif, 0, ',', '.').') '.
                        'tidak sesuai dengan total rincian biaya '.
                        '(Rp '.number_format($totalRincian, 0, ',', '.').'). '.
                        'Harap perbaiki data pada menu Rincian Biaya sebelum menyimpan nominatif.'
                    );
                }
            }
        }

        // ── Atomic replace: hapus lama + insert baru dalam satu transaction ──
        \DB::transaction(function () use ($pd, $rows) {
            // Hapus nominatif lama untuk permohonan ini
            PermohonanDanaItemNominatif::where('permohonan_dana_id', $pd->id)->delete();

            foreach (array_values($rows) as $urutan => $row) {
                $itemId = $row['item_id'];
                $refNamaId = $row['ref_nama_id'] ?? null;
                $pph21 = (float) ($row['pph21_persen'] ?? 0);

                // ─── Honor ───────────────────────────────────────────────────────
                $volume = (float) ($row['volume'] ?? 1);
                $hargaSatuan = (float) ($row['harga_satuan'] ?? 0);
                $jumlahBruto = round($volume * $hargaSatuan, 2);
                $jumlahPajak = round($jumlahBruto * ($pph21 / 100), 2);
                $jumlahDiterima = round($jumlahBruto - $jumlahPajak, 2);

                // ─── Perjadin ────────────────────────────────────────────────────
                $item = PermohonanDanaItem::find($itemId);
                $uraian = strtolower($item?->uraian ?? '');

                // Generic per-rincian mapping based on item.uraian regex
                $vol = (float) ($row['volume'] ?? 1);
                $hs = (float) ($row['harga_satuan'] ?? 0);
                $jml = round($vol * $hs, 2);

                // Initialize all perjadin columns to 0
                $transport = 0;
                $uangHarianVol = 0;
                $uangHarianSatuan = 0;
                $uangHarianJumlah = 0;
                $fullboardVol = 0;
                $fullboardSatuan = 0;
                $fullboardJumlah = 0;
                $fulldayVol = 0;
                $fulldaySatuan = 0;
                $fulldayJumlah = 0;
                $representasi = 0;
                $taksiPp = 0;
                $tiketPesawat = 0;
                $hotel = 0;

                if ($item && $item->isPerjadin()) {
                    if (preg_match('/fullboard/i', $uraian)) {
                        $fullboardVol = $vol;
                        $fullboardSatuan = $hs;
                        $fullboardJumlah = $jml;
                    } elseif (preg_match('/fullday|full\s*day/i', $uraian)) {
                        $fulldayVol = $vol;
                        $fulldaySatuan = $hs;
                        $fulldayJumlah = $jml;
                    } elseif (preg_match('/uang\s*harian/i', $uraian)) {
                        $uangHarianVol = $vol;
                        $uangHarianSatuan = $hs;
                        $uangHarianJumlah = $jml;
                    } elseif (preg_match('/representasi/i', $uraian)) {
                        $representasi = $jml;
                    } elseif (preg_match('/tiket\s*pesawat/i', $uraian)) {
                        $tiketPesawat = $jml;
                    } elseif (preg_match('/biaya\s*penginapan|hotel|akomodasi/i', $uraian)) {
                        $hotel = $jml;
                    } elseif (preg_match('/taksi/i', $uraian)) {
                        $taksiPp = $jml;
                    } elseif (preg_match('/transport/i', $uraian)) {
                        $transport = $jml;
                    }
                } else {
                    // Legacy: accept explicit component fields if item type unknown
                    $transport = (float) ($row['transport'] ?? 0);
                    $uangHarianVol = (float) ($row['uang_harian_vol'] ?? 0);
                    $uangHarianSatuan = (float) ($row['uang_harian_satuan'] ?? 0);
                    $uangHarianJumlah = round($uangHarianVol * $uangHarianSatuan, 2);
                    $fullboardVol = (float) ($row['fullboard_vol'] ?? 0);
                    $fullboardSatuan = (float) ($row['fullboard_satuan'] ?? 0);
                    $fullboardJumlah = round($fullboardVol * $fullboardSatuan, 2);
                    $fulldayVol = (float) ($row['fullday_vol'] ?? 0);
                    $fulldaySatuan = (float) ($row['fullday_satuan'] ?? 0);
                    $fulldayJumlah = round($fulldayVol * $fulldaySatuan, 2);
                    $representasi = (float) ($row['representasi'] ?? 0);
                    $taksiPp = (float) ($row['taksi_pp'] ?? 0);
                    $tiketPesawat = (float) ($row['tiket_pesawat'] ?? 0);
                    $hotel = (float) ($row['hotel'] ?? 0);
                }

                $jumlahPerjadin = $transport + $uangHarianJumlah + $fullboardJumlah
                                + $fulldayJumlah + $representasi + $taksiPp
                                + $tiketPesawat + $hotel;

                PermohonanDanaItemNominatif::create([
                    'permohonan_dana_item_id' => $itemId,
                    'permohonan_dana_id' => $pd->id,
                    'ref_nama_id' => $refNamaId ?: null,
                    'nama' => $row['nama'],
                    'nip' => $row['nip'] ?? null,
                    'nik' => $row['nik'] ?? null,
                    'npwp' => $row['npwp'] ?? null,
                    'gol_ruang' => $row['gol_ruang'] ?? null,
                    'nama_rekening' => $row['nama_rekening'] ?? null,
                    'no_rekening' => $row['no_rekening'] ?? null,
                    'nama_bank' => $row['nama_bank'] ?? null,
                    'email' => $row['email'] ?? null,
                    'pph21_persen' => $pph21,
                    // Honor
                    'jabatan' => $row['jabatan'] ?? null,
                    'volume' => $volume,
                    'harga_satuan' => $hargaSatuan,
                    'jumlah_bruto' => $jumlahBruto,
                    'jumlah_pajak' => $jumlahPajak,
                    'jumlah_diterima' => $jumlahDiterima,
                    // Perjadin
                    'transport' => $transport,
                    'uang_harian_vol' => $uangHarianVol,
                    'uang_harian_satuan' => $uangHarianSatuan,
                    'uang_harian_jumlah' => $uangHarianJumlah,
                    'fullboard_vol' => $fullboardVol,
                    'fullboard_satuan' => $fullboardSatuan,
                    'fullboard_jumlah' => $fullboardJumlah,
                    'fullday_vol' => $fulldayVol,
                    'fullday_satuan' => $fulldaySatuan,
                    'fullday_jumlah' => $fulldayJumlah,
                    'representasi' => $representasi,
                    'taksi_pp' => $taksiPp,
                    'tiket_pesawat' => $tiketPesawat,
                    'hotel' => $hotel,
                    'jumlah_perjadin' => $jumlahPerjadin,
                    'urutan' => $urutan,
                ]);
            }
        });

        return redirect()->route('pumk.permohonan-dana.wizard', $pd->id)
            ->with('success', 'Daftar nominatif berhasil disimpan.');
    }

    // ─── Search Pegawai — JSON autocomplete ──────────────────────────────────

    public function searchPegawai(Request $request): JsonResponse
    {
        $q = $request->input('q', '');

        $results = RefNama::aktif()
            ->where('nama', 'LIKE', "%{$q}%")
            ->orderBy('nama')
            ->limit(20)
            ->get(['id', 'nama', 'nip', 'nik', 'npwp', 'gol_ruang', 'status_kepegawaian',
                'nama_rekening', 'no_rekening', 'nama_bank', 'email', 'pph21_persen']);

        return response()->json($results);
    }

    // ─── Store Ref Nama — tambah pegawai baru dari halaman nominatif ─────────

    public function storeRefNama(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:150',
            'nip' => 'nullable|string|max:30|unique:ref_nama,nip',
            'nik' => 'nullable|string|max:20',
            'npwp' => 'nullable|string|max:25',
            'gol_ruang' => 'nullable|string|max:10',
            'status_kepegawaian' => 'required|in:PNS,Non-PNS,P3K',
            'nama_rekening' => 'nullable|string|max:150',
            'no_rekening' => 'nullable|string|max:30',
            'nama_bank' => 'nullable|string|max:100',
            'email' => 'nullable|email|max:150',
        ]);

        $pph21 = RefNama::hitungPph21(
            $validated['status_kepegawaian'],
            $validated['gol_ruang'] ?? null,
            $validated['npwp'] ?? null,
        );

        $ref = RefNama::create(array_merge($validated, [
            'pph21_persen' => $pph21,
            'is_aktif' => true,
        ]));

        return response()->json($ref->only([
            'id', 'nama', 'nip', 'nik', 'npwp', 'gol_ruang', 'status_kepegawaian',
            'nama_rekening', 'no_rekening', 'nama_bank', 'email', 'pph21_persen',
        ]));
    }

    // ─── Update Ref Nama — edit pegawai dari halaman nominatif ───────────────

    public function updateRefNama(Request $request, RefNama $refNama): JsonResponse
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:150',
            'nip' => 'nullable|string|max:30|unique:ref_nama,nip,'.$refNama->id,
            'nik' => 'nullable|string|max:20',
            'npwp' => 'nullable|string|max:25',
            'gol_ruang' => 'nullable|string|max:10',
            'status_kepegawaian' => 'required|in:PNS,Non-PNS,P3K',
            'nama_rekening' => 'nullable|string|max:150',
            'no_rekening' => 'nullable|string|max:30',
            'nama_bank' => 'nullable|string|max:100',
            'email' => 'nullable|email|max:150',
        ]);

        $pph21 = RefNama::hitungPph21(
            $validated['status_kepegawaian'],
            $validated['gol_ruang'] ?? null,
            $validated['npwp'] ?? null,
        );

        $refNama->update(array_merge($validated, [
            'pph21_persen' => $pph21,
        ]));

        return response()->json($refNama->only([
            'id', 'nama', 'nip', 'nik', 'npwp', 'gol_ruang', 'status_kepegawaian',
            'nama_rekening', 'no_rekening', 'nama_bank', 'email', 'pph21_persen',
        ]));
    }

    // ─── Toggle Status Ref Nama — nonaktifkan/aktifkan pegawai ────────────────

    public function toggleStatusRefNama(RefNama $refNama): JsonResponse
    {
        $refNama->update(['is_aktif' => ! $refNama->is_aktif]);

        return response()->json([
            'id' => $refNama->id,
            'is_aktif' => $refNama->is_aktif,
        ]);
    }
}
