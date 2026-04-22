<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;

class DashboardController extends Controller
{
    public function redirect(): RedirectResponse
    {
        $user = auth()->user();

        if ($user->isSuperAdmin()) {
            return redirect()->route('super-admin.dashboard');
        } elseif ($user->isKetuaTimKerja()) {
            return redirect()->route('ketua-tim.dashboard');
        } elseif ($user->isPimpinan()) {
            return redirect()->route('pimpinan.dashboard');
        } elseif ($user->isBendahara()) {
            return redirect()->route('bendahara.dashboard');
        }

        abort(403, 'No dashboard available for your role.');
    }
}
