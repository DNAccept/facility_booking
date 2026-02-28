<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateAccountRequest;
use App\Models\User;
use App\Notifications\UserNameUpdated;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;

class AccountController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json($request->user());
    }

    public function update(UpdateAccountRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $data = $request->only(['name', 'email']);

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $oldName = $user->name;
        $user->update($data);

        // Notify admins if the name has changed
        if ($oldName !== $user->name) {
            $admins = User::where('role', 'admin')->get();
            Notification::send($admins, new UserNameUpdated($user, $oldName));
        }

        return response()->json($user->fresh());
    }

    public function destroy(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $user->tokens()->delete();
        $user->delete();

        return response()->json(null, 204);
    }
}
