<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Facility;
use App\Models\User;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'facility_id',
        'user_id',
        'date',
        'start_time',
        'end_time',
        'status',
    ];

    public function facility()
    {
        return $this->belongsTo(Facility::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
