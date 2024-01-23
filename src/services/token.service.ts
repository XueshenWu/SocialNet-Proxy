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


function refresh_token(payload: TokenPayload): string {
    return jwt.sign(payload, TOKEN_CONFIG.refresh.SECRET, { expiresIn: TOKEN_CONFIG.refresh.expire_seconds });
}

function verify_refresh_tokens(tokens: { auth: string, refresh: string }): { auth: string, refresh: string } | undefined {
    try {
        const res = jwt.verify(tokens.auth, TOKEN_CONFIG.refresh.SECRET) as TokenPayload;

        if (res.kind !== "AUTH") {
            return undefined;
        }

        const res2 = jwt.verify(tokens.refresh, TOKEN_CONFIG.refresh.SECRET) as TokenPayload;
        if (res2.kind !== "REFRESH") {
            return undefined;
        }

        if (res.userid !== res2.userid) {
            return undefined;
        }

        return {
            auth: refresh_token({ userid: res.userid, kind: "AUTH" }),
            refresh: refresh_token({ userid: res.userid, kind: "REFRESH" })
        }



    } catch (e) {
        return undefined;
    }
}


export {
    gen_token,
    verify_token,
    refresh_token,
    verify_refresh_tokens
}