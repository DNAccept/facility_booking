<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreComplaintRequest;
use App\Models\Complaint;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ComplaintController extends Controller
{
    /** User: list their own complaints */
    public function index(Request $request): JsonResponse
    {
        $complaints = Complaint::where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json($complaints);
    }

    /** User: submit a new complaint */
    public function store(StoreComplaintRequest $request): JsonResponse
    {
        $complaint = Complaint::create([
            ...$request->validated(),
            'user_id' => $request->user()->id,
        ]);

        return response()->json($complaint, 201);
    }

    /** Admin: list all complaints with submitting user */
    public function adminIndex(): JsonResponse
    {
        $complaints = Complaint::with('user:id,name,email')
            ->latest()
            ->get();

        return response()->json($complaints);
    }

    /** Admin: update status and/or add notes */
    public function adminUpdate(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'status' => ['sometimes', 'in:open,in_progress,resolved'],
            'admin_notes' => ['sometimes', 'nullable', 'string'],
        ]);

        $complaint = Complaint::findOrFail($id);
        $complaint->update($request->only('status', 'admin_notes'));

        return response()->json($complaint->load('user:id,name,email'));
    }
}
