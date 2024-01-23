import express from 'express';
import { FILE_CONFIG } from '../config';

const fileRouter = express.Router();

fileRouter.get('/:bucket/:key', (req, res) => {
    res.send('get file');
})


fileRouter.post('/:bucket/:key', (req, res) => {
    res.send('post file');
})


fileRouter.delete('/:bucket/:key', (req, res) => {
    res.send('delete file');
})

fileRouter.put('/:bucket/:key', (req, res) => {
    res.send('put file');
})


export {fileRouter};

