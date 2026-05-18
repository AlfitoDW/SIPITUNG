<?php

namespace App\Http\Controllers;

use App\Models\PermohonanDana;
use App\Models\PermohonanDanaDokumen;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FileController extends Controller
{
    /**
     * Download or preview bukti bayar for a permohonan dana.
     */
    public function downloadBuktiBayar(Request $request, PermohonanDana $pd): StreamedResponse
    {
        $this->authorizeAccess($pd);

        abort_if(! $pd->bukti_bayar_path, 404, 'Bukti bayar tidak ditemukan.');
        abort_if(! Storage::disk('local')->exists($pd->bukti_bayar_path), 404, 'File tidak ditemukan di storage.');

        return $this->serveFile($pd->bukti_bayar_path, $request->boolean('download'), $pd->bukti_bayar_nama_file);
    }

    /**
     * Download or preview a dokumen permohonan dana.
     */
    public function downloadDokumen(Request $request, PermohonanDanaDokumen $dokumen): StreamedResponse
    {
        $this->authorizeAccess($dokumen->permohonanDana);

        abort_if(! $dokumen->path_file, 404, 'Dokumen tidak ditemukan.');
        abort_if(! Storage::disk('local')->exists($dokumen->path_file), 404, 'File tidak ditemukan di storage.');

        return $this->serveFile($dokumen->path_file, $request->boolean('download'), $dokumen->nama_file);
    }

    /**
     * Check if the authenticated user is authorized to access files
     * belonging to the given permohonan dana.
     */
    private function authorizeAccess(PermohonanDana $pd): void
    {
        $user = auth()->user();

        if (! $user) {
            abort(403, 'Unauthorized.');
        }

        // Roles with global access
        if (
            $user->isSuperAdmin()
            || $user->isBendahara()
            || $user->isPicKeuangan()
            || $user->isPimpinan()
        ) {
            return;
        }

        // Ketua tim kerja: scoped to their tim kerja
        if ($user->isKetuaTimKerja() && $pd->tim_kerja_id === $user->tim_kerja_id) {
            return;
        }

        // PUMK: own permohonan only
        if ($user->isPumk() && $pd->created_by === $user->id) {
            return;
        }

        abort(403, 'Anda tidak memiliki akses ke file ini.');
    }

    /**
     * Serve a file from the local disk with appropriate headers.
     *
     * @param  string  $path  Relative path inside the local disk
     * @param  string|null  $fallbackName  Optional filename for download
     */
    private function serveFile(string $path, bool $forceDownload, ?string $fallbackName = null): StreamedResponse
    {
        $disk = Storage::disk('local');
        $mimeType = $disk->mimeType($path);
        $fileName = $fallbackName ?? basename($path);

        // Determine Content-Disposition: inline for images/PDF, attachment otherwise
        $inlineTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf',
        ];

        $disposition = ($forceDownload || ! in_array($mimeType, $inlineTypes))
            ? 'attachment'
            : 'inline';

        return $disk->response($path, $fileName, [], $disposition);
    }
}
