To run:

```
docker run -it -d -p 127.0.0.1:3000:3000 -v /Users/lee/apps/bull-jungle-orders-bot/data/orders.db:/usr/src/app/data/orders.db --restart unless-stopped --name bull-jungle-orders leesalminen/test-bull-jungle
```