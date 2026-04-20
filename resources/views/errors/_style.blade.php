<style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: #f1f5f9;
        color: #0f172a;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
    }
    .wrap { width: 100%; display: flex; justify-content: center; }
    .card {
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        padding: 2.75rem 2.25rem 2rem;
        max-width: 460px;
        width: 100%;
        text-align: center;
        box-shadow: 0 4px 24px rgba(0,0,0,.06), 0 1px 3px rgba(0,0,0,.05);
    }
    .brand {
        font-size: .7rem;
        font-weight: 700;
        letter-spacing: .12em;
        color: #94a3b8;
        text-transform: uppercase;
        margin-bottom: 1.75rem;
    }
    .icon-wrap {
        width: 64px;
        height: 64px;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1rem;
    }
    .icon-wrap svg { width: 32px; height: 32px; }
    .code {
        font-size: 3.5rem;
        font-weight: 800;
        line-height: 1;
        letter-spacing: -.03em;
        margin-bottom: .35rem;
        opacity: .15;
    }
    h1 {
        font-size: 1.2rem;
        font-weight: 700;
        color: #0f172a;
        margin-bottom: .6rem;
    }
    p {
        font-size: .875rem;
        color: #64748b;
        line-height: 1.65;
        margin-bottom: 1.75rem;
        max-width: 340px;
        margin-left: auto;
        margin-right: auto;
    }
    .actions { display: flex; gap: .625rem; justify-content: center; flex-wrap: wrap; margin-bottom: 1.75rem; }
    .btn {
        display: inline-flex;
        align-items: center;
        gap: .4rem;
        padding: .5rem 1.125rem;
        border-radius: 8px;
        font-size: .8125rem;
        font-weight: 600;
        text-decoration: none;
        cursor: pointer;
        border: none;
        transition: opacity .15s;
    }
    .btn:hover { opacity: .85; }
    .btn svg { width: 15px; height: 15px; }
    .btn-primary { background: #003580; color: #fff; }
    .btn-ghost  { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
    .badge {
        display: inline-flex;
        align-items: center;
        gap: .35rem;
        padding: .3rem 1rem;
        border-radius: 999px;
        font-size: .75rem;
        font-weight: 600;
        border: 1px solid;
        margin-bottom: 1.75rem;
    }
    .badge svg { width: 13px; height: 13px; }
    .divider { height: 1px; background: #f1f5f9; margin-bottom: 1.25rem; }
    .footer { font-size: .7rem; color: #cbd5e1; }
</style>
