<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = \App\Models\Booking::with('facility')
            ->select('id', 'facility_id', 'user_id', 'date', 'start_time', 'end_time', 'status')
            ->latest();

        if ($request->user() && $request->user()->role !== 'admin') {
            $query->where('user_id', $request->user()->id);
        }

        return response()->json($query->get());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'facility_id' => 'required|exists:facilities,id',
            'user_id' => 'required|exists:users,id',
            'date' => 'required|date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
        ]);

        if ($this->hasConflict($request->facility_id, $request->date, $request->start_time, $request->end_time)) {
             return response()->json(['message' => 'The facility is already booked for this time slot.'], 409);
        }

        $booking = \App\Models\Booking::create($validated);
        $booking->refresh();

        return response()->json($booking, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        return \App\Models\Booking::findOrFail($id);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $booking = \App\Models\Booking::findOrFail($id);

        $validated = $request->validate([
            'facility_id' => 'sometimes|exists:facilities,id',
            'user_id' => 'sometimes|exists:users,id',
            'date' => 'sometimes|date',
            'start_time' => 'sometimes|date_format:H:i',
            'end_time' => 'sometimes|date_format:H:i|after:start_time',
            'status' => 'sometimes|string',
        ]);

        $userId = $request->input('user_id', $booking->user_id);

        if ($this->hasConflict(
            $request->input('facility_id', $booking->facility_id),
            $request->input('date', $booking->date),
            $request->input('start_time', $booking->start_time),
            $request->input('end_time', $booking->end_time),
            $id,
            $userId
        )) {
             return response()->json(['message' => 'The facility is already booked for this time slot.'], 409);
        }

        $booking->update($validated);

        return response()->json($booking);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $booking = \App\Models\Booking::findOrFail($id);
        $booking->update(['status' => 'cancelled']);

        return response()->json($booking);
    }

    /**
     * Check facility availability.
     */
    public function checkAvailability(Request $request)
    {
        $request->validate([
            'facility_id' => 'required|exists:facilities,id',
            'date' => 'required|date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
        ]);

        $isAvailable = !$this->hasConflict(
            $request->facility_id,
            $request->date,
            $request->start_time,
            $request->end_time
        );

        return response()->json(['available' => $isAvailable]);
    }

    private function hasConflict($facilityId, $date, $startTime, $endTime, $ignoreBookingId = null, $userId = null): bool
    {
        return \App\Models\Booking::where('facility_id', $facilityId)
            ->where('date', $date)
            ->where('status', '!=', 'cancelled')
            ->where(function ($query) use ($startTime, $endTime) {
                $query->where('start_time', '<', $endTime)
                      ->where('end_time', '>', $startTime);
            })
            ->when($ignoreBookingId, fn ($q) => $q->where('id', '!=', $ignoreBookingId))
            ->when($userId, fn ($q) => $q->where('user_id', '!=', $userId))
            ->exists();
    }
}
