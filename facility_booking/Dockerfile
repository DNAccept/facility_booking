FROM php:8.2-apache

# Copy your PHP code
COPY . /var/www/html/

# Enable Apache rewrite module if needed
RUN a2enmod rewrite

# Expose port
EXPOSE 8080

# Start Apache in foreground
CMD ["apache2-foreground"]
