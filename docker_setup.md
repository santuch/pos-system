# 🐳 Docker Setup Guide for POS System

This guide will help you set up and run the POS System project using Docker and Docker Compose.

---

## 1. Clone the Repository
```sh
git clone <your-repo-url>
cd pos-system
```

## 2. Set Up Environment Variables
- Copy the example environment file:
  ```sh
  cp .env.docker.example .env.docker
  ```
- Edit `.env.docker` and fill in your Stripe keys and any other required secrets.

## 3. Build and Start the Services
```sh
docker-compose build
docker-compose up -d
```

## 4. Initialize the Database Schema
Import the schema into the running database container:
```sh
docker cp db/schema.sql pos-system-db-1:/schema.sql
docker exec -i pos-system-db-1 psql -U posuser -d posdb -f /schema.sql
```
> **Note:** If your container name is different, adjust the commands accordingly (use `docker ps` to check running containers).

## 5. Access the App
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Troubleshooting
- If you see errors about missing tables, make sure you have run the schema import step above.
- To stop and remove all containers, networks, and volumes:
  ```sh
  docker-compose down -v
  ```

---

## Notes
- Do **not** mount the project directory as a volume in Docker Compose (`volumes: - .:/app` is not used).
- Use the provided `.env.docker` file for environment variables.
- Rebuild with `docker-compose build` if you change dependencies or environment files.
