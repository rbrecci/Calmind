@extends('admin.layout')

@section('title', 'Cadastros profissionais')

@push('styles')
    <style>
        .table-wrapper { overflow: auto; max-inline-size: 100%; container-type: inline-size; }
        table { width: 100%; border-collapse: separate; border-spacing: 0; }
        caption { text-align: left; font-weight: 700; padding: 1rem 0; }
        th, td { padding: .85rem; text-align: left; border-bottom: 1px solid #d7e4e2; vertical-align: top; }
        thead { position: sticky; top: 0; z-index: 1; background: #edf5f3; }
        tbody th { position: sticky; left: 0; background: #fff; }
        .actions { display: flex; flex-wrap: wrap; gap: .5rem; }
        .actions form { min-width: 12rem; flex: 1; }
        .actions textarea { margin-block: .4rem; min-height: 4.5rem; }
        @container (width < 650px) {
            table, thead, tbody, tr, th, td { display: block; }
            thead { display: none; }
            tr { border: 1px solid #d7e4e2; border-radius: .65rem; margin-bottom: 1rem; overflow: hidden; }
            tbody th { left: auto; top: 0; background: #edf5f3; }
            td::before { display: block; font-weight: 700; margin-bottom: .2rem; }
            td:nth-child(2)::before { content: 'CRP'; }
            td:nth-child(3)::before { content: 'Documento'; }
            td:nth-child(4)::before { content: 'Ações'; }
        }
    </style>
@endpush

@section('content')
    <h1>Cadastros profissionais pendentes</h1>
    <p>Confira o comprovante e decida cada cadastro.</p>

    @if (session('status'))
        <div class="notice" role="status">{{ session('status') }}</div>
    @endif
    @if ($errors->any())
        <div class="error" role="alert">{{ $errors->first() }}</div>
    @endif

    <div class="card table-wrapper" tabindex="0" role="region" aria-labelledby="registrations-caption">
        <table>
            <caption id="registrations-caption">Fila de análise</caption>
            <thead>
                <tr>
                    <th scope="col">Profissional</th>
                    <th scope="col">CRP</th>
                    <th scope="col">Documento</th>
                    <th scope="col">Ações</th>
                </tr>
            </thead>
            <tbody>
                @forelse ($registrations as $registration)
                    <tr>
                        <th scope="row">
                            {{ $registration->user->name }}<br>
                            <small>{{ $registration->user->email }}</small>
                        </th>
                        <td>{{ $registration->crp_region }}/{{ $registration->crp_number }}</td>
                        <td>
                            @foreach ($registration->documents as $document)
                                <a href="{{ route('admin.documents.show', $document->id) }}">{{ $document->original_name }}</a><br>
                            @endforeach
                        </td>
                        <td>
                            <div class="actions">
                                <form method="post" action="{{ route('admin.registrations.approve', $registration->id) }}">
                                    @csrf
                                    <button type="submit">Aprovar {{ $registration->user->name }}</button>
                                </form>
                                <form method="post" action="{{ route('admin.registrations.reject', $registration->id) }}">
                                    @csrf
                                    <label for="reason-{{ $registration->id }}">Justificativa para reprovar {{ $registration->user->name }}</label>
                                    <textarea id="reason-{{ $registration->id }}" name="reason" required maxlength="2000"></textarea>
                                    <button class="secondary" type="submit">Reprovar</button>
                                </form>
                            </div>
                        </td>
                    </tr>
                @empty
                    <tr><td colspan="4">Nenhum cadastro pendente.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>
    {{ $registrations->links() }}
@endsection
