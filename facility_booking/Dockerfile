FROM php:8.2-apache

# Install system dependencies, git, and PHP extensions for PostgreSQL
RUN apt-get update && apt-get install -y libpq-dev zip unzip git \
    && docker-php-ext-install pdo pdo_pgsql

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Update Apache DocumentRoot to point to Laravel's public directory
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Enable Apache rewrite module for Laravel routing
RUN a2enmod rewrite

# Copy the application code
COPY . /var/www/html/

# Install Laravel dependencies
RUN composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev

# Set appropriate permissions for Laravel storage and bootstrap cache
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache || true

# Change port if needed (Render maps PORT automatically, but default EXPOSE here)
EXPOSE 8080

# Start Apache (and run migrations/seeders first)
CMD php artisan migrate --force && php artisan db:seed --force && apache2-foreground
