const express = require('express')
const bodyParser = require("body-parser")
const { randomBytes } = require('crypto')
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const commentsByPostId = {};

app.get('/posts/:id/comments', (req, res) => {
    res.send(commentsByPostId[req.params.id] || []);
})

app.post('/posts/:id/comments', async(req, res) => {
    const commentId = randomBytes(4).toString('hex'); // Je créer une string en hexadécimal de 4 bytes
    const { content } = req.body; // Je stock dans ma variable content le corps de la requête

    const comments = commentsByPostId[req.params.id] || []; // Dans ma variable commentsByPostId j'ajoute l'id de la route /posts/:id 

    comments.push({id: commentId, content, status: 'pending' }); // Dans l'objet commentsByPostId j'ajoute en Id hexadécimal et le contenu de ma requête
    commentsByPostId[req.params.id] = comments; // Dans le commentsByPostId avec le numéro de l'id j'ajoute le comments

    // Résultat : commentsByPostId{ 1: id: grgkegd7, 'Fist comment'; }

    await axios.post('http://localhost:4005/events', {
        type: 'CommentCreated',
        data: {
            id: commentId,
            content,
            postId: req.params.id,
            stats: 'pending'
        }
    })
    res.status(201).send(comments);
});

app.post('/events', async(req, res) => {
    console.log('Event received:', req.body.type);

    const { type, data } = req.body;

    if(type === ' CommentModerated'){
        const { postId, id, status, content } = data;
        const comments = commentsByPostId[postId];

        const comment = comments.find(comment => {
            return comment.id === id;
        })

        comment.status = status;

        await axios.post('http://localhost:4005/events', {
            type: 'CommentUpdated',
            data: {
                id,
                status,
                postId,
                content
            }

        });

    }

    res.send({});
})

app.listen(4001, () => {
    console.log('Listening on 4001');
})