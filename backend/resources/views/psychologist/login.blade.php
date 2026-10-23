<!doctype html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Entrar | Calmind</title>
    <style>
        :root { font-family: system-ui, sans-serif; color: #15332f; background: #f5f8f6; line-height: 1.5; }
        * { box-sizing: border-box; }
        body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 1rem; }
        main { width: min(100%, 26rem); padding: 2rem; border: 1px solid #cbded5; border-radius: .75rem; background: white; }
        h1 { margin-top: 0; }
        .field { margin-block-end: 1rem; }
        label { display: block; font-weight: 600; margin-block-end: .3rem; }
        input { display: block; width: 100%; min-height: 3rem; padding: .65rem; border: 1px solid #56756b; border-radius: .35rem; font: inherit; }
        button { width: 100%; min-height: 3rem; border: 0; border-radius: .35rem; color: white; background: #176559; font: inherit; font-weight: 700; cursor: pointer; }
        :is(button, input):focus-visible { outline: 3px solid #155aaf; outline-offset: 2px; }
        .error { color: #9e182a; }
    </style>
</head>
<body>
<main>
    <h1>Área do psicólogo</h1>
    <p>Entre com sua conta para acompanhar tarefas.</p>
    <form method="post" action="{{ route('psychologist.login.submit') }}">
        @csrf
        <div class="field">
            <label for="email">E-mail</label>
            <input id="email" name="email" type="email" autocomplete="username" required value="{{ old('email') }}" @error('email') aria-invalid="true" aria-describedby="email-error" @enderror>
            @error('email') <p class="error" id="email-error">{{ $message }}</p> @enderror
        </div>
        <div class="field">
            <label for="password">Senha</label>
            <input id="password" name="password" type="password" autocomplete="current-password" required>
            @error('password') <p class="error">{{ $message }}</p> @enderror
        </div>
        <button type="submit">Entrar</button>
    </form>
</main>
</body>
</html>
