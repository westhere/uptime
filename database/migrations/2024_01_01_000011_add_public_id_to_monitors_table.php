<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('monitors', function (Blueprint $table) {
            $table->string('public_id', 12)->nullable()->unique()->after('id');
        });

        // Backfill any existing rows
        DB::table('monitors')->get()->each(function ($monitor) {
            DB::table('monitors')
                ->where('id', $monitor->id)
                ->update(['public_id' => Str::random(12)]);
        });

        Schema::table('monitors', function (Blueprint $table) {
            $table->string('public_id', 12)->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('monitors', function (Blueprint $table) {
            $table->dropColumn('public_id');
        });
    }
};
