To run:

```
docker build . -t bitcoin-jungle/bull-jungle-orders
```

then

```
docker run -it -d -p 127.0.0.1:3000:3000 --restart unless-stopped --name bull-jungle-orders bitcoin-jungle/bull-jungle-orders
```