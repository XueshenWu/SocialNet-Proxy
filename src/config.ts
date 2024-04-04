
import type { ProxyConfig, TokenConfig, FileConfig, Config } from './types/config';

const TOKEN_CONFIG: TokenConfig = {
    auth: {
        SECRET: "auth_secret",
        expire_seconds: 60 * 30,
        location:"http://127.0.0.1:8000/auth/login",
       
    },
    refresh: {
        SECRET: "refresh_secret",
        expire_seconds: 60 * 60 * 24 * 3,
    },
    signup:{
        location: "http://127.0.0.1:8000/auth/register"
    }
}

const PROXY_CONFIG: ProxyConfig = [
    {
        service: "api",
        serviceProvider: [
            {
                location: "http://127.0.0.1:8000",
                weight: 1
            }
        ],
       
        scheduleStrategy: "SINGLETON",
        timeout: 1000,
    }
]

const FILE_CONFIG: FileConfig = {
    path: "http://localhost:9876"
}

const CONFIG: Config = {
    proxy_c: PROXY_CONFIG,
    token_c: TOKEN_CONFIG,
    file_c: FILE_CONFIG
}


export default CONFIG;
export { TOKEN_CONFIG, PROXY_CONFIG, FILE_CONFIG };