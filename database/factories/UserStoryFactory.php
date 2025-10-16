<?php

namespace Database\Factories;

use App\Models\Epic;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\UserStory>
 */
class UserStoryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'epic_id' => Epic::factory(),
            'content' => $this->faker->sentence(),
            'status' => $this->faker->randomElement(['todo', 'in_progress', 'done']),
            'priority' => $this->faker->randomElement(['low', 'medium', 'high']),
            'position' => $this->faker->unique()->randomNumber(),
        ];
    }
}