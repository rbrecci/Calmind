<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Services\LoginThrottle;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;

class AdminSessionController extends Controller
{
    public function create(): View
    {
        return view('admin.login');
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

        if (! Auth::attempt($credentials + ['role' => 'admin', 'status' => 'active'])) {
            $throttle->hit($credentials['email'], $request->ip());

            return back()->withErrors(['email' => 'E-mail ou senha inválidos.'])->onlyInput('email');
        }

        $throttle->clear($credentials['email'], $request->ip());

        $request->session()->regenerate();

        return redirect()->route('admin.registrations.index');
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('admin.login');
    }
}
