<!doctype html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('title') | Calmind</title>
    <style>
        :root { color-scheme: light; font-family: system-ui, sans-serif; background: #f4f7f6; color: #172b2b; }
        * { box-sizing: border-box; }
        body { margin: 0; }
        a { color: #08616a; }
        button, input, textarea { font: inherit; }
        button { min-height: 44px; padding: .65rem 1rem; border: 0; border-radius: .5rem; background: #075e62; color: #fff; cursor: pointer; }
        button.secondary { background: #7a3131; }
        button:focus-visible, a:focus-visible, input:focus-visible, textarea:focus-visible { outline: 3px solid #d27517; outline-offset: 3px; }
        input, textarea { width: 100%; padding: .7rem; border: 1px solid #9aafae; border-radius: .45rem; }
        label { display: block; margin-bottom: .3rem; font-weight: 650; }
        .shell { width: min(100% - 2rem, 70rem); margin-inline: auto; }
        .site-header { background: #073e42; color: #fff; padding: 1rem 0; }
        .site-header .shell { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
        .site-header strong { font-size: 1.25rem; }
        .site-header button { border: 1px solid #b8d7d5; }
        main { padding-block: 2rem; }
        .card { background: #fff; border: 1px solid #d7e4e2; border-radius: .8rem; padding: 1.25rem; box-shadow: 0 .25rem 1rem #1738390d; }
        .notice { padding: .8rem 1rem; border-radius: .5rem; background: #def2e7; margin-bottom: 1rem; }
        .error { padding: .8rem 1rem; border-radius: .5rem; background: #fbe7e5; margin-bottom: 1rem; }
        .stack > * + * { margin-top: 1rem; }
        .skip-link { position: absolute; top: -5rem; left: 1rem; background: #fff; color: #073e42; padding: .7rem; z-index: 5; }
        .skip-link:focus { top: 1rem; }
    </style>
    @stack('styles')
</head>
<body>
    <a class="skip-link" href="#content">Pular para o conteúdo</a>
    <header class="site-header">
        <div class="shell">
            <strong>Calmind</strong>
            @auth
                <form method="post" action="{{ route('admin.logout') }}">
                    @csrf
                    <button type="submit">Sair</button>
                </form>
            @endauth
        </div>
    </header>
    <main id="content" class="shell" tabindex="-1">
        @yield('content')
    </main>
</body>
</html>
