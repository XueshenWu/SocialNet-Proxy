import express from 'express';
import { AbstractServerScheduler } from '../services/scheduler.service';
import { PROXY_CONFIG } from '../config';
import { schedulerFactory } from '../services/scheduler.service';
import {relay_json} from '../services/proxytunnel.service';
import authGate from '../services/authgate.middleware';

const proxyRouter = express.Router();

// proxyRouter.use(authGate);

const proxyRoutes = new Map<string, AbstractServerScheduler>();

PROXY_CONFIG.forEach((config) => {
    const shceduler: AbstractServerScheduler = schedulerFactory(config);

    proxyRoutes.set(config.service, shceduler);
})


proxyRouter.all('*', express.json(),async (req, res) => {

   

    const service = req.path.split('/')[1];
    const scheduler = proxyRoutes.get(service);
    if (scheduler) {
        const { server, profile } = scheduler.next();
        if (server) {
            const target = `${server}/${req.path.split('/').slice(2).join('/')}`;
            const method = req.method;

            const start = Date.now();

            if (method === "OPTION") {
                res.status(404).end();

            } else {
                try{
                    await relay_json(req, res, target, method as "GET" | "POST" | "PUT" | "DELETE");
                }catch(e){
                    
                    res.status(502).end()
                }
                
            }


            const end = Date.now();
            const time_ms = end - start;
            console.log(`Request to ${target} took ${time_ms}ms`)
           
            profile(time_ms);

        }
    }
});


export { proxyRouter };