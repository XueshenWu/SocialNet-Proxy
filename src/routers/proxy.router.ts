import express from 'express';
import { AbstractServerScheduler } from '../services/scheduler.service';
import { PROXY_CONFIG } from '../config';
import { schedulerFactory } from '../services/scheduler.service';
import {relay_json} from '../services/proxytunnel.service';

const proxyRouter = express.Router();

const proxyRoutes = new Map<string, AbstractServerScheduler>();

PROXY_CONFIG.forEach((config) => {
    const shceduler: AbstractServerScheduler = schedulerFactory(config);

    proxyRoutes.set(config.service, shceduler);
})


proxyRouter.all('*', express.json(),(req, res) => {

    console.log(`@router: request body: ${JSON.stringify(req.body)}`)

    const service = req.path.split('/')[1];
    const scheduler = proxyRoutes.get(service);
    if (scheduler) {
        const { server, profile } = scheduler.next();
        if (server) {
            const target = `${server}/${req.path.split('/').slice(2).join('/')}`;
            const method = req.method;

            const start = process.hrtime();

            if (method === "OPTION") {
                res.status(404).end();

            } else {
                try{
                    relay_json(req, res, target, method as "GET" | "POST" | "PUT" | "DELETE");
                }catch(e){
                    
                    res.status(502).end()
                }
                
            }


            const end = process.hrtime(start);
            profile(end[0])

        }
    }
});


export { proxyRouter };