const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Diretório onde os arquivos serão salvos (uploads)
const UPLOAD_DIR = path.join(__dirname, 'uploads');

// MIDDLEWARE: Permite comunicação entre front e back-end
app.use(cors());

// MIDDLEWARE: Serve arquivos estáticos da pasta 'public' (seu HTML/CSS/JS)
// Isso permite acessar http://localhost:3000/index.html
app.use(express.static(path.join(__dirname, 'public'))); 

// Configuração do Multer para salvar os arquivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Verifica e cria a pasta 'uploads' se ela não existir
        if (!fs.existsSync(UPLOAD_DIR)) {
            fs.mkdirSync(UPLOAD_DIR);
        }
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        // Renomeia o arquivo para evitar conflitos (ex: "photos-1748293849.jpg")
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname).toLowerCase());
    }
});

const upload = multer({ storage: storage });

// ROTA 1: POST /upload - Recebe e salva os arquivos dos convidados
app.post('/upload', upload.array('photos', 20), (req, res) => {
    // 'photos' deve corresponder ao atributo 'name' no input do seu HTML
    console.log(`Recebidos ${req.files.length} arquivos.`);
    res.json({ message: 'Uploads concluídos com sucesso!', count: req.files.length });
});

// ROTA 2: GET /api/galeria - Lista os arquivos salvos
app.get('/api/galeria', (req, res) => {
    fs.readdir(UPLOAD_DIR, (err, files) => {
        if (err) {
            // Retorna um array vazio em vez de erro 500 se a pasta não for encontrada
            if (err.code === 'ENOENT') {
                 return res.json([]);
            }
            console.error('Erro ao ler pasta de uploads:', err);
            return res.status(500).json({ error: 'Falha ao carregar a galeria.' });
        }

        // Filtra e lista apenas mídias e reverte a ordem (mais novos primeiro)
        const mediaFiles = files
            .filter(file => /\.(jpe?g|png|gif|mp4|mov|webp)$/i.test(file))
            .reverse(); 

        res.json(mediaFiles);
    });
});

// ROTA para servir os arquivos estáticos da pasta de uploads (para o navegador ver as fotos)
app.use('/uploads', express.static(UPLOAD_DIR));

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});