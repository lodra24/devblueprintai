<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>DevBluePrint AI</title>

    <!-- Fonts: Sora + Inter -->
    <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">

    <!-- Vite ile CSS ve JS dosyalarını dahil et -->
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.tsx'])
</head>
<body class="antialiased bg-frost text-ink font-body">
    {{-- React uygulamasının bağlanacağı kök element --}}
    <div id="app"></div>
</body>
</html>
