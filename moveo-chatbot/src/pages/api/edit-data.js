import { google } from 'googleapis';
import axios from 'axios';

const MOVEO_SECRET_TOKEN = process.env.MOVEO_SECRET_TOKEN;
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
const SHEET_RANGE = 'A2:D1000';

export default async function handler(req, res) {
  console.log('[edit-data] Headers:', req.headers);
  const tokenRecebido = req.headers['x-moveo-token'];
  console.log('[edit-data] Token recebido:', tokenRecebido);
  console.log('[edit-data] Token esperado:', MOVEO_SECRET_TOKEN);

  if (!tokenRecebido || tokenRecebido !== MOVEO_SECRET_TOKEN) {
    console.log('[edit-data] Token inválido');
    return res.status(401).json({ error: 'Token inválido' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { session_id } = req.body || {};
  if (!session_id) {
    console.log('[edit-data] session_id não fornecido');
    return res.status(400).json({ error: 'session_id não enviado.' });
  }

  try {
    // 1. Recuperar conteúdo da conversa pela API Moveo Analytics
    const analyticsApiKey = process.env.MOVEO_API_KEY;
    const accountId = req.headers['x-moveo-account-id'];

    if (!analyticsApiKey || !accountId) {
      console.log('[edit-data] API key ou accountId não disponíveis');
      return res.status(500).json({ error: 'Erro de configuração do servidor.' });
    }

    console.log('[edit-data] Recuperando conversa para session_id:', session_id);

    const url = `https://api.moveo.ai/v1/accounts/${accountId}/analytics/sessions/${session_id}/content`;
    const response = await axios.get(url, {
      headers: {
        'x-api-key': analyticsApiKey,
      },
    });

    const conversationContent = response.data || '';

    console.log('[edit-data] Conteúdo da conversa recuperado:', conversationContent);

    // 2. Enviar para IA da Moveo para entender o que editar
    // Exemplo de chamada, deve adaptar conforme API Moveo AI para edição
    // Aqui vamos supor que a IA recebe o conteúdo e responde um comando edit

    // (Aqui você pode criar a integração da sua IA para interpretar e decidir o que editar,
    // usando a API Moveo ou outra AI integrada.)

    // 3. Atualizar Google Sheets e/ou Google Calendar conforme comando

    // Para demonstração, vamos apenas responder com o conteúdo da conversa:
    return res.status(200).json({
      output: {
        live_instructions: `Conteúdo da conversa recebido para edição:\n${JSON.stringify(conversationContent)}`,
      },
    });
  } catch (error) {
    console.error('[edit-data] Erro ao processar edição:', error);
    return res.status(500).json({ error: 'Erro ao processar edição.' });
  }
}
