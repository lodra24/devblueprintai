import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { ProjectSummary } from "@/types/ProjectSummary";
import { useProjectRowMutations } from "@/hooks/useProjectRowMutations";
import ConfirmModal from "@/components/ui/ConfirmModal";

type Props = {
    project: ProjectSummary;
    blueprintHref: string;
    lastUpdatedLabel: string;
    isMenuOpen: boolean;
    onToggleMenu: () => void;
    onCloseMenu: () => void;
    onPrefetch: () => void;
};

export default function ProjectRow({
    project,
    blueprintHref,
    lastUpdatedLabel,
    isMenuOpen,
    onToggleMenu,
    onCloseMenu,
    onPrefetch,
}: Props) {
    const [displayName, setDisplayName] = useState(project.name);
    const [renameValue, setRenameValue] = useState(project.name);
    const [isEditing, setIsEditing] = useState(false);
    const firstActionRef = useRef<HTMLButtonElement | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const {
        renameProject,
        deleteProject: deleteProjectMutation,
        isRenaming,
        isDeleting,
    } = useProjectRowMutations(project.id);

    useEffect(() => {
        setDisplayName(project.name);
        if (!isEditing) {
            setRenameValue(project.name);
        }
    }, [project.name, isEditing]);

    const handleRenameOpen = () => {
        setIsEditing(true);
        setRenameValue(displayName);
        onCloseMenu();
    };

    const handleRenameCancel = () => {
        setRenameValue(displayName);
        setIsEditing(false);
    };

    const handleRenameSubmit = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();
        const nextValue = renameValue.trim();
        if (!nextValue || nextValue === displayName) {
            setRenameValue(displayName);
            setIsEditing(false);
            return;
        }

        try {
            const updatedProject = await renameProject(nextValue);
            setDisplayName(updatedProject.name);
            setRenameValue(updatedProject.name);
            setIsEditing(false);
        } catch {
            // errors handled via toast
        }
    };

    const handleDeleteClick = () => {
        onCloseMenu();
        setShowDeleteConfirm(true);
    };

    const handleDeleteConfirm = async () => {
        if (isDeleting) {
            return;
        }
        try {
            await deleteProjectMutation();
            setShowDeleteConfirm(false);
        } catch {
            // toast already handled
        }
    };

    const handleDeleteCancel = () => {
        if (!isDeleting) {
            setShowDeleteConfirm(false);
        }
    };

    const rowEditingAttr = isEditing ? "true" : undefined;
    const menuStateAttr = isMenuOpen ? "true" : "false";

    return (
        <li
            className="row-card px-5 py-4 md:px-6 md:py-5"
            data-row
            data-editing={rowEditingAttr}
        >
            <Link
                to={blueprintHref}
                className="row-link"
                aria-label={`Open ${displayName}`}
                onMouseEnter={onPrefetch}
            />
            <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
                <div className="flex-1 min-w-0">
                    <div className="title-wrap flex items-center gap-3">
                        <h3 className="font-display text-[18px] md:text-[19px] font-semibold tracking-tight truncate">
                            {displayName}
                        </h3>
                    </div>
                    <p className="mt-1 text-sm text-stone/90">
                        Last updated: {lastUpdatedLabel}
                    </p>

                    <div className="rename-wrap mt-2">
                        <form className="flex flex-col gap-2 sm:flex-row sm:items-center" onSubmit={handleRenameSubmit}>
                            <input
                                className="inline-input"
                                value={renameValue}
                                onChange={(event) => setRenameValue(event.target.value)}
                                aria-label="Rename project"
                                disabled={isRenaming}
                            />
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="px-3 py-2 rounded-lg bg-ink text-white text-sm disabled:opacity-60 disabled:pointer-events-none"
                                    disabled={isRenaming}
                                >
                                    Save
                                </button>
                                <button
                                    type="button"
                                    className="px-3 py-2 rounded-lg border border-stone/30 bg-white text-sm disabled:opacity-60 disabled:pointer-events-none"
                                    onClick={handleRenameCancel}
                                    disabled={isRenaming}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="row-actions gap-2 sm:gap-3" data-menu-root>
                    <div className="action-rail" data-open={menuStateAttr}>
                        <button
                            type="button"
                            className="action-chip action-chip--rename"
                            onClick={handleRenameOpen}
                            ref={firstActionRef}
                            disabled={isRenaming || isDeleting}
                        >
                            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path d="M4 13.5V16h2.5L15.81 6.69l-2.5-2.5L4 13.5zm12.71-7.21a1 1 0 000-1.41l-1.59-1.59a1 1 0 00-1.41 0l-1.29 1.29 2.5 2.5 1.29-1.29z" />
                            </svg>
                            <span className="hidden sm:inline">Rename</span>
                        </button>
                        <button
                            type="button"
                            className="action-chip action-chip--delete"
                            onClick={handleDeleteClick}
                            disabled={isDeleting}
                        >
                            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path d="M6 7h8l-.8 9.2a2 2 0 01-2 1.8H8.8a2 2 0 01-2-1.8L6 7zm7-3l-1-1H8L7 4H4v2h12V4h-3z" />
                            </svg>
                            <span className="hidden sm:inline">Delete</span>
                        </button>
                    </div>
                    <div className="row-actions__cta">
                        <Link
                            to={blueprintHref}
                            className="open-btn"
                            onMouseEnter={onPrefetch}
                        >
                            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path
                                    fillRule="evenodd"
                                    d="M3 10a.75.75 0 01.75-.75h10.64L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.16-3.96H3.75A.75.75 0 013 10z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <span className="hidden sm:inline">Open Blueprint</span>
                            <span className="sm:hidden">Open</span>
                        </Link>
                    </div>
                    <button
                        type="button"
                        className="kebab"
                        aria-haspopup="menu"
                        aria-expanded={isMenuOpen}
                        data-open={menuStateAttr}
                        onClick={(event) => {
                            event.stopPropagation();
                            onToggleMenu();
                        }}
                    >
                        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <circle cx="10" cy="3.5" r="1.5" />
                            <circle cx="10" cy="10" r="1.5" />
                            <circle cx="10" cy="16.5" r="1.5" />
                        </svg>
                    </button>
                </div>
            </div>
            <ConfirmModal
                open={showDeleteConfirm}
                title="Delete project?"
                description={`This will permanently remove "${displayName}". This action cannot be undone.`}
                confirmLabel="Delete project"
                onCancel={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                loading={isDeleting}
            />
        </li>
    );
}
