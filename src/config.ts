
import type { ProxyConfig, TokenConfig, FileConfig, Config } from './types/config';

const TOKEN_CONFIG: TokenConfig = {
    auth: {
        SECRET: "auth_secret",
        expire_seconds: 60 * 30,
        location:"http://localhost:3004/auth",
       
    },
    refresh: {
        SECRET: "refresh_secret",
        expire_seconds: 60 * 60 * 24 * 3,
    },
    signup:{
        location: "http://localhost:3004/signup"
    }
}

const PROXY_CONFIG: ProxyConfig = [
    {
        service: "api",
        serviceProvider: [
            {
                location: "http://localhost:3001",
                weight: 1
            },{
                location: "http://localhost:3002",
                weight: 1
            },{
                location: "http://localhost:3003",
                weight: 1
            }
        ],
       
        scheduleStrategy: "MIN_ACC_RTT",
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