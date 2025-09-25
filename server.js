const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
// Carrega as variáveis do .env para o ambiente local
require('dotenv').config(); 

// 1. Configuração do Cloudinary
const cloudinary = require('cloudinary').v2;

// O Render usará essas variáveis de ambiente que definiremos depois
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true, // Garante que as URLs geradas sejam HTTPS
});

const app = express();
const port = 3000;

// Configuração do Multer para armazenar em MEMÓRIA (buffer)
// Isso evita usar o disco local (que não é persistente no Render Free)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// MIDDLEWARE: Permite comunicação entre front e back-end
app.use(cors());

// MIDDLEWARE: Serve arquivos estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, 'public'))); 

// ------------------------------------------------------------------
// ROTA 1: POST /upload - Recebe arquivos e envia para o Cloudinary
// ------------------------------------------------------------------
app.post('/upload', upload.array('photos', 20), async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    }

    const uploadPromises = req.files.map(file => {
        // Converte o buffer para base64, formato que o Cloudinary aceita
        const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        
        // Se for vídeo (mp4, mov), o Cloudinary precisa saber
        const resourceType = file.mimetype.startsWith('video') ? 'video' : 'image';

        return cloudinary.uploader.upload(base64, {
            resource_type: resourceType,
            folder: "galeria-casamento", // Nome da pasta na sua conta Cloudinary
            overwrite: false,
        });
    });

    try {
        const results = await Promise.all(uploadPromises);
        console.log(`Enviados ${results.length} arquivos para o Cloudinary.`);
        res.json({ message: 'Uploads concluídos com sucesso!', count: results.length });
    } catch (error) {
        console.error('Erro ao enviar para o Cloudinary:', error);
        res.status(500).json({ error: 'Falha ao salvar a mídia na nuvem.' });
    }
});

// ------------------------------------------------------------------
// ROTA 2: GET /api/galeria - Lista os arquivos do Cloudinary
// ------------------------------------------------------------------
app.get('/api/galeria', async (req, res) => {
    try {
        // Busca recursos (imagens e vídeos) de uma pasta específica
        const result = await cloudinary.search
            .expression('folder:galeria-casamento') 
            .max_results(500) // Limita a busca para evitar sobrecarga na API
            .execute();

        // Extrai apenas a URL segura para uso no front-end
        const urls = result.resources
            .map(resource => resource.secure_url)
            // Inverte a ordem para mostrar os mais novos primeiro
            .reverse(); 

        res.json(urls);

    } catch (error) {
        console.error('Erro ao buscar recursos do Cloudinary:', error);
        res.status(500).json({ error: 'Falha ao carregar a galeria da nuvem.' });
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});