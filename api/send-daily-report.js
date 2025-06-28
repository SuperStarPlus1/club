// /api/send-daily-report.js
import { createClient } from '@supabase/supabase-js';
import ExcelJS from 'exceljs';
import nodemailer from 'nodemailer';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const { data, error } = await supabase
    .from('members')
    .select('*')
    .gte('joined_at', today.toISOString())
    .lt('joined_at', tomorrow.toISOString());

  if (error) {
    console.error('Supabase Error:', error);
    return res.status(500).json({ error: 'Database fetch error' });
  }

  if (!data || data.length === 0) {
    return res.status(200).json({ message: 'No new registrations today' });
  }

  // יצירת קובץ Excel
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Registrations');

  worksheet.columns = [
    { header: 'שם פרטי', key: 'first_name', width: 15 },
    { header: 'שם משפחה', key: 'last_name', width: 15 },
    { header: 'עיר', key: 'city', width: 15 },
    { header: 'תאריך לידה', key: 'birthdate', width: 15 },
    { header: 'טלפון', key: 'phone', width: 15 },
    { header: 'תעודת זהות', key: 'id_number', width: 15 },
    { header: 'מייל', key: 'email', width: 25 },
    { header: 'הצטרף בתאריך', key: 'joined_at', width: 20 }
  ];

  data.forEach(member => worksheet.addRow(member));

  const buffer = await workbook.xlsx.writeBuffer();

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: ['ashraf@khader.co.il', 'criem@plusgolg.co.il', 'khalid@plusgols.co.il'],
    subject: `דוח יומי הצטרפות למועדון - ${today.toLocaleDateString('he-IL')}`,
    text: 'מצורף דוח הצטרפות יומית למועדון.',
    attachments: [
      {
        filename: `daily-report-${today.toISOString().slice(0, 10)}.xlsx`,
        content: buffer,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    ]
  });

  res.status(200).json({ success: true });
}
