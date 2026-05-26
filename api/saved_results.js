import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('saved_results')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    if (req.method === 'POST') {
      const { student_name, specialization, semester_1_grades, semester_2_grades, remedial_grades, averages, status } = req.body;
      
      if (!student_name) {
        return res.status(400).json({ error: 'اسم الطالب مطلوب' });
      }

      const { data, error } = await supabase
        .from('saved_results')
        .insert({
          student_name,
          specialization: specialization || 'أدب عربي - ابتدائي',
          semester_1_grades: semester_1_grades || {},
          semester_2_grades: semester_2_grades || {},
          remedial_grades: remedial_grades || {},
          averages: averages || {},
          status: status || 'معلق'
        })
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const { id, notes, student_name } = req.body;
      if (!id) return res.status(400).json({ error: 'معرف السجل مطلوب' });

      const updateData = {};
      if (notes !== undefined) updateData.notes = notes;
      if (student_name !== undefined) updateData.student_name = student_name;

      const { data, error } = await supabase
        .from('saved_results')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const { id, security_code } = req.body;
      if (!id) return res.status(400).json({ error: 'معرف السجل مطلوب' });
      
      // Security Check: Fix fixed code 2007 (منع الحذف بدون الرمز الصحيح)
      // This is a secure server-side check that doesn't expose the code in UI
      if (parseInt(security_code) !== 2007) {
        return res.status(403).json({ error: 'رمز التحقق الأمني غير صحيح. لا يمكن إتمام عملية الحذف.' });
      }

      const { error } = await supabase
        .from('saved_results')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return res.status(200).json({ ok: true, message: 'تم حذف السجل بنجاح' });
    }

    res.status(405).json({ error: 'الطريقة غير مسموح بها' });
  } catch (err) {
    console.error('API Error in saved_results:', err);
    res.status(500).json({ error: err.message });
  }
}
