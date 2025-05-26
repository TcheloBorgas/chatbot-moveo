import { google } from 'googleapis';

const MOVEO_SECRET_TOKEN = process.env.MOVEO_SECRET_TOKEN;
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
const SHEET_RANGE = 'A2:D1000';

export default async function handler(req, res) {
  console.log('[user-data] ========= NOVA REQUISIÇÃO =========');
  console.log('[user-data] Headers recebidos:', JSON.stringify(req.headers, null, 2));
  console.log('[user-data] Body recebido:', JSON.stringify(req.body, null, 2));

  try {
    const tokenRecebido = req.headers['x-moveo-token'];
    console.log('[user-data] Token recebido:', tokenRecebido);

    if (!tokenRecebido || tokenRecebido !== MOVEO_SECRET_TOKEN) {
      console.warn('[user-data] Token inválido');
      return res.status(401).json({ error: 'Token inválido' });
    }

    if (req.method !== 'POST') {
      console.warn('[user-data] Método não permitido:', req.method);
      return res.status(405).json({ error: 'Método não permitido' });
    }

    const { input } = req.body || {};
    const phone = input?.text || null;

    console.log('[user-data] Telefone extraído:', phone);

    if (!phone) {
      console.warn('[user-data] Nenhum telefone fornecido');
      return res.status(400).json({
        responses: [
          {
            type: 'text',
            texts: ['Nenhum telefone fornecido.']
          }
        ]
      });
    }

    console.log('[user-data] Iniciando autenticação JWT com GOOGLE_CLIENT_EMAIL...');
    const auth = new google.auth.JWT(
      process.env.GOOGLE_CLIENT_EMAIL,
      null,
      process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/spreadsheets.readonly']
    );

    const sheets = google.sheets({ version: 'v4', auth });
    console.log('[user-data] Aguardando resposta do Google Sheets...');

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: SHEET_RANGE,
    });

    const rows = response.data.values || [];
    console.log(`[user-data] ${rows.length} linhas recebidas da planilha`);

    const cleanPhone = phone.replace(/\D/g, '');
    console.log('[user-data] Telefone normalizado para busca:', cleanPhone);

    const userRow = rows.find(row => row[0]?.replace(/\D/g, '') === cleanPhone);

    if (!userRow) {
      console.warn('[user-data] Telefone não encontrado na planilha');
      return res.status(200).json({
        responses: [
          {
            type: 'text',
            texts: ['Telefone não encontrado na base de dados.']
          }
        ]
      });
    }

    const [telefone, nome, email, info] = userRow;
    const conteudo = `Nome: ${nome}\nTelefone: ${telefone}\nEmail: ${email}\nInfo: ${info}`;

    console.log('[user-data] Dados encontrados e formatados:');
    console.log(conteudo);

    return res.status(200).json({
      responses: [
        {
          type: 'text',
          texts: [conteudo]
        }
      ],
      context: {
        nome,
        telefone,
        email,
        info
      }
    });

  } catch (error) {
    console.error('[user-data] ERRO ao processar webhook:');
    console.error(error.message || error);
    if (error.response?.data) console.error('[user-data] Erro da API Google:', error.response.data);
    return res.status(500).json({
      responses: [
        {
          type: 'text',
          texts: ['Erro ao acessar os dados do usuário. Tente novamente mais tarde.']
        }
      ]
    });
  }
}
