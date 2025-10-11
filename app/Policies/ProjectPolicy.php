<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class ProjectPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return false;
    }

    /**
     * Determine whether the user can view the model.
     * 
     * ?User type-hint'i sayesinde bu policy, hem giriş yapmış hem de misafir
     * kullanıcılar için çalışacaktır. Misafir ise $user null olacaktır.
     */
    public function view(?User $user, Project $project): bool
    {
   
        return $project->user_id === null || ($user && $user->id === $project->user_id);
    }

    /**
     * Determine whether the user can claim the model.
     * Kullanıcının bir projeyi sahiplenip sahiplenemeyeceğini belirler.
     */
    public function claim(User $user, Project $project): Response // Dönüş tipini değiştirin
{
        return $project->user_id === null
            ? Response::allow()
            : Response::deny('This project has already been claimed.', 409); 
}

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(?User $user, Project $project): bool
    {

        return $user?->id === $project->user_id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Project $project): bool
    {
        return false;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Project $project): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Project $project): bool
    {
        return false;
    }
}