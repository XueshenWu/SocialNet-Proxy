import express from 'express';


const proxyRouter = express.Router();

proxyRouter.all('*', (req, res) => {
    const target = req.headers.host as string;
    
});


export {proxyRouter};