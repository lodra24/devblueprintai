#!/bin/sh
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan migrate --force

USER_COUNT=$(php artisan tinker --execute="echo \App\Models\User::count();")
if [ "$USER_COUNT" -eq "0" ]; then
    echo "Veritabanı boş, demo verileri yükleniyor..."
    php artisan db:seed --force
fi

/usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
