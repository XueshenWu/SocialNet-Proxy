import express from "express";
import {authRouter} from "./routers/auth.router";
import {fileRouter} from "./routers/file.router";
import {proxyRouter} from "./routers/proxy.router";
import cors from 'cors'

const app = express();
const corsOptions = {
    origin: '*', // Allow only this domain
    methods: 'GET,POST', // Allow only these methods
    allowedHeaders: '*', // Allow only these headers
    credentials: true, // Allow cookies
  };

app.use(cors(corsOptions))
app.use('/auth', authRouter);


//TODO: make it a separate auth server
app.use('/file', fileRouter);
app.use('/api', proxyRouter);


app.listen(3701,"192.168.196.10", () => {
    console.log('server started');
});




// TODO: Handle with fetch fail