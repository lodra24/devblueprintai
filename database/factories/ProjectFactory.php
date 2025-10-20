<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use App\Enums\ProjectStatus;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Project>
 */
class ProjectFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => $this->faker->company(),
            'idea_text' => $this->faker->paragraph(),
            'status' => ProjectStatus::Ready,
            'progress' => 100,
            'blueprint' => null,
            'claimed_at' => null,
        ];
    }

    /**
     * Indicate that the project is for a guest.
     */
    public function asGuest(): static
    {
        return $this->state(fn (array $attributes) => [
            'user_id' => null,
        ]);
    }
}
