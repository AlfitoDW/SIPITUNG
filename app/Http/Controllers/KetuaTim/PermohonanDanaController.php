<?php

namespace App\Http\Controllers\KetuaTim;

use App\Http\Controllers\Controller;
use App\Models\PermohonanDana;
use App\Models\TahunAnggaran;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * KA.TIM (Ketua Tim Kerja) — Approval Step 1
 *
 * KA.TIM melihat dan menyetujui/menolak permohonan yang diajukan oleh PUMK
 * dari tim kerja yang sama, ATAU permohonan di mana KA.TIM dipilih sebagai kapokja.
 */
class PermohonanDanaController extends Controller
{
    public function index(Request $request): Response
    {
        $tahun = TahunAnggaran::forSession();
        $timKerjaId = $request->user()->tim_kerja_id;
        $userId = $request->user()->id;

        // Scope: tim sendiri OR kapokja = user ini
        $baseQuery = PermohonanDana::with([
            'items', 'createdBy', 'kapokja', 'timKerja',
            'katimApprovedBy', 'kabagApprovedBy', 'ppkApprovedBy', 'picApprovedBy', 'dicairkanBy',
        ])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where(function ($q) use ($timKerjaId, $userId) {
                $q->where('tim_kerja_id', $timKerjaId)
                    ->orWhere('kapokja_id', $userId);
            })
            ->orderByDesc('created_at');

        // Menunggu (bisa approve): submitted + kapokja = user ini
        $menunggu = (clone $baseQuery)
            ->where('status', 'submitted')
            ->where('kapokja_id', $userId)
            ->get();

        // Semua permohonan yang bisa dilihat
        $permohonan = $baseQuery->get();

        $mapPd = fn ($pd) => [
            'id' => $pd->id,
            'nomor_permohonan' => $pd->nomor_permohonan,
            'keperluan' => $pd->keperluan,
            'judul_pekerjaan' => $pd->judul_pekerjaan,
            'tanggal_mulai' => $pd->tanggal_mulai?->toDateString(),
            'tanggal_selesai' => $pd->tanggal_selesai?->toDateString(),
            'tempat' => $pd->tempat,
            'total_anggaran' => $pd->total_anggaran,
            'status' => $pd->status,
            'status_label' => $pd->status_label,
            'catatan_katim' => $pd->catatan_katim,
            'catatan_kabag' => $pd->catatan_kabag,
            'catatan_ppk' => $pd->catatan_ppk,
            'catatan_pic' => $pd->catatan_pic,
            'catatan_pencairan' => $pd->catatan_pencairan,
            'catatan_penolakan' => $pd->catatan_penolakan,
            'created_at' => $pd->created_at?->toIso8601String(),
            'submitted_at' => $pd->submitted_at?->toIso8601String(),
            'created_by_name' => $pd->createdBy?->nama_lengkap ?? $pd->createdBy?->name,
            'kapokja_id' => $pd->kapokja_id,
            'kapokja_name' => $pd->kapokja?->nama_lengkap,
            'tim_kerja_kode' => $pd->timKerja?->kode,
            'tim_kerja_nama' => $pd->timKerja?->nama,
            'katim_approved_by' => $pd->katim_approved_by,
            'katim_approved_at' => $pd->katim_approved_at?->toIso8601String(),
            'katim_approved_by_name' => $pd->katimApprovedBy?->nama_lengkap,
            'kabag_approved_by' => $pd->kabag_approved_by,
            'kabag_approved_at' => $pd->kabag_approved_at?->toIso8601String(),
            'kabag_approved_by_name' => $pd->kabagApprovedBy?->nama_lengkap,
            'ppk_approved_by' => $pd->ppk_approved_by,
            'ppk_approved_at' => $pd->ppk_approved_at?->toIso8601String(),
            'ppk_approved_by_name' => $pd->ppkApprovedBy?->nama_lengkap,
            'pic_approved_by' => $pd->pic_approved_by,
            'pic_approved_at' => $pd->pic_approved_at?->toIso8601String(),
            'pic_approved_by_name' => $pd->picApprovedBy?->nama_lengkap,
            'dicairkan_by' => $pd->dicairkan_by,
            'dicairkan_at' => $pd->dicairkan_at?->toIso8601String(),
            'dicairkan_by_name' => $pd->dicairkanBy?->nama_lengkap,
            'rejected_at' => $pd->rejected_at?->toIso8601String(),
            'rejected_at_step' => $pd->rejected_at_step,
            'next_approver_role' => match ($pd->status) {
                'submitted' => 'KA.TIM',
                'katim_approved' => 'Kabag Umum',
                'kabag_approved' => 'PPK',
                'ppk_approved' => 'PIC Keuangan',
                'pic_approved' => 'Bendahara',
                default => null,
            },
            'next_approver_name' => match ($pd->status) {
                'submitted' => $pd->kapokja?->nama_lengkap,
                'katim_approved' => User::where('role', 'pimpinan')->where('pimpinan_type', 'kabag_umum')->where('is_active', true)->value('nama_lengkap'),
                'kabag_approved' => User::where('role', 'pimpinan')->where('pimpinan_type', 'ppk')->where('is_active', true)->value('nama_lengkap'),
                'ppk_approved' => $pd->picKeuangan?->nama_lengkap,
                'pic_approved' => User::where('role', 'bendahara')->where('is_active', true)->value('nama_lengkap'),
                default => null,
            },
            'items' => $pd->items->map(fn ($item) => [
                'id' => $item->id,
                'kode_akun' => $item->kode_akun,
                'uraian' => $item->uraian,
                'volume' => $item->volume,
                'satuan' => $item->satuan,
                'harga_satuan' => $item->harga_satuan,
                'total' => $item->total,
            ])->values(),
        ];

        return Inertia::render('KetuaTim/PermohonanDana/Approval', [
            'tahun' => $tahun,
            'menunggu' => $menunggu->map($mapPd)->values(),
            'permohonan' => $permohonan->map($mapPd)->values(),
        ]);
    }

