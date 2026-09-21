import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import crypto from 'crypto';

dotenv.config();
const app = express();
const port = Number(process.env.PORT || 5000);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL || "") ? false : { rejectUnauthorized: false },
});
const allowedOrigins = [...new Set([
  ...(process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map(s=>s.trim()),
  'http://localhost',
  'https://localhost',
])];
app.use(cors({ origin(origin, cb){ if(!origin || allowedOrigins.includes(origin)) return cb(null,true); cb(new Error('CORS origin not allowed')); } }));
app.use(express.json({ limit:'1mb' }));

const signToken = (user) => jwt.sign({ sub:user.id, role:user.role }, process.env.JWT_SECRET, { expiresIn:'7d' });
function auth(req,res,next){
  const token=(req.headers.authorization||'').replace(/^Bearer\s+/,'');
  if(!token) return res.status(401).json({error:'Authentication required'});
  try { req.auth=jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch { return res.status(401).json({error:'Invalid or expired token'}); }
}
function roles(...allowed){ return (req,res,next)=> allowed.includes(req.auth.role) ? next() : res.status(403).json({error:'Forbidden'}); }
function safeUser(r){ return {id:r.id,name:r.name,email:r.email,role:r.role,age:r.age,language:r.language}; }
function hashInvite(code){ return crypto.createHash('sha256').update(code).digest('hex'); }
function inviteExpiry(){ return new Date(Date.now()+10*60*1000); }

app.get('/api/health', async (_req,res)=>{
  try { await pool.query('SELECT 1'); res.json({ok:true, database:'connected'}); }
  catch { res.status(503).json({ok:false,database:'unavailable'}); }
});

app.post('/api/auth/register', async (req,res)=>{
  try {
    const {name,email,password,role='elderly',age,language='en'}=req.body;
    if(!name||!email||!password) return res.status(400).json({error:'Name, email and password are required'});
    if(password.length<8) return res.status(400).json({error:'Password must be at least 8 characters'});
    if(!['elderly','caregiver'].includes(role)) return res.status(400).json({error:'Invalid role'});
    const exists=await pool.query('SELECT id FROM users WHERE lower(email)=lower($1)',[email.trim()]);
    if(exists.rowCount) return res.status(409).json({error:'An account with this email already exists'});
    const hash=await bcrypt.hash(password,12);
    const {rows}=await pool.query('INSERT INTO users(name,email,password_hash,role,age,language) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,name,email,role,age,language',[name.trim(),email.trim().toLowerCase(),hash,role,age||null,language]);
    res.status(201).json({user:safeUser(rows[0]),token:signToken(rows[0])});
  } catch(e){ console.error(e); res.status(500).json({error:'Registration failed'}); }
});

app.post('/api/auth/login', async (req,res)=>{
  try {
    const {email,password}=req.body;
    const {rows}=await pool.query('SELECT * FROM users WHERE lower(email)=lower($1)',[email?.trim()||'']);
    if(!rows.length || !(await bcrypt.compare(password||'',rows[0].password_hash))) return res.status(401).json({error:'Invalid email or password'});
    res.json({user:safeUser(rows[0]),token:signToken(rows[0])});
  } catch(e){ console.error(e); res.status(500).json({error:'Login failed'}); }
});

app.get('/api/auth/me',auth,async(req,res)=>{
  const {rows}=await pool.query('SELECT id,name,email,role,age,language FROM users WHERE id=$1',[req.auth.sub]);
  if(!rows.length) return res.status(404).json({error:'User not found'});
  res.json({user:safeUser(rows[0])});
});

app.post('/api/auth/change-password',auth,async(req,res)=>{
  try {
    const {currentPassword,newPassword}=req.body;
    if(!currentPassword||!newPassword) return res.status(400).json({error:'Current and new passwords are required'});
    if(newPassword.length<8) return res.status(400).json({error:'Password must be at least 8 characters'});
    const {rows}=await pool.query('SELECT password_hash FROM users WHERE id=$1',[req.auth.sub]);
    if(!rows.length) return res.status(404).json({error:'User not found'});
    if(!(await bcrypt.compare(currentPassword,rows[0].password_hash))) return res.status(401).json({error:'Current password is incorrect'});
    const hash=await bcrypt.hash(newPassword,12);
    await pool.query('UPDATE users SET password_hash=$1 WHERE id=$2',[hash,req.auth.sub]);
    res.json({ok:true});
  } catch(e){ console.error(e); res.status(500).json({error:'Could not change password'}); }
});

app.get('/api/games',auth,(_req,res)=>res.json({games:[
  {key:'memory',label:'Memory Match'},
  {key:'objectRecall',label:'Object Recall'},
  {key:'pattern',label:'Pattern Recognition'},
  {key:'attention',label:'Attention Game'}
]}));

app.post('/api/game-sessions',auth,async(req,res)=>{
  try {
    const b=req.body;
    if(!b.id||!b.gameKey) return res.status(400).json({error:'Session id and game key are required'});
    const q=`INSERT INTO game_sessions(id,user_id,game_key,score,accuracy,response_time,difficulty_before,difficulty_after,total_questions,correct_answers,client_created_at)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT(id) DO NOTHING RETURNING *`;
    const {rows}=await pool.query(q,[b.id,req.auth.sub,b.gameKey,b.score,b.accuracy,b.responseTime||0,b.difficultyBefore,b.difficultyAfter,b.totalQuestions||1,b.correctAnswers||0,b.clientCreatedAt||new Date().toISOString()]);
    res.status(rows.length?201:200).json({session:rows[0]||null,duplicate:!rows.length});
  } catch(e){ console.error(e); res.status(500).json({error:'Could not save game session'}); }
});

app.post('/api/game-sessions/sync',auth,async(req,res)=>{
  const sessions=Array.isArray(req.body.sessions)?req.body.sessions:[];
  const results=[];
  const client=await pool.connect();
  try {
    await client.query('BEGIN');
    for(const b of sessions){
      const q=`INSERT INTO game_sessions(id,user_id,game_key,score,accuracy,response_time,difficulty_before,difficulty_after,total_questions,correct_answers,client_created_at)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT(id) DO NOTHING RETURNING id`;
      const r=await client.query(q,[b.id,req.auth.sub,b.gameKey,b.score,b.accuracy,b.responseTime||0,b.difficultyBefore,b.difficultyAfter,b.totalQuestions||1,b.correctAnswers||0,b.clientCreatedAt||new Date().toISOString()]);
      results.push({id:b.id,status:r.rowCount?'synced':'already_synced'});
    }
    await client.query('COMMIT'); res.json({results});
  } catch(e){ await client.query('ROLLBACK'); console.error(e); res.status(500).json({error:'Sync failed'}); }
  finally{client.release();}
});

app.get('/api/me/performance',auth,async(req,res)=>{
  const {rows}=await pool.query(`SELECT id,game_key,score,accuracy,response_time,difficulty_before,difficulty_after,total_questions,correct_answers,client_created_at,created_at FROM game_sessions WHERE user_id=$1 ORDER BY created_at ASC`,[req.auth.sub]);
  res.json({sessions:rows});
});

app.post('/api/reminders',auth,async(req,res)=>{
  const {title,reminderTime,note=''}=req.body;
  if(!title||!reminderTime) return res.status(400).json({error:'Title and time are required'});
  const {rows}=await pool.query('INSERT INTO reminders(user_id,title,reminder_time,note) VALUES($1,$2,$3,$4) RETURNING *',[req.auth.sub,title,reminderTime,note]);
  res.status(201).json({reminder:rows[0]});
});
app.get('/api/reminders',auth,async(req,res)=>{ const {rows}=await pool.query('SELECT * FROM reminders WHERE user_id=$1 ORDER BY created_at DESC',[req.auth.sub]); res.json({reminders:rows}); });
app.delete('/api/reminders/:id',auth,async(req,res)=>{
  const {rows}=await pool.query('DELETE FROM reminders WHERE id=$1 AND user_id=$2 RETURNING id',[req.params.id,req.auth.sub]);
  if(!rows.length) return res.status(404).json({error:'Reminder not found'});
  res.json({ok:true,id:rows[0].id});
});

app.post('/api/caregiver/invite',auth,roles('elderly'),async(req,res)=>{
  try {
    const code=String(crypto.randomInt(100000,1000000));
    const expiresAt=inviteExpiry();
    await pool.query('UPDATE caregiver_invites SET revoked_at=NOW() WHERE elderly_id=$1 AND used_at IS NULL AND revoked_at IS NULL',[req.auth.sub]);
    await pool.query('INSERT INTO caregiver_invites(elderly_id,code_hash,expires_at) VALUES($1,$2,$3)',[req.auth.sub,hashInvite(code),expiresAt]);
    res.status(201).json({code,expiresAt});
  } catch(e){ console.error(e); res.status(500).json({error:'Could not create caregiver invite'}); }
});

app.post('/api/caregiver/connect',auth,roles('caregiver'),async(req,res)=>{
  const code=String(req.body.code||'').trim();
  if(!/^\d{6}$/.test(code)) return res.status(400).json({error:'Enter a valid 6-digit caregiver code'});
  const client=await pool.connect();
  try {
    await client.query('BEGIN');
    const invite=await client.query('SELECT id,elderly_id,expires_at FROM caregiver_invites WHERE code_hash=$1 AND used_at IS NULL AND revoked_at IS NULL FOR UPDATE',[hashInvite(code)]);
    if(!invite.rowCount || new Date(invite.rows[0].expires_at)<=new Date()) { await client.query('ROLLBACK'); return res.status(400).json({error:'This caregiver code is invalid or expired'}); }
    const {elderly_id:elderlyId}=invite.rows[0];
    const existing=await client.query('SELECT id,status FROM caregiver_links WHERE caregiver_id=$1 AND elderly_id=$2',[req.auth.sub,elderlyId]);
    if(existing.rowCount && existing.rows[0].status==='active') { await client.query('ROLLBACK'); return res.status(409).json({error:'You are already linked to this user'}); }
    if(existing.rowCount && existing.rows[0].status==='pending') { await client.query('ROLLBACK'); return res.status(409).json({error:'A connection request is already pending'}); }
    if(existing.rowCount) await client.query("UPDATE caregiver_links SET status='pending',updated_at=NOW(),created_at=NOW() WHERE id=$1",[existing.rows[0].id]);
    else await client.query("INSERT INTO caregiver_links(caregiver_id,elderly_id,status) VALUES($1,$2,'pending')",[req.auth.sub,elderlyId]);
    await client.query('UPDATE caregiver_invites SET used_at=NOW() WHERE id=$1',[invite.rows[0].id]);
    await client.query('COMMIT');
    res.status(201).json({status:'pending'});
  } catch(e){ await client.query('ROLLBACK'); console.error(e); res.status(500).json({error:'Could not create connection request'}); }
  finally{ client.release(); }
});

app.get('/api/caregiver',auth,roles('elderly','caregiver'),async(req,res)=>{
  const elderly=req.auth.role==='elderly';
  const {rows}=await pool.query(`SELECT l.id,l.status,l.created_at,l.updated_at,u.id AS user_id,u.name,u.email,u.role FROM caregiver_links l JOIN users u ON u.id=${elderly?'l.caregiver_id':'l.elderly_id'} WHERE ${elderly?'l.elderly_id':'l.caregiver_id'}=$1 ORDER BY l.updated_at DESC`,[req.auth.sub]);
  res.json({links:rows});
});

app.post('/api/caregiver/requests/:id/accept',auth,roles('elderly'),async(req,res)=>{
  const {rows}=await pool.query("UPDATE caregiver_links SET status='active',updated_at=NOW() WHERE id=$1 AND elderly_id=$2 AND status='pending' RETURNING id",[req.params.id,req.auth.sub]);
  if(!rows.length) return res.status(404).json({error:'Pending caregiver request not found'});
  res.json({ok:true,status:'active'});
});
app.post('/api/caregiver/requests/:id/reject',auth,roles('elderly'),async(req,res)=>{
  const {rows}=await pool.query("UPDATE caregiver_links SET status='rejected',updated_at=NOW() WHERE id=$1 AND elderly_id=$2 AND status='pending' RETURNING id",[req.params.id,req.auth.sub]);
  if(!rows.length) return res.status(404).json({error:'Pending caregiver request not found'});
  res.json({ok:true,status:'rejected'});
});
app.delete('/api/caregiver/:id',auth,roles('elderly','caregiver'),async(req,res)=>{
  const field=req.auth.role==='elderly'?'elderly_id':'caregiver_id';
  const {rows}=await pool.query(`UPDATE caregiver_links SET status='revoked',updated_at=NOW() WHERE id=$1 AND ${field}=$2 AND status IN ('pending','active') RETURNING id`,[req.params.id,req.auth.sub]);
  if(!rows.length) return res.status(404).json({error:'Caregiver relationship not found'});
  res.json({ok:true,status:'revoked'});
});

app.get('/api/caregiver/users',auth,roles('caregiver','admin'),async(req,res)=>{
  const sql=req.auth.role==='admin'
    ? `SELECT u.id,u.name,u.email,u.age,u.language,u.role,COALESCE(ROUND(AVG(g.score)),0)::int AS training_score,COALESCE(ROUND(AVG(g.accuracy)),0)::int AS accuracy,COALESCE(MAX(GREATEST(g.difficulty_before,g.difficulty_after)),1)::int AS level,COUNT(g.id)::int AS sessions,MAX(g.created_at) AS last_activity FROM users u LEFT JOIN game_sessions g ON g.user_id=u.id WHERE u.role='elderly' GROUP BY u.id ORDER BY u.name`
    : `SELECT u.id,u.name,u.email,u.age,u.language,u.role,COALESCE(ROUND(AVG(g.score)),0)::int AS training_score,COALESCE(ROUND(AVG(g.accuracy)),0)::int AS accuracy,COALESCE(MAX(GREATEST(g.difficulty_before,g.difficulty_after)),1)::int AS level,COUNT(g.id)::int AS sessions,MAX(g.created_at) AS last_activity FROM users u JOIN caregiver_links l ON l.elderly_id=u.id AND l.caregiver_id=$1 AND l.status='active' LEFT JOIN game_sessions g ON g.user_id=u.id WHERE u.role='elderly' GROUP BY u.id ORDER BY u.name`;
  const {rows}=await pool.query(sql,req.auth.role==='admin'?[]:[req.auth.sub]); res.json({users:rows});
});

app.get('/api/caregiver/users/:id/performance',auth,roles('caregiver','admin'),async(req,res)=>{
  if(req.auth.role==='caregiver'){
    const link=await pool.query("SELECT 1 FROM caregiver_links WHERE caregiver_id=$1 AND elderly_id=$2 AND status='active'",[req.auth.sub,req.params.id]);
    if(!link.rowCount) return res.status(403).json({error:'Not authorized for this user'});
  }
  const {rows}=await pool.query('SELECT id,name,age,language FROM users WHERE id=$1 AND role=\'elderly\'',[req.params.id]);
  if(!rows.length) return res.status(404).json({error:'User not found'});
  const sessions=await pool.query('SELECT * FROM game_sessions WHERE user_id=$1 ORDER BY created_at ASC',[req.params.id]);
  res.json({user:safeUser(rows[0]),sessions:sessions.rows});
});

async function canManageElderly(req, elderlyId){
  if(req.auth.role==='admin') return true;
  const link=await pool.query("SELECT 1 FROM caregiver_links WHERE caregiver_id=$1 AND elderly_id=$2 AND status='active'",[req.auth.sub,elderlyId]);
  return Boolean(link.rowCount);
}
async function getElderlyUser(elderlyId){
  const {rows}=await pool.query('SELECT id,name FROM users WHERE id=$1 AND role=\'elderly\'',[elderlyId]);
  return rows[0] || null;
}
app.get('/api/caregiver/users/:id/appointments',auth,roles('caregiver','admin'),async(req,res)=>{
  if(!await canManageElderly(req,req.params.id)) return res.status(403).json({error:'Not authorized for this user'});
  if(!await getElderlyUser(req.params.id)) return res.status(404).json({error:'User not found'});
  const {rows}=await pool.query('SELECT * FROM appointments WHERE elderly_id=$1 ORDER BY appointment_date ASC, appointment_time ASC',[req.params.id]);
  res.json({appointments:rows});
});
app.get('/api/appointments',auth,roles('elderly'),async(req,res)=>{
  const {rows}=await pool.query('SELECT * FROM appointments WHERE elderly_id=$1 ORDER BY appointment_date ASC, appointment_time ASC',[req.auth.sub]);
  res.json({appointments:rows});
});
app.post('/api/caregiver/users/:id/appointments',auth,roles('caregiver','admin'),async(req,res)=>{
  if(!await canManageElderly(req,req.params.id)) return res.status(403).json({error:'Not authorized for this user'});
  if(!await getElderlyUser(req.params.id)) return res.status(404).json({error:'User not found'});
  const {doctorName,clinic,appointmentDate,appointmentTime,notes=''}=req.body;
  if(!doctorName||!clinic||!appointmentDate||!appointmentTime) return res.status(400).json({error:'Doctor name, clinic, date and time are required'});
  const {rows}=await pool.query('INSERT INTO appointments(elderly_id,doctor_name,clinic,appointment_date,appointment_time,notes) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',[req.params.id,doctorName.trim(),clinic.trim(),appointmentDate,appointmentTime,notes]);
  res.status(201).json({appointment:rows[0]});
});
app.put('/api/caregiver/appointments/:id',auth,roles('caregiver','admin'),async(req,res)=>{
  const existing=await pool.query('SELECT elderly_id FROM appointments WHERE id=$1',[req.params.id]);
  if(!existing.rowCount) return res.status(404).json({error:'Appointment not found'});
  if(!await canManageElderly(req,existing.rows[0].elderly_id)) return res.status(403).json({error:'Not authorized for this user'});
  const {doctorName,clinic,appointmentDate,appointmentTime,notes=''}=req.body;
  if(!doctorName||!clinic||!appointmentDate||!appointmentTime) return res.status(400).json({error:'Doctor name, clinic, date and time are required'});
  const {rows}=await pool.query('UPDATE appointments SET doctor_name=$1,clinic=$2,appointment_date=$3,appointment_time=$4,notes=$5,updated_at=NOW() WHERE id=$6 RETURNING *',[doctorName.trim(),clinic.trim(),appointmentDate,appointmentTime,notes,req.params.id]);
  res.json({appointment:rows[0]});
});
app.delete('/api/caregiver/appointments/:id',auth,roles('caregiver','admin'),async(req,res)=>{
  const existing=await pool.query('SELECT elderly_id FROM appointments WHERE id=$1',[req.params.id]);
  if(!existing.rowCount) return res.status(404).json({error:'Appointment not found'});
  if(!await canManageElderly(req,existing.rows[0].elderly_id)) return res.status(403).json({error:'Not authorized for this user'});
  await pool.query('DELETE FROM appointments WHERE id=$1',[req.params.id]);
  res.json({ok:true,id:req.params.id});
});

app.get('/api/admin/users',auth,roles('admin'),async(req,res)=>{
  const {rows}=await pool.query(`
    SELECT u.id,u.name,u.email,u.age,u.language,u.role,u.created_at,
      COALESCE(ROUND(AVG(g.score)),0)::int AS training_score,
      COALESCE(ROUND(AVG(g.accuracy)),0)::int AS accuracy,
      COALESCE(MAX(GREATEST(g.difficulty_before,g.difficulty_after)),1)::int AS level,
      COUNT(g.id)::int AS sessions, MAX(g.created_at) AS last_activity,
      (SELECT COUNT(*)::int FROM caregiver_links l WHERE l.caregiver_id=u.id) AS linked_elderly_count
    FROM users u LEFT JOIN game_sessions g ON g.user_id=u.id
    WHERE u.role IN ('elderly','caregiver')
    GROUP BY u.id ORDER BY u.role, u.name`);
  res.json({users:rows});
});

app.get('/api/admin/caregiver-links',auth,roles('admin'),async(req,res)=>{
  const values=[]; const filters=[];
  if(req.query.status && ['pending','active','rejected','revoked'].includes(req.query.status)){ values.push(req.query.status); filters.push(`l.status=$${values.length}`); }
  if(req.query.search){ values.push(`%${String(req.query.search).trim()}%`); filters.push(`(e.name ILIKE $${values.length} OR e.id::text ILIKE $${values.length} OR c.name ILIKE $${values.length} OR c.id::text ILIKE $${values.length})`); }
  const where=filters.length?`WHERE ${filters.join(' AND ')}`:'';
  const {rows}=await pool.query(`SELECT l.id,l.status,l.created_at,l.updated_at,e.id AS elderly_id,e.name AS elderly_name,c.id AS caregiver_id,c.name AS caregiver_name FROM caregiver_links l JOIN users e ON e.id=l.elderly_id JOIN users c ON c.id=l.caregiver_id ${where} ORDER BY l.updated_at DESC`,values);
  res.json({links:rows});
});

app.delete('/api/admin/users/:id',auth,roles('admin'),async(req,res)=>{
  if(req.params.id===req.auth.sub) return res.status(400).json({error:'You cannot delete your own account'});
  const target=await pool.query('SELECT role FROM users WHERE id=$1',[req.params.id]);
  if(!target.rowCount) return res.status(404).json({error:'User not found'});
  if(target.rows[0].role==='admin') return res.status(403).json({error:'Admin accounts cannot be deleted from this panel'});
  await pool.query('DELETE FROM users WHERE id=$1',[req.params.id]);
  res.json({ok:true});
});

app.use((err,_req,res,_next)=>{console.error(err);res.status(500).json({error:'Unexpected server error'});});
app.listen(port,()=>console.log(`MindMate API running on http://localhost:${port}`));
