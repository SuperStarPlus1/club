import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const {
    first_name,
    last_name,
    city,
    birthdate,
    phone,
    id_number,
    email,
    agree
  } = req.body;

  if (!agree) {
    return res.status(400).json({ error: 'יש לאשר את ההצהרה כדי להצטרף' });
  }

  const { data, error } = await supabase.from('members').insert([
    {
      first_name,
      last_name,
      city,
      birthdate,
      phone,
      id_number,
      email
    }
  ]);

  if (error) {
    console.error('DB Insert Error:', error);
    return res.status(500).json({ error: 'שגיאה בשמירת הנתונים' });
  }

  res.status(200).json({ success: true });
}