    public function show(Request $request, PermohonanDana $pd): Response
    {
        $user = $request->user();
        $canView = $pd->tim_kerja_id === $user->tim_kerja_id || $pd->kapokja_id === $user->id;
        abort_if(! $canView, 403, 'Anda tidak memiliki akses ke permohonan ini.');

        $pd->load([
            'djaProgram', 'djaSasaran', 'djaKro', 'djaRo', 'djaKomponen', 'djaKegiatan',
            'kapokja', 'picKeuangan', 'items', 'dokumens', 'createdBy',
            'katimApprovedBy', 'kabagApprovedBy', 'ppkApprovedBy', 'picApprovedBy', 'dicairkanBy',
        ]);

        return Inertia::render('KetuaTim/PermohonanDana/Detail', [
            'pd' => [
                'id' => $pd->id,
                'nomor_permohonan' => $pd->nomor_permohonan,
                'keperluan' => $pd->keperluan,
                'judul_pekerjaan' => $pd->judul_pekerjaan,
                'tanggal_mulai' => $pd->tanggal_mulai?->toDateString(),
                'tanggal_selesai' => $pd->tanggal_selesai?->toDateString(),
                'jam_pelaksanaan' => $pd->jam_pelaksanaan,
                'tempat' => $pd->tempat,
                'tgl_pertanggungjawaban' => $pd->tgl_pertanggungjawaban?->toDateString(),
                'total_anggaran' => $pd->total_anggaran,
                'status' => $pd->status,
                'status_label' => $pd->status_label,
                'catatan_katim' => $pd->catatan_katim,
                'catatan_kabag' => $pd->catatan_kabag,
                'catatan_ppk' => $pd->catatan_ppk,
                'catatan_pic' => $pd->catatan_pic,
                'catatan_pencairan' => $pd->catatan_pencairan,
                'catatan_penolakan' => $pd->catatan_penolakan,
                'created_at' => $pd->created_at?->toIso8601String(),
                'submitted_at' => $pd->submitted_at?->toIso8601String(),
                'created_by_name' => $pd->createdBy?->nama_lengkap,
                'kapokja_id' => $pd->kapokja_id,
                'kapokja_name' => $pd->kapokja?->nama_lengkap,
                'tim_kerja_kode' => $pd->timKerja?->kode,
                'tim_kerja_nama' => $pd->timKerja?->nama,
                // Approval timestamps
                'katim_approved_by' => $pd->katim_approved_by,
                'katim_approved_at' => $pd->katim_approved_at?->toIso8601String(),
                'katim_approved_by_name' => $pd->katimApprovedBy?->nama_lengkap,
                'kabag_approved_by' => $pd->kabag_approved_by,
                'kabag_approved_at' => $pd->kabag_approved_at?->toIso8601String(),
                'kabag_approved_by_name' => $pd->kabagApprovedBy?->nama_lengkap,
                'ppk_approved_by' => $pd->ppk_approved_by,
                'ppk_approved_at' => $pd->ppk_approved_at?->toIso8601String(),
                'ppk_approved_by_name' => $pd->ppkApprovedBy?->nama_lengkap,
                'pic_approved_by' => $pd->pic_approved_by,
                'pic_approved_at' => $pd->pic_approved_at?->toIso8601String(),
                'pic_approved_by_name' => $pd->picApprovedBy?->nama_lengkap,
                'dicairkan_by' => $pd->dicairkan_by,
                'dicairkan_at' => $pd->dicairkan_at?->toIso8601String(),
                'dicairkan_by_name' => $pd->dicairkanBy?->nama_lengkap,
                'rejected_at' => $pd->rejected_at?->toIso8601String(),
                'rejected_at_step' => $pd->rejected_at_step,
                // DJA
                'dja_program' => $pd->djaProgram ? ['nama' => $pd->djaProgram->nama] : null,
                'dja_sasaran' => $pd->djaSasaran ? ['nama' => $pd->djaSasaran->nama] : null,
                'dja_kro' => $pd->djaKro ? ['kode' => $pd->djaKro->kode, 'nama' => $pd->djaKro->nama] : null,
                'dja_ro' => $pd->djaRo ? ['nama' => $pd->djaRo->nama] : null,
                'dja_komponen' => $pd->djaKomponen ? ['nama' => $pd->djaKomponen->nama] : null,
                'dja_kegiatan' => $pd->djaKegiatan ? ['kode' => $pd->djaKegiatan->kode, 'nama' => $pd->djaKegiatan->nama] : null,
                'kapokja' => $pd->kapokja ? ['id' => $pd->kapokja->id, 'nama_lengkap' => $pd->kapokja->nama_lengkap] : null,
                'pic_keuangan' => $pd->picKeuangan ? ['id' => $pd->picKeuangan->id, 'nama_lengkap' => $pd->picKeuangan->nama_lengkap] : null,
                'items' => $pd->items->map(fn ($i) => [
                    'id' => $i->id,
                    'kode_akun' => $i->kode_akun,
                    'uraian' => $i->uraian,
                    'volume' => $i->volume,
                    'satuan' => $i->satuan,
                    'harga_satuan' => $i->harga_satuan,
                    'total' => $i->total,
                ])->values(),
                'dokumens' => $pd->dokumens->map(fn ($d) => [
                    'id' => $d->id,
                    'nama_jenis' => $d->nama_jenis,
                    'nama_file' => $d->nama_file,
                    'path_file' => $d->path_file,
                ])->values(),
            ],
        ]);
    }

