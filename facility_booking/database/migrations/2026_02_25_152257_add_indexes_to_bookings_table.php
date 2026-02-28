<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            // Speeds up slot/availability queries that filter by facility + date + status
            $table->index(['facility_id', 'date', 'status'], 'bookings_facility_date_status_idx');
            // Speeds up the "my bookings" list query
            $table->index(['user_id', 'status'], 'bookings_user_status_idx');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropIndex('bookings_facility_date_status_idx');
            $table->dropIndex('bookings_user_status_idx');
        });
    }
};
