<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class FacilitySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $building = \App\Models\Building::firstOrCreate(
            ['name' => 'Main Building'],
            ['location' => 'Campus']
        );

        \App\Models\Facility::create([
            'name' => 'Conference Room A',
            'building_id' => $building->id,
            'capacity' => 20,
        ]);

        \App\Models\Facility::create([
            'name' => 'Main Hall',
            'building_id' => $building->id,
            'capacity' => 100,
        ]);

        \App\Models\Facility::create([
            'name' => 'Tennis Court',
            'building_id' => $building->id,
            'capacity' => 4,
        ]);
    }
}
