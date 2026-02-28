<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('feature_tags', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();
        });

        // Seed the default presets
        $defaults = ['AC', 'Smartboard', 'Projector', 'Whiteboard', 'Video Conferencing', 'Wi-Fi', 'Printer', 'TV Screen'];
        foreach ($defaults as $tag) {
            \DB::table('feature_tags')->insert(['name' => $tag, 'created_at' => now(), 'updated_at' => now()]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('feature_tags');
    }
};
