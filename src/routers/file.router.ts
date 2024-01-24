import express from 'express';
import { FILE_CONFIG } from '../config';
import authGate from '../services/authgate.middleware';
import {relay_stream} from '../services/proxytunnel.service';

const fileRouter = express.Router();

// fileRouter.use(authGate);

fileRouter.all('/:bucket/:key', express.raw({
    type: () => true,
    limit: '10mb'

}),(req, res) => {

    const target = `${FILE_CONFIG.path}/${req.params.bucket}/${req.params.key}`
    const method = req.method
    
    if (method === "OPTION") {
        res.status(404).end();
        return;
    }
    try{
        relay_stream(req, res, target, method as "GET" | "POST" | "PUT" | "DELETE");
    }catch(e){
        res.status(502).end()
    }
    
})


// fileRouter.post('/:bucket/:key', (req, res) => {
//     const target = `${FILE_CONFIG.path}/${req.params.bucket}/${req.params.key}`
//     relay(req, res, target, "POST");
// })


// fileRouter.delete('/:bucket/:key', (req, res) => {
//     const target = `${FILE_CONFIG.path}/${req.params.bucket}/${req.params.key}`
//     relay(req, res, target, "DELETE");
// })

// fileRouter.put('/:bucket/:key', (req, res) => {
//     const target = `${FILE_CONFIG.path}/${req.params.bucket}/${req.params.key}`
//     relay(req, res, target, "PUT");
// })


export { fileRouter };

