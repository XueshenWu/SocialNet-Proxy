import express from 'express';


const proxyRouter = express.Router();

proxyRouter.all('*', (req, res) => {
    res.send('proxy');
});


export {proxyRouter};