import express from 'express';

import {verify_refresh_tokens} from './token.service';

export default function authGate(req: express.Request, resp: express.Response, next: express.NextFunction){
    const auth_token = req.headers['X-Auth-Token'] as string;
    const refresh_token = req.headers['X-Refresh-Token'] as string;
    if (auth_token && refresh_token){
        
        const tokens = verify_refresh_tokens({auth: auth_token, refresh: refresh_token});
        if(tokens){
            resp.setHeader('X-Auth-Token', tokens.auth);
            resp.setHeader('X-Refresh-Token', tokens.refresh);
            
            next();
        }else{
            resp.status(401).send('Invalid token');
        }
    }
    else{
        resp.status(401).send('No token');
    }

}