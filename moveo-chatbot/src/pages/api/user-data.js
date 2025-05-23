import { google } from 'googleapis';

const MOVEO_SECRET_TOKEN = process.env.MOVEO_SECRET_TOKEN;
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
const SHEET_RANGE = 'A2:D1000'; // ajuste conforme planilha

export default async function handler(req, res) {
  console.log('[user-data] Headers:', req.headers);
  const tokenRecebido = req.headers['x-moveo-token'];
  console.log('[user-data] Token recebido:', tokenRecebido);
  console.log('[user-data] Token esperado:', MOVEO_SECRET_TOKEN);

  if (!tokenRecebido || tokenRecebido !== MOVEO_SECRET_TOKEN) {
    console.log('[user-data] Token inválido');
    return res.status(401).json({ error: 'Token inválido' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { input } = req.body || {};
  const phone = input?.text || null;

  if (!phone) {
    console.log('[user-data] Telefone não fornecido no corpo da requisição');
    return res.status(400).json({ error: 'Telefone não enviado.' });
  }

  console.log(`[user-data] Buscando dados para telefone: ${phone}`);

  try {
    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: SHEET_RANGE,
    });

    const rows = response.data.values || [];
    const userRow = rows.find(row => {
      const telefone = row[1] || '';
      // Remova caracteres para comparar só números
      const cleanTelefone = telefone.replace(/\D/g, '');
      const cleanPhone = phone.replace(/\D/g, '');
      return cleanTelefone === cleanPhone;
    });

    if (!userRow) {
      console.log(`[user-data] Nenhum usuário encontrado para telefone: ${phone}`);
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const [nome, telefone, email, info] = userRow;

    const conteudo = `Nome: ${nome}\nTelefone: ${telefone}\nEmail: ${email}\nInfo: ${info}`;

    console.log('[user-data] Dados encontrados:', conteudo);

    return res.status(200).json({
      output: {
        live_instructions: conteudo,
      },
    });
  } catch (error) {
    console.error('[user-data] Erro ao recuperar dados:', error);
    return res.status(500).json({ error: 'Erro ao recuperar dados.' });
  }
}
