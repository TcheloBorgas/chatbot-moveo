import { google } from 'googleapis';

const MOVEO_SECRET_TOKEN = process.env.MOVEO_SECRET_TOKEN;

export default async function handler(req, res) {
  console.log('[user-calendar] Headers:', req.headers);
  const tokenRecebido = req.headers['x-moveo-token'];
  console.log('[user-calendar] Token recebido:', tokenRecebido);
  console.log('[user-calendar] Token esperado:', MOVEO_SECRET_TOKEN);

  if (!tokenRecebido || tokenRecebido !== MOVEO_SECRET_TOKEN) {
    console.log('[user-calendar] Token inválido');
    return res.status(401).json({ error: 'Token inválido' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { input } = req.body || {};
  const email = input?.text || null;

  if (!email) {
    console.log('[user-calendar] Email não fornecido no corpo da requisição');
    return res.status(400).json({ error: 'Email não enviado.' });
  }

  console.log(`[user-calendar] Buscando compromissos para email: ${email}`);

  try {
    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    const response = await calendar.events.list({
      calendarId: email,
      timeMin: (new Date()).toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];

    if (events.length === 0) {
      console.log('[user-calendar] Nenhum evento encontrado.');
      return res.status(200).json({
        output: {
          live_instructions: 'Nenhum compromisso encontrado para sua agenda.',
        },
      });
    }

    let mdTexto = 'Próximos compromissos:\n\n';
    events.forEach((event) => {
      const start = event.start.dateTime || event.start.date;
      mdTexto += `- **${event.summary}** em ${start}\n`;
    });

    console.log('[user-calendar] Eventos formatados:', mdTexto);

    return res.status(200).json({
      output: {
        live_instructions: mdTexto,
      },
    });
  } catch (error) {
    console.error('[user-calendar] Erro ao consultar agenda:', error);
    return res.status(500).json({ error: 'Erro ao consultar agenda.' });
  }
}
