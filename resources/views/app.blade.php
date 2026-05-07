<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }
        </style>

        <title inertia>{{ config('app.name', 'Sistem Informasi LLDIKTI 3') }}</title>

    <link rel="icon" href="{{ asset('Sipitung.svg') }}" type="image/svg+xml">
    <link rel="apple-touch-icon" href="{{ asset('Sipitung.svg') }}">
    <link rel="manifest" href="{{ asset('site.webmanifest') }}">

        {{-- Preloader Styles --}}
        <style>
            #app-preloader {
                position: fixed;
                inset: 0;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                background-color: oklch(0.98 0.01 250);
                transition: opacity 0.4s ease-out, visibility 0.4s ease-out;
            }
            html.dark #app-preloader {
                background-color: oklch(0.145 0 0);
            }
            #app-preloader.hidden {
                opacity: 0;
                visibility: hidden;
                pointer-events: none;
            }
            .preloader-logo {
                width: 80px;
                height: 80px;
                margin-bottom: 24px;
                animation: preloader-pulse 1.8s ease-in-out infinite;
            }
            .preloader-text {
                font-family: 'Instrument Sans', sans-serif;
                font-size: 1.25rem;
                font-weight: 700;
                color: #003580;
                letter-spacing: 0.1em;
                margin-bottom: 24px;
            }
            html.dark .preloader-text {
                color: #4fa3ff;
            }
            .preloader-subtext {
                font-family: 'Instrument Sans', sans-serif;
                font-size: 0.875rem;
                color: #6b7280;
                margin-bottom: 32px;
            }
            html.dark .preloader-subtext {
                color: #9ca3af;
            }
            .preloader-spinner {
                width: 40px;
                height: 40px;
                border: 3px solid rgba(0, 53, 128, 0.15);
                border-top-color: #003580;
                border-radius: 50%;
                animation: preloader-spin 1.5s linear infinite;
            }
            html.dark .preloader-spinner {
                border-color: rgba(79, 163, 255, 0.15);
                border-top-color: #4fa3ff;
            }
            @keyframes preloader-spin {
                to { transform: rotate(360deg); }
            }
            @keyframes preloader-pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(0.92); opacity: 0.7; }
            }
        </style>

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx'])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        {{-- Preloader --}}
        <div id="app-preloader">
            <img src="{{ asset('Sipitung.svg') }}" alt="SIPITUNG" class="preloader-logo" />
            <div class="preloader-text">SIPITUNG</div>
            <div class="preloader-subtext">Memuat aplikasi...</div>
            <div class="preloader-spinner"></div>
        </div>

        @inertia

        {{-- Hide preloader after app is ready --}}
        <script>
            (function() {
                const preloader = document.getElementById('app-preloader');
                if (!preloader) return;

                // Hide immediately if app is already rendered
                if (document.readyState === 'complete') {
                    preloader.classList.add('hidden');
                    return;
                }

                // Otherwise wait for page to fully load
                window.addEventListener('load', function() {
                    // Small delay to ensure React/Inertia has mounted
                    setTimeout(function() {
                        preloader.classList.add('hidden');
                    }, 300);
                });
            })();
        </script>
    </body>
</html>
