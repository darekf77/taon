# how to start

docker build -t my-mariadb .
docker run -p 3306:3306 -p 3000:3000 --name mariadb-health my-mariadb
