<!doctype html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Tarefas | Calmind</title>
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
        .task-list { list-style: none; padding: 0; display: grid; gap: .8rem; }
        .task-list li { border: 1px solid #cbded5; border-radius: .5rem; padding: 1rem; }
        .task-list h3 { margin: 0 0 .25rem; }
        .task-list p { margin: .3rem 0; }
        .status { display: inline-block; font-weight: 700; }
        .muted { color: #435e55; }
        @media (max-width: 47rem) { .layout { grid-template-columns: 1fr; } main { padding: 1rem; } }
    </style>
</head>
<body>
<header><div><span>Calmind | Área do psicólogo</span><form method="post" action="{{ route('psychologist.logout') }}">@csrf<button type="submit">Sair</button></form></div></header>
<main>
    <h1>Tarefas terapêuticas</h1>
    <p>Acompanhe as tarefas dos seus pacientes. Vínculos encerrados aparecem para consulta.</p>

    @if (session('status'))
        <p class="notice" role="status">{{ session('status') }}</p>
    @endif

    <div class="layout">
        <section class="card" aria-labelledby="create-title">
            <h2 id="create-title">Nova tarefa</h2>
            @if ($activeBonds->isEmpty())
                <p>Você precisa de um vínculo ativo para criar uma tarefa.</p>
            @else
                <form method="post" action="{{ route('psychologist.tasks.store') }}">
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
                        <label for="title">Título <span aria-hidden="true">*</span></label>
                        <input id="title" name="title" type="text" maxlength="150" required value="{{ old('title') }}" @error('title') aria-invalid="true" aria-describedby="title-error" @enderror>
                        @error('title') <p class="error" id="title-error">{{ $message }}</p> @enderror
                    </div>
                    <div class="field">
                        <label for="description">Descrição</label>
                        <textarea id="description" name="description">{{ old('description') }}</textarea>
                        @error('description') <p class="error">{{ $message }}</p> @enderror
                    </div>
                    <div class="field">
                        <label for="due_date">Prazo <span aria-hidden="true">*</span></label>
                        <input id="due_date" name="due_date" type="date" min="{{ now()->toDateString() }}" required value="{{ old('due_date') }}" @error('due_date') aria-invalid="true" aria-describedby="due-error" @enderror>
                        @error('due_date') <p class="error" id="due-error">{{ $message }}</p> @enderror
                    </div>
                    <button type="submit">Criar tarefa</button>
                </form>
            @endif
        </section>

        <section class="card" aria-labelledby="list-title">
            <h2 id="list-title">Acompanhamento</h2>
            @if ($tasks->isEmpty())
                <p>Nenhuma tarefa atribuída ainda.</p>
            @else
                <ul class="task-list">
                    @foreach ($tasks as $task)
                        <li>
                            <h3>{{ $task->title }}</h3>
                            <p class="muted">{{ $task->bond->patient->user->name }} | Prazo: {{ $task->due_date->format('d/m/Y') }}</p>
                            @if ($task->description) <p>{{ $task->description }}</p> @endif
                            @if ($task->completed_at)
                                <p class="status">Concluída em {{ $task->completed_at->format('d/m/Y H:i') }}</p>
                            @else
                                <p class="status">Pendente</p>
                            @endif
                            @if ($task->bond->status === 'ended') <p class="muted">Vínculo encerrado, somente leitura</p> @endif
                        </li>
                    @endforeach
                </ul>
            @endif
        </section>
    </div>
</main>
</body>
</html>
