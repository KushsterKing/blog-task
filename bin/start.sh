set -e

docker build -t bts_crm .
docker run -p 3006:3006 -d bts_crm