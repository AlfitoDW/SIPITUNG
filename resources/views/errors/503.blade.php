<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sedang Pemeliharaan — SIPITUNG</title>
    @include('errors._style')
</head>
<body>
    <div class="wrap">
        <div class="card">
            <div class="brand">SIPITUNG</div>
            <div class="icon-wrap" style="background:#eff6ff">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#003580">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437" />
                </svg>
            </div>
            <div class="code" style="color:#003580">503</div>
            <h1>Sedang Pemeliharaan</h1>
            <p>SIPITUNG sedang dalam proses pembaruan untuk meningkatkan layanan. Sistem akan kembali aktif dalam beberapa saat.</p>
            <span class="badge" style="background:#eff6ff;color:#003580;border-color:#bfdbfe">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5z" clip-rule="evenodd"/></svg>
                Harap tunggu sebentar…
            </span>
            @include('errors._footer')
        </div>
    </div>
</body>
</html>
