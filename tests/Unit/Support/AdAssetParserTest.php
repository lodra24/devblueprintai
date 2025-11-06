<?php

namespace Tests\Unit\Support;

use App\Support\AdAssetParser;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class AdAssetParserTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Config::set('blueprint.ad_limits', [
            'hook' => 60,
            'google_h1' => 30,
            'google_desc' => 90,
            'meta_primary' => 125,
            'lp_h1' => 60,
            'email_subject' => 60,
            'cta' => 45,
        ]);
    }

    public function test_it_parses_basic_assets(): void
    {
        $parser = new AdAssetParser();

        $result = $parser->parse('Hook:"Merhaba!" | CTA:"Tıkla"');

        $this->assertSame('Merhaba!', $result['assets']['hook']);
        $this->assertSame('Tıkla', $result['assets']['cta']);
        $this->assertSame(8, $result['char_counts']['hook']);
        $this->assertSame(5, $result['char_counts']['cta']);
        $this->assertSame([], $result['over_limit_fields']);
        $this->assertSame(0, $result['over_limit_count']);
    }

    public function test_it_parses_full_payload_into_buckets(): void
    {
        $parser = new AdAssetParser();

        $content = implode(' | ', [
            'VarID=FF-01',
            'AngleName="Yenilikçi yaklaşım"',
            'Hook:"Yeni ürünü deneyin!"',
            'GoogleH1<=25:"Kısa başlık"',
            'GoogleDesc:"Detaylı açıklama"',
            'LPH1:"Sayfa başlığı"',
            'EmailSubject:"Kampanyayı kaçırma"',
            'Proof:"Gerçek kullanıcı yorumları"',
            'Objection:"Fiyat yüksek mi?"',
        ]);

        $result = $parser->parse($content);

        $this->assertSame('FF-01', $result['meta']['var_id']);
        $this->assertSame('Yenilikçi yaklaşım', $result['meta']['angle_name']);
        $this->assertSame('Yeni ürünü deneyin!', $result['assets']['hook']);
        $this->assertSame('Kısa başlık', $result['assets']['google_h1']);
        $this->assertSame('Detaylı açıklama', $result['assets']['google_desc']);
        $this->assertSame('Sayfa başlığı', $result['assets']['lp_h1']);
        $this->assertSame('Kampanyayı kaçırma', $result['assets']['email_subject']);
        $this->assertSame('Gerçek kullanıcı yorumları', $result['reasoning']['proof']);
        $this->assertSame('Fiyat yüksek mi?', $result['reasoning']['objection']);
    }

    public function test_it_honors_dynamic_limits(): void
    {
        $parser = new AdAssetParser();

        $result = $parser->parse('GoogleH1<=25:"Kısa başlık"');

        $this->assertSame(25, $result['limits']['google_h1']);
        $this->assertSame('Kısa başlık', $result['assets']['google_h1']);
        $this->assertSame(11, $result['char_counts']['google_h1']);
    }

    public function test_it_detects_over_limit_fields_with_utf8(): void
    {
        $parser = new AdAssetParser();

        $content = 'Hook:"🚀 Şimdi başla!" | GoogleDesc:"Uzun açıklama içerik örneği" | CTA<=5:"Şimdi Katıl"';

        $result = $parser->parse($content);

        $this->assertSame(14, $result['char_counts']['hook']); // emoji + spaces + letters
        $this->assertSame(27, $result['char_counts']['google_desc']);
        $this->assertSame('Şimdi Katıl', $result['assets']['cta']);
        $this->assertSame(11, $result['char_counts']['cta']);
        $this->assertContains('cta', $result['over_limit_fields']);
        $this->assertSame(1, $result['over_limit_count']);
    }

    public function test_it_strips_various_quotes(): void
    {
        $parser = new AdAssetParser();

        $content = "Hook=\"Çift tırnak\" | EmailSubject='Tek tırnak' | MetaPrimary=\"Escape \\\"kontrol\\\"\"";

        $result = $parser->parse($content);

        $this->assertSame('Çift tırnak', $result['assets']['hook']);
        $this->assertSame('Tek tırnak', $result['assets']['email_subject']);
        $this->assertSame('Escape "kontrol"', $result['assets']['meta_primary']);
    }

    public function test_it_handles_missing_fields(): void
    {
        $parser = new AdAssetParser();

        $result = $parser->parse('VarID=FF-01');

        $this->assertSame('FF-01', $result['meta']['var_id']);
        $this->assertArrayNotHasKey('hook', $result['assets']);
        $this->assertArrayHasKey('var_id', $result['meta']);
    }

    public function test_it_returns_empty_structure_for_blank_content(): void
    {
        $parser = new AdAssetParser();

        $result = $parser->parse(null);

        $this->assertSame([
            'meta' => [],
            'assets' => [],
            'reasoning' => [],
            'limits' => Config::get('blueprint.ad_limits'),
            'char_counts' => [],
            'over_limit_fields' => [],
            'over_limit_count' => 0,
        ], $result);
    }

    public function test_it_uses_angle_fallback_when_missing(): void
    {
        $parser = new AdAssetParser();

        $result = $parser->parse('Hook:"Merhaba"', 'Epicten Gelen Açı');

        $this->assertSame('Epicten Gelen Açı', $result['meta']['angle_name']);
    }

    public function test_it_keeps_existing_angle_when_present(): void
    {
        $parser = new AdAssetParser();

        $content = 'AngleName="İçerikten Gelen" | Hook:"Metin"';

        $result = $parser->parse($content, 'Epic Fallback');

        $this->assertSame('İçerikten Gelen', $result['meta']['angle_name']);
    }
}
