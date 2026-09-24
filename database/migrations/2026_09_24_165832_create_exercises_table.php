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
        Schema::create('exercises', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained()->onDelete('cascade'); // Kategória hivatkozás[cite: 2]
            $table->string('title'); // Feladat címe[cite: 2]
            $table->text('description'); // Feladat leírása[cite: 2]
            $table->string('difficulty'); // Nehézségi szint (pl. 'kezdő', 'haladó')[cite: 2]
            $table->text('solution')->nullable(); // Megoldás kódja[cite: 2]
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exercises');
    }
};
