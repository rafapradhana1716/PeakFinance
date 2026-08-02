git pull --ff-only
npm ci
npm run build

set -a
source .env
set +a

shopt -s nullglob
for migration in migrations/*.sql; 
do
 echo "Applying: $migration"
 MYSQL_PWD="$DB_PASS" mariadb \
  --host="$DB_HOST" \
  --user="$DB_USER" \
  --database="$DB_NAME" \
  < "$migration"
done

NODE_ENV=production pm2 reload peak-finance --update-env