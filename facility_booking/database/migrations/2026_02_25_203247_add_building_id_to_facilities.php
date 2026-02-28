<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // First create a default building for existing facilities
        $defaultBuilding = \App\Models\Building::firstOrCreate(
            ['name' => 'Main Building'],
            ['location' => 'Campus']
        );

        Schema::table('facilities', function (Blueprint $table) {
            $table->unsignedBigInteger('building_id')->nullable()->after('id');
            $table->foreign('building_id')->references('id')->on('buildings')->onDelete('cascade');
        });

        // Assign all existing facilities to the default building
        \App\Models\Facility::whereNull('building_id')->update(['building_id' => $defaultBuilding->id]);

        // Now make it non-nullable
        Schema::table('facilities', function (Blueprint $table) {
            $table->unsignedBigInteger('building_id')->nullable(false)->change();
        });

        // Drop the old location column (location now lives on buildings)
        Schema::table('facilities', function (Blueprint $table) {
            $table->dropColumn('location');
        });
    }

    public function down(): void
    {
        Schema::table('facilities', function (Blueprint $table) {
            $table->string('location')->default('');
        });

        Schema::table('facilities', function (Blueprint $table) {
            $table->dropForeign(['building_id']);
            $table->dropColumn('building_id');
        });
    }
};
