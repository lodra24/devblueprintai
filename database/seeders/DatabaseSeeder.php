<?php

namespace Database\Seeders;

use App\Models\Epic;
use App\Models\Project;
use App\Models\User;
use App\Models\UserStory;
use Illuminate\Database\Seeder;
use Illuminate\Database\Eloquent\Factories\Sequence;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $user = User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        Project::factory()
            ->has(
                Epic::factory()
                    ->count(3)
                    // Use a sequence to set the position in increments of 100
                    ->state(new Sequence(
                        fn (Sequence $sequence) => ['position' => ($sequence->index + 1) * 100],
                    ))
                    ->has(
                        UserStory::factory()
                            ->count(5)
                            // Use a sequence for user story positions as well
                            ->state(new Sequence(
                                fn (Sequence $sequence) => ['position' => ($sequence->index + 1) * 100],
                            ))
                        , 'userStories')
            )
            ->for($user)
            ->create([
                'name' => 'My First Test Project',
            ]);
    }
}