# Chain-chomp

![Chomp](chomp.png)

Used under [CC License](https://creativecommons.org/licenses/by-nc-nd/3.0/) from [KarlWarrior47](https://www.deviantart.com/karlwarrior47/art/Just-a-chain-chomp-940153554).

Chain-chomp is an HTTP server for interacting with Spyre smart contracts.

## Getting Started

Run locally using either `docker-compose`:

```
docker-compose up --build
```

or `pnpm`:

```
pnpm install
pnpm run dev
```

or `docker`:

```
docker build -t chain-chomp .
docker run -p 10999:10999 chain-chomp
```

## API

Full API documentation, with examples, can be found [here](https://documenter.getpostman.com/view/30699952/2sA3JDiksB).
