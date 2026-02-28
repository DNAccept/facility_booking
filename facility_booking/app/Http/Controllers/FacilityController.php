<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreFacilityRequest;
use App\Models\Booking;
use App\Models\Facility;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FacilityController extends Controller
{
    /** List rooms, optionally filtered by building. */
    public function index(Request $request): JsonResponse
    {
        $query = Facility::query();

        if ($request->has('building_id')) {
            $query->where('building_id', $request->integer('building_id'));
        }

        return response()->json($query->get());
    }

    /**
     * Find rooms that are fully available for a given date + time window.
     * GET /available-rooms?date=YYYY-MM-DD&start_time=HH:MM&end_time=HH:MM
     */
    public function availableRooms(Request $request): JsonResponse
    {
        $request->validate([
            'date'       => ['required', 'date'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time'   => ['required', 'date_format:H:i', 'after:start_time'],
        ]);

        $conflicting = Booking::where('date', $request->date)
            ->where('status', '!=', 'cancelled')
            ->where('start_time', '<', $request->end_time)
            ->where('end_time', '>', $request->start_time)
            ->pluck('facility_id');

        $rooms = Facility::whereNotIn('id', $conflicting)->get();

        return response()->json($rooms);
    }

    public function store(StoreFacilityRequest $request): JsonResponse
    {
        $facility = Facility::create($request->validated());

        return response()->json($facility->load('building'), 201);
    }

    public function show(string $id): JsonResponse
    {
        return response()->json(Facility::findOrFail($id));
    }

    public function update(StoreFacilityRequest $request, string $id): JsonResponse
    {
        $facility = Facility::findOrFail($id);
        $facility->update($request->validated());

        return response()->json($facility->fresh());
    }

    public function destroy(string $id): JsonResponse
    {
        Facility::destroy($id);

        return response()->json(null, 204);
    }

    /**
     * Return 30-minute slots (06:00–22:00) for a room on a given date,
     * each marked as 'available' or 'booked'.
     */
    public function slots(Request $request, string $id): JsonResponse
    {
        $request->validate(['date' => 'required|date']);

        $facility = Facility::findOrFail($id);
        $date = $request->date;

        $bookings = Booking::where('facility_id', $facility->id)
            ->where('date', $date)
            ->where('status', '!=', 'cancelled')
            ->get(['start_time', 'end_time']);

        $slots = [];
        $cursor = Carbon::createFromTimeString('06:00');
        $end = Carbon::createFromTimeString('22:00');

        while ($cursor->lt($end)) {
            $slotStart = $cursor->copy();
            $slotEnd = $cursor->addMinutes(30)->copy();

            $booked = $bookings->first(function ($b) use ($slotStart, $slotEnd) {
                $bStart = Carbon::createFromTimeString($b->start_time);
                $bEnd = Carbon::createFromTimeString($b->end_time);

                return $slotStart->lt($bEnd) && $slotEnd->gt($bStart);
            });

            $slots[] = [
                'start'  => $slotStart->format('H:i'),
                'end'    => $slotEnd->format('H:i'),
                'status' => $booked ? 'booked' : 'available',
            ];
        }

        return response()->json($slots);
    }
}
