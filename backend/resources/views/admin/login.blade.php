@extends('admin.layout')

@section('title', 'Acesso administrativo')

@section('content')
    <div class="card" style="max-width: 28rem; margin-inline: auto;">
        <h1>Acesso administrativo</h1>
        @if ($errors->any())
            <div class="error" role="alert">{{ $errors->first() }}</div>
        @endif
        <form class="stack" method="post" action="{{ route('admin.login.store') }}">
            @csrf
            <div>
                <label for="email">E-mail</label>
                <input id="email" name="email" type="email" autocomplete="username" value="{{ old('email') }}" required>
            </div>
            <div>
                <label for="password">Senha</label>
                <input id="password" name="password" type="password" autocomplete="current-password" required>
            </div>
            <button type="submit">Entrar</button>
        </form>
    </div>
@endsection
