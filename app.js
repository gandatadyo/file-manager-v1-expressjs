const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();
const port = 2006;

app.use(bodyParser.json());
app.use(session({
    secret: 'your-secret-key', // Change this to a secure random key
    resave: false,
    saveUninitialized: true,
}));


// app.use(express.static('public')); // Menggunakan folder 'public' sebagai folder statis
app.use(express.static('uploads'));


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

const users = [
    { id: 1, username: 'ganda', password: 'ganda' },
    { id: 1, username: 'root', password: 'superadmin' },
];

const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    } else {
        return res.status(401).json({ error: 'Unauthorized' });
    }
};

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Check if the provided credentials are valid
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        // Store user information in the session
        req.session.user = { id: user.id, username: user.username };

        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

app.post('/logout', isAuthenticated, (req, res) => {
    // Destroy the session on logout
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }

        res.clearCookie('connect.sid'); // Clear the session cookie
        res.json({ success: true });
    });
});
app.get('/', (req, res) => {
    if(req.session.user ){
        res.sendFile(__dirname + '/public/index.html')
    }else{
        res.sendFile(__dirname + '/public/login.html')
    }
    
});


app.get('/readfile/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            res.status(500).json({ error: 'Gagal membaca file.' });
        } else {
            res.json({ content: data });
        }
    });
});

app.get('/listfiles', (req, res) => {
    const uploadPath = path.join(__dirname, 'uploads');

    fs.readdir(uploadPath, (err, files) => {
        if (err) {
            res.status(500).json({ error: 'Gagal membaca daftar file.' });
        } else {
            res.json({ files: files });
        }
    });
});

app.post('/upload', upload.single('file'), (req, res) => {
    if (req.file) {
        res.send(`File "${req.file.originalname}" berhasil diunggah.`);
    } else {
        res.send('Gagal mengunggah file.');
    }
});

app.delete('/deletefile/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);

    fs.unlink(filePath, (err) => {
        if (err) {
            res.status(500).json({ error: 'Gagal menghapus file.' });
        } else {
            res.json({ message: 'File berhasil dihapus.' });
        }
    });
});

app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});
