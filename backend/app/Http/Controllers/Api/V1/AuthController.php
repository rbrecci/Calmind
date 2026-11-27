<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\InvalidCredentialsException;
use App\Http\Controllers\Controller;
use App\Http\Requests\LoginUserRequest;
use App\Http\Requests\RegisterUserRequest;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use App\Services\LoginThrottle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(private AuthService $auth) {}

    public function register(RegisterUserRequest $request): JsonResponse
    {
        $user = $this->auth->register($request->validated());

        return response()->json(['user' => new UserResource($user)], 201);
    }

    public function login(LoginUserRequest $request, LoginThrottle $throttle): JsonResponse
    {
        $email = $request->validated('email');
        $throttle->ensureAllowed($email, $request->ip());

        try {
            $token = $this->auth->login($email, $request->validated('password'));
        } catch (InvalidCredentialsException $e) {
            $throttle->hit($email, $request->ip());

            throw $e;
        }

        $throttle->clear($email, $request->ip());

        // RNF-07: o token aparece so aqui
        return response()->json(['token' => $token]);
    }

    public function logout(Request $request): JsonResponse
    {
        $this->auth->logout($request->user());

        return response()->json(['message' => 'Sessão encerrada.']);
    }

    public function me(Request $request): UserResource
    {
        return new UserResource($request->user());
    }
}