    public function print(Request $request, PermohonanDana $pd): Response
    {
        $user = $request->user();
        $canView = $pd->tim_kerja_id === $user->tim_kerja_id || $pd->kapokja_id === $user->id;
        abort_if(! $canView, 403, 'Anda tidak memiliki akses ke permohonan ini.');

        $pd->load([
            'djaProgram', 'djaSasaran', 'djaKro', 'djaRo', 'djaKomponen', 'djaKegiatan',
            'kapokja', 'picKeuangan', 'items', 'dokumens',
            'katimApprovedBy', 'kabagApprovedBy', 'ppkApprovedBy', 'picApprovedBy', 'dicairkanBy',
        ]);

        return Inertia::render('Pumk/PermohonanDana/PrintPreview', [
            'pd' => array_merge($pd->toArray(), ['status_label' => $pd->status_label]),
        ]);
    }

    public function approve(Request $request, PermohonanDana $pd): RedirectResponse
    {
        abort_if($pd->kapokja_id !== $request->user()->id, 403, 'Hanya kapokja yang dapat menyetujui permohonan ini.');
        abort_if($pd->status !== 'submitted', 422, 'Status tidak valid untuk disetujui.');

        $request->validate(['catatan' => 'nullable|string|max:1000']);

        $pd->update([
            'status' => 'katim_approved',
            'katim_approved_by' => $request->user()->id,
            'catatan_katim' => $request->catatan,
            'katim_approved_at' => now(),
        ]);

        return back()->with('success', "Permohonan {$pd->nomor_permohonan} disetujui, diteruskan ke Kabag Umum.");
    }

    public function reject(Request $request, PermohonanDana $pd): RedirectResponse
    {
        abort_if($pd->kapokja_id !== $request->user()->id, 403, 'Hanya kapokja yang dapat menolak permohonan ini.');
        abort_if($pd->status !== 'submitted', 422, 'Status tidak valid untuk ditolak.');

        $request->validate(['catatan' => 'required|string|max:1000']);

        $pd->update([
            'status' => 'rejected',
            'katim_approved_by' => $request->user()->id,
            'catatan_katim' => $request->catatan,
            'katim_approved_at' => now(),
            'rejected_at_step' => 'katim',
            'catatan_penolakan' => $request->catatan,
            'rejected_at' => now(),
        ]);

        return back()->with('success', "Permohonan {$pd->nomor_permohonan} ditolak, PUMK perlu merevisi.");
    }
}
