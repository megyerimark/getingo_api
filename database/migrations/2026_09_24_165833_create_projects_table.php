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
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('title'); // Projekt címe[cite: 2]
            $table->text('description'); // Projekt leírása[cite: 2]
            $table->string('difficulty'); // Nehézség[cite: 2]
            $table->integer('estimated_time'); // Becsült idő percekben[cite: 2]
            $table->text('solution')->nullable(); // Minta megoldás[cite: 2]
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
