<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Complaint;
use App\Models\Facility;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class AdminStatsController extends Controller
{
    public function index(): JsonResponse
    {
        $stats = Cache::remember('admin_dashboard_stats', 60, function () {
            $totalBookings = Booking::count();
            $totalFacilities = Facility::count();
            $openComplaints = Complaint::where('status', 'open')->count();
            $cancelledBookings = Booking::where('status', 'cancelled')->count();

            // Booking count per room (for the bar chart), include building name
            $bookingsPerFacility = Facility::withCount([
                'bookings',
                'bookings as active_bookings_count' => fn ($q) => $q->where('status', '!=', 'cancelled'),
            ])->get(['id', 'name', 'building_id'])->map(fn ($f) => [
                'id'           => $f->id,
                'name'         => $f->name,
                'building_name' => $f->building?->name,
                'total'        => $f->bookings_count,
                'active'       => $f->active_bookings_count,
            ]);

            // Recent 20 bookings with user + facility + building detail
            $recentBookings = Booking::with([
                'user:id,name,email',
                'facility:id,name,building_id',
                'facility.building:id,name,location',
            ])
                ->latest()
                ->limit(20)
                ->get(['id', 'facility_id', 'user_id', 'date', 'start_time', 'end_time', 'status', 'created_at']);

            return [
                'total_bookings'       => $totalBookings,
                'total_facilities'     => $totalFacilities,
                'open_complaints'      => $openComplaints,
                'cancelled_bookings'   => $cancelledBookings,
                'bookings_per_facility' => $bookingsPerFacility,
                'recent_bookings'      => $recentBookings,
            ];
        });

        return response()->json($stats);
    }
}
