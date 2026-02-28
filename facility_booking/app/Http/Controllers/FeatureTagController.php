<?php

namespace App\Http\Controllers;

use App\Models\FeatureTag;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FeatureTagController extends Controller
{
    /** List all available feature tags (public). */
    public function index(): JsonResponse
    {
        return response()->json(FeatureTag::orderBy('name')->get());
    }

    /** Create a new feature tag (admin only). */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:64', 'unique:feature_tags,name'],
        ]);

        $tag = FeatureTag::create($data);

        return response()->json($tag, 201);
    }

    /** Delete a feature tag (admin only). */
    public function destroy(string $id): JsonResponse
    {
        FeatureTag::findOrFail($id)->delete();

        return response()->json(null, 204);
    }
}
