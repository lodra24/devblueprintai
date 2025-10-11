<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>DevBluePrint AI</title>

    <!-- Vite ile CSS ve JS dosyalarını dahil et -->
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.tsx'])
</head>
<body class="font-sans antialiased bg-gray-900">
    {{-- React uygulamasının bağlanacağı kök element --}}
    <div id="app"></div>
</body>
</html>