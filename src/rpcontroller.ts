import express from "express";
import {authRouter} from "./routers/auth.router";
import {fileRouter} from "./routers/file.router";
import {proxyRouter} from "./routers/proxy.router";

const app = express();

app.use('/auth', authRouter);
app.use('/file', fileRouter);
app.use('/proxy', proxyRouter);

app.listen(3701, () => {
    console.log('server started');
});

