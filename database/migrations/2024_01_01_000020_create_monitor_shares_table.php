<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('monitor_shares', function (Blueprint $table) {
            $table->id();
            $table->foreignId('monitor_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('permission', ['view', 'edit'])->default('view');
            $table->timestamps();

            $table->unique(['monitor_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('monitor_shares');
    }
};
