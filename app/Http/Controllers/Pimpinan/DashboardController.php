<?php

namespace App\Http\Controllers\Pimpinan;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();

        return Inertia::render('Pimpinan/Dashboard', [
            'user' => $user,
            'pimpinanType' => $user->pimpinan_type,
        ]);
    }
}
