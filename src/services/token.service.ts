import { TOKEN_CONFIG } from "../config";
import * as jwt from 'jsonwebtoken';
import { TokenPayload } from "../types/token-payload";

function gen_token(payload: TokenPayload): string {
    return jwt.sign(payload, TOKEN_CONFIG.auth.SECRET, { expiresIn: TOKEN_CONFIG.auth.expire_seconds });
}


function verify_token(token: string): TokenPayload | undefined {
    try {
        return jwt.verify(token, TOKEN_CONFIG.auth.SECRET, {
            ignoreExpiration: false
        }) as TokenPayload;
    } catch (e) {
        return undefined;
    }
}


function refresh_one_token(payload: TokenPayload): string {
    return jwt.sign(payload, TOKEN_CONFIG.refresh.SECRET, { expiresIn: TOKEN_CONFIG.refresh.expire_seconds });
}


function refresh_tokens(tokens: { auth: string, refresh: string }): { auth: string, refresh: string } | undefined {
    try {
        const res = jwt.verify(tokens.auth, TOKEN_CONFIG.refresh.SECRET, {
            ignoreExpiration: true
        }) as TokenPayload;

        if (res.kind !== "AUTH") {
            return undefined;
        }

        const res2 = jwt.verify(tokens.refresh, TOKEN_CONFIG.refresh.SECRET) as TokenPayload;
        if (res2.kind !== "REFRESH") {
            return undefined;
        }

        if (res.email !== res2.email) {
            return undefined;
        }

        return {
            auth: refresh_one_token({ email: res.email, kind: "AUTH" }),
            refresh: refresh_one_token({ email: res.email, kind: "REFRESH" })
        }
    } catch (e) {
        return undefined;
    }
}

function verify_refresh_tokens(tokens:{auth: string, refresh: string }): { auth: string, refresh: string } | undefined {
    try {
        const res = verify_token(tokens.auth);
        if(!res){
            return undefined;
        }

        if (res.kind !== "AUTH") {
            return undefined;
        }
        
        const res2 = verify_token(tokens.refresh);
        if(!res2){
            return undefined;
        }

        if (res2.kind !== "REFRESH") {
            return undefined;
        }
       

        if (res.email !== res2.email) {
            return undefined;
        }


        return {
            auth: refresh_one_token({ email: res.email, kind: "AUTH" }),
            refresh: refresh_one_token({ email: res.email, kind: "REFRESH" })
        }



    } catch (e) {
        console.log(e)
        return undefined;
    }
}


export {
    gen_token,
    verify_token,
    refresh_one_token,
    refresh_tokens,
    verify_refresh_tokens
}



// const test = ()=>{
//     const auth = gen_token({email:"123", kind:"AUTH"});
//     const refresh = gen_token({email:"123", kind:"REFRESH"});
//     const res1 = verify_token(auth);
//     const res2 = verify_token(refresh);
//     console.log(res1, res2);
//     const res3 = verify_refresh_tokens(auth, refresh);
//     console.log(res3);
// }

// test();