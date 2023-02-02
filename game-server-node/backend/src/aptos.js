import cors from 'cors';
import express from 'express';
import Session from 'express-session';
import ErrorTypes from 'siwe';
import * as ed from '@noble/ed25519';

const app = express();
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:8088',
    credentials: true,
}))

app.use(Session({
    name: 'siwa-demo',
    secret: "siwa-demo-secret",
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false, sameSite: true }
}));

app.get('/nonce', async function (req, res) {
    req.session.nonce = generateNonce(16);
    console.log(req.session.nonce);
    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send(req.session.nonce);
});

app.post('/verify', async function (req, res) {
    try {
        console.log("verify start", req.body);  


        if (!req.body.message) {
            res.status(422).json({ message: 'Expected prepareMessage object as body.' });
            console.log("verify bad");    

            return;
        }
        console.log("verify", req.body.message);    

        let message = req.body.message;
        let messageJson = JSON.parse(message)
        console.log(message);
        const isValid = await validate(message, req.body.signature, req.body.pubkey);
        console.log("isValid", isValid, messageJson.nonce, req.session.nonce);
        if (!isValid){
             res.status(400).json({
                message: `Message Corrupted.`,
            });
            return;
        }

        
        if (messageJson.nonce !== req.session.nonce) {
            console.log(req.session);
            res.status(422).json({
                message: `Invalid nonce.`,
            });
            return;
        }
        
        req.session.siwa = messageJson;
       // req.session.cookie.expires = new Date(fields.expirationTime);
        req.session.save(() => res.status(200).end());
    } catch (e) {
        req.session.siwa = null;
        req.session.nonce = null;
        console.error(e);
        switch (e) {
            case ErrorTypes.EXPIRED_MESSAGE: {
                req.session.save(() => res.status(440).json({ message: e.message }));
                break;
            }
            case ErrorTypes.INVALID_SIGNATURE: {
                req.session.save(() => res.status(422).json({ message: e.message }));
                break;
            }
            default: {
                req.session.save(() => res.status(500).json({ message: e.message }));
                break;
            }
        }
    }
});

app.get('/personal_information', function (req, res) {
    console.log("personal_information");
    if (!req.session.siwa) {
        res.status(401).json({ message: 'You have to first sign_in' });
        return;
    }
    console.log("User is authenticated!");
    res.setHeader('Content-Type', 'text/plain');
    res.send(`You are authenticated and your address is: ${req.session.siwa.address}`)
});

app.listen(3000);

async function validate(message, signature, pubkey){
    var messageBytes = Array.from(Buffer.from(message, 'utf8'));
    var msg = Uint8Array.from(message.split('').map(letter => letter.charCodeAt(0)));;
    var sigBytes = parseHex(signature);
    var pubkeyBytes = parseHex(pubkey);
    const isValid = await ed.verify(signature.replace('0x', ''), msg, pubkey.replace('0x', ''));

    return isValid;   
}

function parseHex(string) {
    // remove all non-hex characters, and then separate them into an array in groups of 2 characters
    var arr = string.replace(/[^0-9a-fA-F]/g, '').match(/[0-9a-fA-F]{2}/g);
  
    // mutate the array in-place with the correct decimal values
    for(var i = 0; i<arr.length; i++) {
      arr[i] = parseInt(arr[i], 16);
    }
  
    return arr;
  }

  

  function generateNonce(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}

