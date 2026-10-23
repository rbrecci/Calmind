<?php

namespace App\Models;

use App\Models\Concerns\SerializesContractDates;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

abstract class BaseModel extends Model
{
    use HasFactory, SerializesContractDates;
}
