import express from 'express';


const authRouter = express.Router();


authRouter.post('/login', (req, res) => {
    res.send('login');
});

authRouter.post('/signup', (req, res) => {
    res.send('signup');
});

authRouter.post('/logout', (req, res) => {
    res.send('logout');
});

authRouter.post('refresh', (req, res) => {});


export {authRouter};