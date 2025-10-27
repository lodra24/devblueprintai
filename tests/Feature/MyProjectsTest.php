<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MyProjectsTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_my_projects(): void
    {
        $response = $this->getJson('/api/my-projects');

        $response->assertUnauthorized();
    }

    public function test_authenticated_user_receives_paginated_projects_with_only_their_data(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        // Projects that belong to a different user should never appear.
        Project::factory()->count(3)->for($otherUser)->create();

        // Create a deterministic set of projects for the authenticated user.
        $projects = Project::factory()
            ->count(12)
            ->sequence(fn ($sequence) => [
                'user_id' => $user->id,
                'created_at' => now()->subDays(12 - $sequence->index),
                'updated_at' => now()->subDays(12 - $sequence->index),
            ])
            ->create();

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/my-projects?page=2&per_page=5');

        $response->assertOk()
            ->assertJsonCount(5, 'data')
            ->assertJsonPath('meta.total', 12)
            ->assertJsonPath('meta.per_page', 5)
            ->assertJsonPath('meta.current_page', 2);

        $responseProjectIds = collect($response->json('data'))->pluck('id');

        $expectedIds = $projects
            ->sortByDesc('updated_at')
            ->slice(5, 5)
            ->pluck('id')
            ->values();

        $this->assertEquals($expectedIds->all(), $responseProjectIds->all());

        // Ensure the payload is lean (idea_text omitted) and only contains the user's projects.
        collect($response->json('data'))->each(function (array $project) use ($projects) {
            $this->assertArrayNotHasKey('idea_text', $project);
            $this->assertTrue($projects->pluck('id')->contains($project['id']));
        });
    }
}
