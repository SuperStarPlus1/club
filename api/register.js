import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

function isValidIsraeliPhone(phone) {
  return /^05\d{8}$/.test(phone);
}

function isValidIsraeliID(id) {
  id = String(id).trim();
  if (!/^\d{5,9}$/.test(id)) return false;
  id = id.padStart(9, '0');
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let num = Number(id[i]) * ((i % 2) + 1);
    if (num > 9) num -= 9;
    sum += num;
  }
  return sum % 10 === 0;
}

function isOver18(birthdateStr) {
  const birthDate = new Date(birthdateStr);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  const d = today.getDate() - birthDate.getDate();
  return age > 18 || (age === 18 && (m > 0 || (m === 0 && d >= 0)));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ field: 'general', error: 'Method Not Allowed' });
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
    return res.status(400).json({ field: 'agree', error: 'יש לאשר את ההצהרה כדי להצטרף' });
  }

  if (!isValidIsraeliPhone(phone)) {
    return res.status(400).json({ field: 'phone', error: 'מספר טלפון לא תקין' });
  }

  if (!isValidIsraeliID(id_number)) {
    return res.status(400).json({ field: 'id_number', error: 'מספר תעודת זהות לא תקין' });
  }

  if (!isOver18(birthdate)) {
    return res.status(400).json({ field: 'birthdate', error: 'ההרשמה מותרת מגיל 18 ומעלה בלבד' });
  }

  try {
    const { data: existingPhone, error: phoneError } = await supabase
      .from('members')
      .select('id')
      .eq('phone', phone)
      .single();

    if (existingPhone) {
      return res.status(400).json({ field: 'phone', error: 'מספר טלפון זה כבר קיים במערכת' });
    }

    const { data: existingID, error: idError } = await supabase
      .from('members')
      .select('id')
      .eq('id_number', id_number)
      .single();

    if (existingID) {
      return res.status(400).json({ field: 'id_number', error: 'תעודת זהות זו כבר קיימת במערכת' });
    }

    const { data: existingEmail, error: emailError } = await supabase
      .from('members')
      .select('id')
      .eq('email', email)
      .single();

    if (existingEmail) {
      return res.status(400).json({ field: 'email', error: 'כתובת מייל זו כבר קיימת במערכת' });
    }

    const { error } = await supabase
      .from('members')
      .insert([
        {
          first_name,
          last_name,
          city,
          birthdate,
          phone,
          id_number,
          email,
          joined_at: new Date().toISOString()
        }
      ]);

    if (error) {
      console.error('DB Insert Error:', error);
      return res.status(500).json({ field: 'general', error: 'שגיאה בשמירת הנתונים' });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ field: 'general', error: 'שגיאה כללית בשרת' });
  }
}
