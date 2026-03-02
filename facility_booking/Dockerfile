FROM php:8.2-apache

# Install system dependencies and PHP extensions for PostgreSQL
RUN apt-get update && apt-get install -y libpq-dev zip unzip \
    && docker-php-ext-install pdo pdo_pgsql

# Update Apache DocumentRoot to point to Laravel's public directory
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Enable Apache rewrite module for Laravel routing
RUN a2enmod rewrite

# Copy the application code
COPY . /var/www/html/

# Set appropriate permissions for Laravel storage and bootstrap cache
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache || true

# Change port if needed (Render maps PORT automatically, but default EXPOSE here)
EXPOSE 8080

# Start Apache
CMD ["apache2-foreground"]
