DEVELOPMENT_ENV_PATH=.env.development
DOCKER_COMPOSE_PATH=compose.dev.yaml

db-migrate:
	dotenv -e ${DEVELOPMENT_ENV_PATH} -- npx prisma migrate dev

db-reset:
	dotenv -e ${DEVELOPMENT_ENV_PATH} -- npx prisma migrate reset --skip-seed

db-seed:
	dotenv -e ${DEVELOPMENT_ENV_PATH} -- npx prisma db seed

db-generate:
	bunx prisma generate

db-deploy:
	bunx prisma migrate deploy

compose-up:
	docker compose -f ${DOCKER_COMPOSE_PATH} up -d

compose-down:
	docker compose -f ${DOCKER_COMPOSE_PATH} down

docker-build:
	docker build -t darellyuhu/web-controller-backend:latest .

docker-push:
	docker image push darellyuhu/web-controller-backend:latest

