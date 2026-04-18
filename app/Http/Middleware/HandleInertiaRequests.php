<?php

namespace App\Http\Middleware;

use App\Models\TahunAnggaran;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => fn () => $request->user()
                    ? array_merge($request->user()->toArray(), [
                        'is_koordinator' => $request->user()->isKetuaKoordinator(),
                    ])
                    : null,
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'tahun_anggaran' => fn () => session('tahun_anggaran_id')
                ? TahunAnggaran::find(session('tahun_anggaran_id'), ['id', 'tahun', 'label'])
                : null,
            'tahun_anggaran_list' => fn () => TahunAnggaran::active()->orderBy('tahun', 'desc')->get(['id', 'tahun', 'label']),
            'flash' => fn () => [
                'success' => $request->session()->get('success'),
                'error'   => $request->session()->get('error'),
                'warning' => $request->session()->get('warning'),
                'info'    => $request->session()->get('info'),
            ],
        ];
    }
}
