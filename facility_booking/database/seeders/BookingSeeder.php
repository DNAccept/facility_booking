<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class BookingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = \App\Models\User::first();
        $facility = \App\Models\Facility::first();

        if ($user && $facility) {
             \App\Models\Booking::create([
                'facility_id' => $facility->id,
                'user_id' => $user->id,
                'date' => now()->toDateString(),
                'start_time' => '10:00:00',
                'end_time' => '11:00:00',
                'status' => 'booked',
            ]);

            \App\Models\Booking::create([
                'facility_id' => $facility->id,
                'user_id' => $user->id,
                'date' => now()->addDay()->toDateString(),
                'start_time' => '14:00:00',
                'end_time' => '15:00:00',
                'status' => 'booked',
            ]);
        }
    }
}
