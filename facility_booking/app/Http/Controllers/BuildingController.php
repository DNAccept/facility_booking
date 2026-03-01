<?php

namespace App\Http\Controllers;

use App\Models\Building;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class BuildingController extends Controller
{
    /** List all buildings with a room count (public). */
    public function index(): JsonResponse
    {
        $buildings = Cache::rememberForever('buildings_all', function () {
            return Building::withCount('rooms')->orderBy('name')->get();
        });

        return response()->json($buildings);
    }

    /** Return a single building with all its rooms (public). */
    public function show(string $id): JsonResponse
    {
        $building = Building::with('rooms')->findOrFail($id);

        return response()->json($building);
    }

    /** Create a new building (admin only). */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'location' => ['required', 'string', 'max:255'],
        ]);

        $building = Building::create($data);

        Cache::forget('buildings_all'); // clear cache

        return response()->json($building->loadCount('rooms'), 201);
    }

    /** Update a building (admin only). */
    public function update(Request $request, string $id): JsonResponse
    {
        $building = Building::findOrFail($id);

        $data = $request->validate([
            'name'     => ['sometimes', 'string', 'max:255'],
            'location' => ['sometimes', 'string', 'max:255'],
        ]);

        $building->update($data);

        Cache::forget('buildings_all'); // clear cache

        return response()->json($building->loadCount('rooms'));
    }

    /** Delete a building and cascade-delete all its rooms (admin only). */
    public function destroy(string $id): JsonResponse
    {
        Building::findOrFail($id)->delete();

        Cache::forget('buildings_all'); // clear cache

        return response()->json(['message' => 'Building deleted.']);
    }
}
