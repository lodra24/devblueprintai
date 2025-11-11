<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->seedDemoProject();
    }

    private function seedDemoProject(): void
    {
        $user = User::firstOrCreate([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ], [
            'password' => bcrypt('password'),
        ]);

        $project = $user->projects()->firstOrCreate([
            'name' => 'Marketing Launch Blueprint',
            'idea_text' => 'AI destekli kampanya planı ve varlık üretimi.',
            'status' => 'ready',
            'progress' => 100,
        ]);

        $epics = [
            [
                'title' => 'Funnel Awareness Assets',
                'position' => 100,
                'stories' => [
                    [
                        'priority' => 'high',
                        'content' => 'VarID=FF-01 | Hook:"Bu, limiti aşmayan bir kancadır." | GoogleH1:"Kısa Başlık" | GoogleDesc:"Ürünün en güçlü faydasını tek cümlede anlatır." | CTA:"Şimdi Başla"',
                    ],
                    [
                        'priority' => 'medium',
                        'content' => 'VarID=FF-02 | Hook:"Yeni kullanıcılar için benzersiz teklif." | GoogleH1:"Bu Google Başlığı 30 karakterden kesinlikle daha uzun olacak." | GoogleDesc:"Dönüşüm optimizasyonu için uzun açıklama." | CTA<=12:"Acil Katıl"',
                    ],
                    [
                        'priority' => 'low',
                        'content' => 'VarID=FF-03 | Hook:"Güvenilir referanslar ile ikna et." | GoogleH1:"Kanıt odaklı kısa başlık" | Proof:"Gerçek kullanıcı deneyimi ile destekle." | Objection:"Fiyat endişesine çözüm sun."',
                    ],
                ],
            ],
            [
                'title' => 'Evaluation Stage Assets',
                'position' => 200,
                'stories' => [
                    [
                        'priority' => 'high',
                        'content' => 'VarID=EV-01 | Hook:"Değer önerisini ilk saniyede ver." | MetaPrimary:"Sosyal kanıt ile dönüşümü hızlandır." | EmailSubject:"Bu fırsatı kaçırma!" | CTA:"Hemen İncele"',
                    ],
                    [
                        'priority' => 'medium',
                        'content' => 'VarID=EV-02 | Hook:"Kısa vadede getiriyi anlat." | GoogleH1:"Verimliliği arttıran çözüm" | GoogleDesc:"Kullanıcıya yönelik ayrıntılı değer önerisi." | CTA<=8:"Deneme"',
                    ],
                    [
                        'priority' => 'medium',
                        'content' => 'VarID=EV-03 | Hook:"Sık sorulan sorulara cevap ver." | Proof:"Uzun süreli müşteri memnuniyetini anlat." | Objection:"Uygulama süresinin kısa olduğunu belirt."',
                    ],
                ],
            ],
            [
                'title' => 'Conversion Catalyst Assets',
                'position' => 300,
                'stories' => [
                    [
                        'priority' => 'high',
                        'content' => 'VarID=CV-01 | Hook:"Sınırlı sayıda kontenjan vurgusu." | GoogleH1:"Bugün kaydol ve kazanmaya başla" | GoogleDesc:"Sadece bu hafta geçerli olan özel teklif." | CTA:"Teklifimi Al"',
                    ],
                    [
                        'priority' => 'high',
                        'content' => 'VarID=CV-02 | Hook:"Zaman tasarrufu sağlayan çözüm." | LP_H1:"Operasyon maliyetini %35 düşüren platform" | GoogleDesc:"SaaS çözümü ile ekip verimliliğini artır." | CTA<=6:"Başla"',
                    ],
                    [
                        'priority' => 'low',
                        'content' => 'VarID=CV-03 | Hook:"Gelişmiş raporlama ile karar ver." | GoogleH1:"Veriye dayalı kararları güçlendir" | GoogleDesc:"Analitik paneller ile anlık içgörü kazan." | CTA:"Demo Talep Et"',
                    ],
                ],
            ],
        ];

        foreach ($epics as $storyIndexOffset => $epicData) {
            $epic = $project->epics()->updateOrCreate(
                ['title' => $epicData['title']],
                [
                    'position' => $epicData['position'],
                    'is_ai_generated' => true,
                ]
            );

            foreach ($epicData['stories'] as $storyIndex => $storyData) {
                $epic->userStories()->updateOrCreate(
                    ['content' => $storyData['content']],
                    [
                        'priority' => $storyData['priority'],
                        'position' => ($storyIndex + 1) * 100,
                        'is_ai_generated' => true,
                    ]
                );
            }
        }
    }
}
