@php
    $statusLabels = ['scheduled' => 'Agendada', 'rescheduled' => 'Reagendada', 'cancelled' => 'Cancelada', 'done' => 'Realizada'];
    $modalityLabels = ['online' => 'Online', 'presencial' => 'Presencial'];
@endphp
<!doctype html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Agenda | Calmind</title>
    <style>
        :root { font-family: system-ui, sans-serif; color: #15332f; background: #f5f8f6; line-height: 1.5; }
        * { box-sizing: border-box; }
        body { margin: 0; }
        main { max-width: 68rem; margin: auto; padding: 1.5rem; }
        header { background: #176559; color: white; padding: 1rem 1.5rem; }
        header div { max-width: 65rem; margin: auto; font-weight: 700; display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
        header button { background: white; color: #176559; }
        h1, h2 { line-height: 1.2; }
        .layout { display: grid; grid-template-columns: minmax(17rem, 1fr) minmax(0, 2fr); gap: 1.5rem; align-items: start; }
        .card { background: white; border: 1px solid #cbded5; border-radius: .75rem; padding: 1.25rem; }
        .field { margin-block-end: 1rem; }
        label { display: block; font-weight: 600; margin-block-end: .3rem; }
        input, select, textarea { display: block; width: 100%; min-height: 3rem; padding: .65rem; border: 1px solid #56756b; border-radius: .35rem; background: white; font: inherit; }
        textarea { min-height: 6rem; }
        button { min-height: 3rem; padding: .65rem 1rem; border: 0; border-radius: .35rem; color: white; background: #176559; font: inherit; font-weight: 700; cursor: pointer; }
        :is(button, input, select, textarea):focus-visible { outline: 3px solid #155aaf; outline-offset: 2px; }
        .error { color: #9e182a; margin-block: .3rem; }
        .notice { padding: .8rem 1rem; border-radius: .4rem; background: #e4f4e9; }
        .conflict { margin-block-end: 1rem; padding: 1rem; border: 1px solid #9e182a; border-radius: .5rem; background: #fdf1f2; }
        .conflict p { margin-block: 0 .75rem; }
        .appointment-list { list-style: none; padding: 0; display: grid; gap: .8rem; }
        .appointment-list li { border: 1px solid #cbded5; border-radius: .5rem; padding: 1rem; }
        .appointment-list h3 { margin: 0 0 .25rem; overflow-wrap: anywhere; }
        .appointment-list p { margin: .3rem 0; overflow-wrap: anywhere; }
        .status { display: inline-block; font-weight: 700; }
        .muted { color: #435e55; }
        .section-link { display: inline-flex; align-items: center; min-height: 2.75rem; color: #176559; font-weight: 700; }
        @media (max-width: 47rem) { .layout { grid-template-columns: 1fr; } main { padding: 1rem; } }
    </style>
</head>
<body>
<header><div><span>Calmind | Área do psicólogo</span><form method="post" action="{{ route('psychologist.logout') }}">@csrf<button type="submit">Sair</button></form></div></header>
<main>
    <h1>Agenda</h1>
    <p>Agende consultas com os seus pacientes. Vínculos encerrados aparecem para consulta.</p>
    <nav aria-label="Seções do painel"><a class="section-link" href="{{ route('psychologist.tasks.index') }}">Ir para as tarefas</a></nav>

    @if (session('status'))
        <p class="notice" role="status">{{ session('status') }}</p>
    @endif

    <div class="layout">
        <section class="card" aria-labelledby="create-title">
            <h2 id="create-title">Nova consulta</h2>
            @if ($activeBonds->isEmpty())
                <p>Você precisa de um vínculo ativo para agendar uma consulta.</p>
                @error('bond_id') <p class="error" role="alert">{{ $message }}</p> @enderror
            @else
                @error('confirm_conflict')
                    <div class="conflict" role="alert">
                        <p>{{ $message }}</p>
                        {{-- Formulario proprio: a confirmacao vale so para o horario que o servico recusou, nao para o que estiver digitado abaixo --}}
                        <form method="post" action="{{ route('psychologist.appointments.store') }}">
                            @csrf
                            <input type="hidden" name="bond_id" value="{{ old('bond_id') }}">
                            <input type="hidden" name="scheduled_date" value="{{ old('scheduled_date') }}">
                            <input type="hidden" name="scheduled_time" value="{{ old('scheduled_time') }}">
                            <input type="hidden" name="modality" value="{{ old('modality') }}">
                            <input type="hidden" name="notes" value="{{ old('notes') }}">
                            <input type="hidden" name="confirm_conflict" value="1">
                            <button type="submit">Agendar mesmo assim</button>
                        </form>
                        <a class="section-link" href="#scheduled_date">Escolher outro horário</a>
                    </div>
                @enderror
                <form method="post" action="{{ route('psychologist.appointments.store') }}">
                    @csrf
                    <div class="field">
                        <label for="bond_id">Paciente <span aria-hidden="true">*</span></label>
                        <select id="bond_id" name="bond_id" required @error('bond_id') aria-invalid="true" aria-describedby="bond-error" @enderror>
                            <option value="">Selecione</option>
                            @foreach ($activeBonds as $bond)
                                <option value="{{ $bond->id }}" @selected(old('bond_id') == $bond->id)>{{ $bond->patient->user->name }}</option>
                            @endforeach
                        </select>
                        @error('bond_id') <p class="error" id="bond-error">{{ $message }}</p> @enderror
                    </div>
                    <div class="field">
                        <label for="scheduled_date">Data <span aria-hidden="true">*</span></label>
                        <input id="scheduled_date" name="scheduled_date" type="date" min="{{ now()->toDateString() }}" required value="{{ old('scheduled_date') }}" @if ($errors->hasAny(['scheduled_date', 'scheduled_at'])) aria-invalid="true" aria-describedby="{{ $errors->has('scheduled_date') ? 'scheduled-date-error' : 'scheduled-at-error' }}" @endif>
                        @error('scheduled_date') <p class="error" id="scheduled-date-error">{{ $message }}</p> @enderror
                    </div>
                    <div class="field">
                        <label for="scheduled_time">Hora <span aria-hidden="true">*</span></label>
                        <input id="scheduled_time" name="scheduled_time" type="time" required value="{{ old('scheduled_time') }}" @if ($errors->hasAny(['scheduled_time', 'scheduled_at'])) aria-invalid="true" aria-describedby="{{ $errors->has('scheduled_time') ? 'scheduled-time-error' : 'scheduled-at-error' }}" @endif>
                        @error('scheduled_time') <p class="error" id="scheduled-time-error">{{ $message }}</p> @enderror
                        @error('scheduled_at') <p class="error" id="scheduled-at-error">{{ $message }}</p> @enderror
                    </div>
                    <div class="field">
                        <label for="modality">Modalidade</label>
                        <select id="modality" name="modality" @error('modality') aria-invalid="true" aria-describedby="modality-error" @enderror>
                            <option value="">Sem informar</option>
                            @foreach ($modalityLabels as $value => $label)
                                <option value="{{ $value }}" @selected(old('modality') === $value)>{{ $label }}</option>
                            @endforeach
                        </select>
                        @error('modality') <p class="error" id="modality-error">{{ $message }}</p> @enderror
                    </div>
                    <div class="field">
                        <label for="notes">Observação</label>
                        <p class="muted" id="notes-hint">O paciente vê esta observação no app. Não use para anotação clínica.</p>
                        <textarea id="notes" name="notes" maxlength="255" aria-describedby="notes-hint @error('notes') notes-error @enderror" @error('notes') aria-invalid="true" @enderror>{{ old('notes') }}</textarea>
                        @error('notes') <p class="error" id="notes-error">{{ $message }}</p> @enderror
                    </div>
                    <button type="submit">Agendar consulta</button>
                </form>
            @endif
        </section>

        <section class="card" aria-labelledby="list-title">
            <h2 id="list-title">Consultas</h2>
            @if ($appointments->isEmpty())
                <p>Nenhuma consulta agendada ainda.</p>
            @else
                <ul class="appointment-list">
                    @foreach ($appointments as $appointment)
                        <li>
                            <h3>{{ $appointment->bond->patient->user->name }}</h3>
                            <p class="muted">{{ $appointment->scheduled_at->format('d/m/Y') }} às {{ $appointment->scheduled_at->format('H:i') }} | {{ $modalityLabels[$appointment->modality] ?? 'Modalidade não informada' }}</p>
                            @if ($appointment->notes) <p>{{ $appointment->notes }}</p> @endif
                            <p class="status">{{ $statusLabels[$appointment->status] }}</p>
                            @if ($appointment->bond->status === 'ended') <p class="muted">Vínculo encerrado, somente leitura</p> @endif
                        </li>
                    @endforeach
                </ul>
            @endif
        </section>
    </div>
</main>
</body>
</html>
