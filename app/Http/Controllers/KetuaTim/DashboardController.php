<?php

namespace App\Http\Controllers\KetuaTim;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();

        return Inertia::render('KetuaTim/Dashboard', [
            'user' => $user,
            'timKerja' => $user->timkerja,
        ]);
    }
}
