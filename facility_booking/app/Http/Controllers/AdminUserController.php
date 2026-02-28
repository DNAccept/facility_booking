<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminUserController extends Controller
{
    /** List all registered users */
    public function index(): JsonResponse
    {
        $users = User::select('id', 'name', 'email', 'role', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($users);
    }

    /**
     * Promote or demote a user.
     * Requires the requesting admin's own password for confirmation.
     */
    public function updateRole(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'role'     => ['required', 'in:user,admin'],
            'password' => ['required', 'string'],
        ]);

        // Verify the acting admin's password
        $admin = $request->user();
        if (! Hash::check($request->password, $admin->password)) {
            return response()->json(['message' => 'Incorrect password.'], 403);
        }

        // Prevent self-demotion
        if ((int) $id === $admin->id) {
            return response()->json(['message' => 'You cannot change your own role.'], 422);
        }

        $target = User::findOrFail($id);
        $target->update(['role' => $request->role]);

        return response()->json([
            'message' => "User {$target->name} is now {$request->role}.",
            'user'    => $target->only('id', 'name', 'email', 'role'),
        ]);
    }
}
