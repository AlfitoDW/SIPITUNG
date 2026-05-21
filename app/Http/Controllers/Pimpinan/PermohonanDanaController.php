<?php

namespace App\Http\Controllers\Pimpinan;

use App\Http\Controllers\Controller;
use App\Models\PermohonanDana;
use App\Models\TahunAnggaran;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Pimpinan — Approval Step 2 (Kabag Umum) & Step 3 (PPK)
 *
 * Kabag Umum: katim_approved → kabag_approved
 * PPK:        kabag_approved → ppk_approved
 */
class PermohonanDanaController extends Controller
{
    private function statusForRole(): string
    {
        return auth()->user()->isPimpinanKabagUmum()
            ? 'katim_approved'
            : 'kabag_approved';
    }

    private function nextStatus(): string
    {
        return auth()->user()->isPimpinanKabagUmum()
            ? 'kabag_approved'
            : 'ppk_approved';
    }

    private function approvalField(): string
    {
        return auth()->user()->isPimpinanKabagUmum()
            ? 'kabag_approved_by'
            : 'ppk_approved_by';
    }

    private function approvalAtField(): string
    {
        return auth()->user()->isPimpinanKabagUmum()
            ? 'kabag_approved_at'
            : 'ppk_approved_at';
    }

    private function catatanField(): string
    {
        return auth()->user()->isPimpinanKabagUmum()
            ? 'catatan_kabag'
            : 'catatan_ppk';
    }

    private function rejectedStep(): string
    {
        return auth()->user()->isPimpinanKabagUmum() ? 'kabag' : 'ppk';
    }

    public function index(): Response
    {
        $tahun = TahunAnggaran::forSession();
        $status = $this->statusForRole();
        $isKabag = auth()->user()->isPimpinanKabagUmum();

        $baseQuery = PermohonanDana::with(['items', 'timKerja', 'createdBy', 'picKeuangan', 'dibukaKunciOleh'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->orderByDesc('created_at');

        $mapFn = function ($pd) {
            return array_merge($pd->toArray(), [
                'status_label' => $pd->status_label,
                'next_approver_role' => match ($pd->status) {
                    'submitted' => 'KA.TIM',
                    'katim_approved' => 'Kabag Umum',
                    'kabag_approved' => 'PPK',
                    'ppk_approved' => 'PIC Keuangan',
                    'pic_approved' => 'Bendahara',
                    default => null,
                },
                'next_approver_name' => match ($pd->status) {
                    'submitted' => $pd->timKerja?->ketua?->nama_lengkap,
                    'katim_approved' => User::where('role', 'pimpinan')->where('pimpinan_type', 'kabag_umum')->where('is_active', true)->value('nama_lengkap'),
                    'kabag_approved' => User::where('role', 'pimpinan')->where('pimpinan_type', 'ppk')->where('is_active', true)->value('nama_lengkap'),
                    'ppk_approved' => $pd->picKeuangan?->nama_lengkap,
                    'pic_approved' => User::where('role', 'bendahara')->where('is_active', true)->value('nama_lengkap'),
                    default => null,
                },
                'dibuka_kunci_by_name' => $pd->dibukaKunciOleh?->nama_lengkap,
            ]);
        };

        $perluDiproses = (clone $baseQuery)
            ->where('status', $status)
            ->get()
            ->map($mapFn);

        $semuaAjuan = (clone $baseQuery)
            ->get()
            ->map($mapFn);

        $diajukanStatuses = ['submitted', 'katim_approved', 'kabag_approved', 'ppk_approved', 'pic_approved'];
        $diajukan = (clone $baseQuery)
            ->whereIn('status', $diajukanStatuses)
            ->get()
            ->map($mapFn);

        $revisi = (clone $baseQuery)
            ->where('status', 'rejected')
            ->get()
            ->map($mapFn);

        $selesai = (clone $baseQuery)
            ->where('status', 'dicairkan')
            ->get()
            ->map($mapFn);

        return Inertia::render('Pimpinan/PermohonanDana/Index', [
            'tahun' => $tahun,
            'menunggu' => $perluDiproses,
            'riwayat' => $semuaAjuan,
            'role' => auth()->user()->pimpinan_type,
        ]);
    }

    public function show(PermohonanDana $pd): Response
    {
        $pd->load([
            'djaProgram', 'djaSasaran', 'djaKro', 'djaRo', 'djaKomponen', 'djaKegiatan',
            'kapokja', 'picKeuangan', 'items', 'dokumens', 'createdBy',
            'katimApprovedBy', 'kabagApprovedBy', 'ppkApprovedBy', 'picApprovedBy', 'dicairkanBy',
        ]);

        return Inertia::render('Pimpinan/PermohonanDana/Detail', [
            'role' => auth()->user()->pimpinan_type,
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
                'dibuka_kunci_at' => $pd->dibuka_kunci_at?->toIso8601String(),
                'dibuka_kunci_by_name' => $pd->dibukaKunciOleh?->nama_lengkap,
                'alasan_pembukaan_kunci' => $pd->alasan_pembukaan_kunci,
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

    public function approve(Request $request, PermohonanDana $pd): RedirectResponse
    {
        abort_if($pd->status !== $this->statusForRole(), 422, 'Status tidak valid.');

        $request->validate(['catatan' => 'nullable|string|max:1000']);

        \DB::transaction(function () use ($pd, $request) {
            $pd->lockForUpdate()->update([
                'status' => $this->nextStatus(),
                $this->approvalField() => $request->user()->id,
                $this->catatanField() => $request->catatan,
                $this->approvalAtField() => now(),
            ]);
        });

        $next = $request->user()->isPimpinanKabagUmum() ? 'PPK' : 'PIC Keuangan';

        return back()->with('success', "Permohonan {$pd->nomor_permohonan} disetujui, diteruskan ke {$next}.");
    }

    public function reject(Request $request, PermohonanDana $pd): RedirectResponse
    {
        abort_if($pd->status !== $this->statusForRole(), 422, 'Status tidak valid.');

        $request->validate(['catatan' => 'required|string|max:1000']);

        \DB::transaction(function () use ($pd, $request) {
            $pd->lockForUpdate()->update([
                'status' => 'rejected',
                'rejected_at_step' => $this->rejectedStep(),
                'catatan_penolakan' => $request->catatan,
                'rejected_at' => now(),
            ]);

            $pd->rejections()->create([
                'rejected_by' => $request->user()->id,
                'rejected_at_step' => $this->rejectedStep(),
                'catatan' => $request->catatan,
                'rejected_at' => now(),
            ]);
        });

        $pd->invalidateTerpakaiCache();

        return back()->with('success', "Permohonan {$pd->nomor_permohonan} ditolak.");
    }
}
