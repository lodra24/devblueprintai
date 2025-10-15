/**
 * React Query sorgu anahtarlarını merkezi olarak yönetmek için bir "fabrika".
 * Bu yaklaşım, anahtar string'lerini elle yazmaktan kaynaklanan hataları önler
 * ve projede tutarlılık sağlar.
 *
 * Örnek Kullanım:
 * - Projeler listesi için: queryKeys.projects.all
 * - Tek bir proje için: queryKeys.projects.detail('uuid-123')
 * - Bir projeye ait epic'ler: queryKeys.epics.byProject('uuid-123')
 */
export const queryKeys = {
    // Genel proje sorguları
    projects: {
        all: ["projects"] as const,
        detail: (id: string) => ["projects", "detail", id] as const,
    },
    // Kullanıcının kendi projeleri için sorgular
    myProjects: () => ["projects", "mine"] as const,

    // Epic sorguları
    epics: {
        all: ["epics"] as const,
        byProject: (projectId: string) =>
            ["epics", "byProject", projectId] as const,
    },

    // User Story sorguları
    stories: {
        all: ["stories"] as const,
        byEpic: (epicId: string) => ["stories", "byEpic", epicId] as const,
    },
};

// qk (queryKeys'in kısaltması) olarak da export edelim, kullanım kolaylığı sağlar.
export const qk = queryKeys;
