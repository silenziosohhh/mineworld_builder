const express = require('express');
const path = require('path');
const app = express();

// Porta su cui girerà il server (default 3000, o quella passata da PM2/Env)
const PORT = process.env.PORT || 9054;

// Percorso della cartella di build.
// Vite usa solitamente 'dist'. Se usi Create React App cambia 'dist' in 'build'.
const BUILD_DIR = path.join(__dirname, 'dist');

// Serve i file statici (js, css, immagini, assets)
app.use(express.static(BUILD_DIR));

// Gestisce il routing lato client (React Router)
// Qualsiasi richiesta che non corrisponde a un file statico viene mandata a index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(BUILD_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server avviato: http://localhost:${PORT}`);
});