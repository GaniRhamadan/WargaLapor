<?php

use Illuminate\Support\Facades\Route;

// Serve React SPA Frontend for all non-API web routes
Route::get('/{any?}', function () {
    $spaFile = public_path('index.html');
    if (file_exists($spaFile)) {
        return response()->file($spaFile);
    }
    return view('welcome');
})->where('any', '^(?!api|storage).*$');

