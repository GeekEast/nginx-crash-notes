const express = require('express');
const port = 9999;
const app = express();

app.get('/', (req, res) => {
  res.status(200).send(`${process.env.APPID}`);
});

app.listen(port, () => {
  console.log(`server starts at ${port}`);
});
