<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Services\LoginThrottle;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;

class PsychologistSessionController extends Controller
{
    public function create(): View
    {
        return view('psychologist.login');
    }

    public function store(Request $request, LoginThrottle $throttle): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        // Bloqueado: volta ao formulario com o aviso, em vez da pagina 429
        try {
            $throttle->ensureAllowed($credentials['email'], $request->ip());
        } catch (ThrottleRequestsException) {
            return back()->withErrors(['email' => 'Muitas tentativas. Tente novamente em instantes.'])->onlyInput('email');
        }

        if (! Auth::validate($credentials + ['role' => 'psychologist', 'status' => 'active'])) {
            $throttle->hit($credentials['email'], $request->ip());

            return back()->withErrors(['email' => 'E-mail ou senha inválidos.'])->onlyInput('email');
        }

        $throttle->clear($credentials['email'], $request->ip());

        // So depois da senha certa diz que o cadastro nao foi aprovado; sem aprovacao nao abre sessao
        $user = Auth::getLastAttempted();
        $approval = $user->psychologist?->approval_status;

        if ($approval !== 'approved') {
            $message = $approval === 'rejected'
                ? 'Seu cadastro profissional não foi aprovado. Veja o motivo e envie um novo cadastro pelo aplicativo.'
                : 'Seu cadastro profissional ainda está em análise. O acesso ao painel é liberado após a aprovação.';

            return back()->withErrors(['email' => $message])->onlyInput('email');
        }

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->route('psychologist.tasks.index');
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('psychologist.login');
    }
}
