import express from 'express';
import { refresh_tokens, gen_token } from '../services/token.service';
import { TOKEN_CONFIG } from '../config';



const authRouter = express.Router();


authRouter.post('/login', express.json(), async (req, resp) => {
    const location = TOKEN_CONFIG.auth.location;
    const { email , password } = req.body;
    if(!email || !password){
        resp.status(400).json({ message: "Invalid Request" }).end();
        return;
    }

    try {
        const target_resp = await fetch(location, {
            method: "POST",
            body: JSON.stringify({ email, password }),
        });
        const status = target_resp.status;
        if (status >= 200 && status < 300) {
            const auth_token = gen_token({ email:email, kind: "AUTH" });
            const refresh_token = gen_token({ email:email, kind: "REFRESH" });
            resp.setHeader('X-Auth-Token', auth_token);
            resp.setHeader('X-Refresh-Token', refresh_token);
            resp.status(200).end();
        }
        else {
            resp.status(401).json({ message: "Invalid Credentials" }).end();
        }
    }
    catch (e) {
        resp.status(400).json({ message: "Invalid Request" }).end();
    }

});

authRouter.post('/signup', express.json(), async (req, resp) => {
    const location = TOKEN_CONFIG.signup.location;
    const { email, password } = req.body;
    if(!email || !password){
        resp.status(400).json({ message: "Invalid Request" }).end();
        return;
    }
    try {
        const target_resp = await fetch(location, {
            method: "POST",
            body: JSON.stringify({ email, password }),
        });
        const status = target_resp.status;
        if (status >= 200 && status < 300) {
            resp.status(201).end();
        }
        else {
            resp.status(400).end();
        }
    }
    catch (e) {
        resp.status(400).json({ message: "Invalid Request" });
    }
});





authRouter.post('/logout', (req, resp) => {
    resp.status(204).end();
});


authRouter.post('refresh', (req, resp) => {
    const refresh_token = req.headers['x-refresh-token'] as string;
    const auth_token = req.headers['x-auth-token'] as string;

    const res = refresh_tokens({ auth: auth_token, refresh: refresh_token });
    if (res) {
        const { auth, refresh } = res;
        resp.setHeader('X-Auth-Token', auth);
        resp.setHeader('X-Refresh-Token', refresh);
        resp.status(200).end();
    } else {
        resp.status(401).json({ message: "Invalid Token" });
    }

});


export { authRouter };