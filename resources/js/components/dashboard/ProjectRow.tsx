import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import {
    ArrowRightIcon,
    EditIcon,
    KebabIcon,
    TrashIcon,
} from "@/components/icons";
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
                            <EditIcon />
                            <span className="hidden sm:inline">Rename</span>
                        </button>
                        <button
                            type="button"
                            className="action-chip action-chip--delete"
                            onClick={handleDeleteClick}
                            disabled={isDeleting}
                        >
                            <TrashIcon />
                            <span className="hidden sm:inline">Delete</span>
                        </button>
                    </div>
                    <div className="row-actions__cta">
                        <Link
                            to={blueprintHref}
                            className="open-btn"
                            onMouseEnter={onPrefetch}
                        >
                            <ArrowRightIcon />
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
                        <KebabIcon />
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
