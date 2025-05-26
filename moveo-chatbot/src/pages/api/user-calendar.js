import { google } from 'googleapis';

const MOVEO_SECRET_TOKEN = process.env.MOVEO_SECRET_TOKEN;
const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;

export default async function handler(req, res) {
  try {
    const tokenRecebido = req.headers['x-moveo-token'];
    if (!tokenRecebido || tokenRecebido !== MOVEO_SECRET_TOKEN) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Método não permitido' });
    }

    const auth = new google.auth.JWT(
      process.env.GOOGLE_CLIENT_EMAIL,
      null,
      process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/calendar.readonly']
    );

    const calendar = google.calendar({ version: 'v3', auth });

    const response = await calendar.events.list({
      calendarId: GOOGLE_CALENDAR_ID,
      timeMin: new Date().toISOString(),
      maxResults: 5,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];

    if (events.length === 0) {
      return res.status(200).json({
        responses: [
          {
            type: 'text',
            texts: ['Nenhum compromisso encontrado.']
          }
        ]
      });
    }

    const conteudo = events.map(ev => {
      const start = ev.start.dateTime || ev.start.date;
      return `- **${ev.summary}** em ${start}`;
    }).join('\n');

    return res.status(200).json({
      responses: [
        {
          type: 'text',
          texts: [conteudo]
        }
      ]
    });

  } catch (error) {
    console.error('[user-calendar] Erro:', error);
    return res.status(500).json({
      responses: [
        {
          type: 'text',
          texts: ['Erro ao acessar a agenda.']
        }
      ]
    });
  }
}
