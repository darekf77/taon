# Use official Nginx image
FROM nginx:alpine

# Set working directory
WORKDIR /usr/share/nginx/html

# Remove default nginx index page
RUN rm -rf ./*

# Copy your built frontend files into the container
COPY . /usr/share/nginx/html

# Optional: copy custom nginx config
# COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
