import axios from 'axios';

const MOVEO_SECRET_TOKEN = process.env.MOVEO_SECRET_TOKEN;
const MOVEO_API_KEY = process.env.MOVE_API_KEY;

export default async function handler(req, res) {
  try {
    const tokenRecebido = req.headers['x-moveo-token'];
    if (!tokenRecebido || tokenRecebido !== MOVEO_SECRET_TOKEN) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Método não permitido' });
    }

    const { session_id } = req.body || {};
    if (!session_id) {
      return res.status(400).json({
        responses: [
          {
            type: 'text',
            texts: ['ID da sessão ausente.']
          }
        ]
      });
    }

    const accountId = req.headers['x-moveo-account-id'];
    const url = `https://api.moveo.ai/v1/accounts/${accountId}/analytics/sessions/${session_id}/content`;

    const analytics = await axios.get(url, {
      headers: { 'x-api-key': MOVEO_API_KEY },
    });

    const conversa = analytics.data || 'Sem conteúdo';

    return res.status(200).json({
      responses: [
        {
          type: 'text',
          texts: [`Conversa para edição:\n${JSON.stringify(conversa)}`]
        }
      ],
      context: {
        ultima_sessao_id: session_id
      }
    });

  } catch (error) {
    console.error('[edit-data] Erro:', error);
    return res.status(500).json({
      responses: [
        {
          type: 'text',
          texts: ['Erro ao processar a edição.']
        }
      ]
    });
  }
}
