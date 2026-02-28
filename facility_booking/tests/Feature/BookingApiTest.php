<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class BookingApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_get_facilities(): void
    {
        $this->seed();
        
        $response = $this->getJson('/api/facilities');

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     '*' => ['id', 'name', 'building_id', 'capacity']
                 ]);
    }

    public function test_can_create_booking(): void
    {
        $this->seed();
        $facility = \App\Models\Facility::first();
        $user = \App\Models\User::first();

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/bookings', [
            'facility_id' => $facility->id,
            'user_id' => $user->id,
            'date' => now()->addDays(5)->toDateString(),
            'start_time' => '10:00',
            'end_time' => '12:00',
        ]);

        $response->assertStatus(201)
                 ->assertJsonFragment(['status' => 'booked']);
    }

    public function test_cannot_create_conflicting_booking(): void
    {
        $this->seed();
        $facility = \App\Models\Facility::first();
        $user1 = \App\Models\User::first();
        $user2 = \App\Models\User::factory()->create();
        $date = now()->addDays(5)->toDateString();

        // Create first booking for user1
        \App\Models\Booking::create([
            'facility_id' => $facility->id,
            'user_id' => $user1->id,
            'date' => $date,
            'start_time' => '10:00',
            'end_time' => '12:00',
            'status' => 'booked',
        ]);

        // Try to create overlapping booking for user2
        $response = $this->actingAs($user2, 'sanctum')->postJson('/api/bookings', [
            'facility_id' => $facility->id,
            'user_id' => $user2->id,
            'date' => $date,
            'start_time' => '11:00', // Overlaps
            'end_time' => '13:00',
        ]);

        $response->assertStatus(409);
    }

    public function test_cannot_create_overlapping_booking_for_same_user(): void
    {
        $this->seed();
        $facility = \App\Models\Facility::first();
        $user = \App\Models\User::first();
        $date = now()->addDays(5)->toDateString();

        // Create first booking
        \App\Models\Booking::create([
            'facility_id' => $facility->id,
            'user_id' => $user->id,
            'date' => $date,
            'start_time' => '10:00',
            'end_time' => '12:00',
            'status' => 'booked',
        ]);

        // Try to create overlapping booking for the SAME user (should fail)
        $response = $this->actingAs($user, 'sanctum')->postJson('/api/bookings', [
            'facility_id' => $facility->id,
            'user_id' => $user->id,
            'date' => $date,
            'start_time' => '11:00', // Overlaps
            'end_time' => '13:00',
        ]);

        $response->assertStatus(409);
    }

    public function test_can_update_overlapping_booking_for_same_user(): void
    {
        $this->seed();
        $facility = \App\Models\Facility::first();
        $user = \App\Models\User::first();
        $date = now()->addDays(5)->toDateString();

        // Create first booking
        \App\Models\Booking::create([
            'facility_id' => $facility->id,
            'user_id' => $user->id,
            'date' => $date,
            'start_time' => '10:00',
            'end_time' => '12:00',
            'status' => 'booked',
        ]);

        // Create second booking (different time)
        $booking2 = \App\Models\Booking::create([
            'facility_id' => $facility->id,
            'user_id' => $user->id,
            'date' => $date,
            'start_time' => '14:00',
            'end_time' => '16:00',
            'status' => 'booked',
        ]);

        // Try to update second booking to overlap with first booking for the SAME user (should succeed)
        $response = $this->actingAs($user, 'sanctum')->putJson('/api/bookings/' . $booking2->id, [
            'start_time' => '11:00', // Overlaps first booking
            'end_time' => '13:00',
        ]);

        $response->assertStatus(200);
    }

    public function test_can_check_availability(): void
    {
        $this->seed();
        $facility = \App\Models\Facility::first();
        $date = now()->addDays(10)->toDateString();

        $response = $this->getJson("/api/availability?facility_id={$facility->id}&date={$date}&start_time=10:00&end_time=12:00");

        $response->assertStatus(200)
                 ->assertJson(['available' => true]);
    }
}
