'use strict';

class RequestInterface {
    #baseUrl = 'http://cz.gdou.edu.cn/APIXCX/app/xcx/';

    send({ timeout, retries } = { timeout: 5000, retries: 3 }) {
        return new Promise((resolve, reject) => {
            const callback = async (attempt = 1) => {
                try {
                    const res = await fetch(this.url, {
                        ...this.reqParams,
                        signal: AbortSignal.timeout(timeout),
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data.msg === 'success') {
                            resolve(data);
                        } else {
                            throw new Error(data);
                        }
                    } else {
                        throw new Error(res.statusText);
                    }
                } catch (err) {
                    if (attempt < retries) {
                        console.log(`Retrying... (${attempt + 1}/${retries})`);
                        callback(attempt + 1);
                    } else {
                        reject(err);
                    }
                }
            }
            callback();
        })
    }

    queryString(params) {
        return Object.entries(params).map(([key, value]) => `${key}=${value}`).join('&')
    }

    async getHex(str) {
        const paramsUint8 = new TextEncoder().encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', paramsUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    digestUrl(path, params = {}) {
        return `${this.#baseUrl + path}/?${this.queryString(params)}`
    }
}

class Login extends RequestInterface {
    constructor({ user, key }) {
        super();
        this.user = user;
        this.key = key;
    }

    url = this.digestUrl('login');

    static #loginSession = {};

    static get tokenCache() {
        return this.#loginSession.token;
    }

    static clearLoginSession() {
        this.#loginSession = {};
    }

    async getLoginParams() {
        const params = {
            userName: this.user,
            time: Math.floor(Date.now() / 1e3),
            num: Math.floor(9001 * Math.random() + 999),
            key: this.key,
        };
        params.sign = await this.getHex(this.queryString(params));
        delete params.key;
        return this.queryString(params);
    }

    async getToken({ cache } = { cache: true }) {
        this.reqParams = {
            method: 'POST',
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
            body: await this.getLoginParams(),
        }
        const login = await this.send();
        if (cache) {
            this.constructor.#loginSession = login;
        }
        return login.token;
    }
}

class StatusQuery extends RequestInterface {
    constructor({ token, buildingID }) {
        super();
        const params = {
            token: token ?? Login.tokenCache,
            buildingID: buildingID,
        }
        this.url = this.digestUrl('meterinfo/getMeterStatus1', params);
    }

    reqParams = {
        method: 'GET',
    }
}

export { Login, StatusQuery };