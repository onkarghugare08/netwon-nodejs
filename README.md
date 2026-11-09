# Newton Site

A simple Isaac Newton webpage served by a zero-dependency Node.js server.

## Run locally

Requires Node.js 20 or newer.

```sh
npm start
```

Open [http://localhost:3000](http://localhost:3000). Set the `PORT` environment
variable to use a different port.

## Run with Docker

```sh
docker build -t newton-site .
docker run --rm -p 3000:3000 newton-site
```
