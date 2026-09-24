<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('lessons', function (Blueprint $table) {
            $table->id();
            // Kapcsolat a categories táblával. Ha a kategória törlődik, a leckék is.
            $table->foreignId('category_id')->constrained()->onDelete('cascade'); 
        
            $table->string('title'); // Lecke címe[cite: 2]
            $table->string('slug')->unique(); // Keresőbarát URL[cite: 2]
            $table->text('content'); // Az elméleti anyag[cite: 2]
            $table->text('example_code')->nullable(); // Kódpélda (opcionális)[cite: 2]
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lessons');
    }
};
