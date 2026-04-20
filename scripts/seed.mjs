/**
 * seed.mjs — Run with: node scripts/seed.mjs
 * Seeds the MongoDB database with demo users, startups, reports, meetings, books.
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI ||
  'mongodb+srv://zohid061007_db_user:jspEMVAtXaQFkrO8@cluster0.xf1ntxi.mongodb.net/residency';

// ── Inline schemas ────────────────────────────────────────────────────────────
const UserSchema = new mongoose.Schema({
  name: String, surname: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'user' },
}, { timestamps: true });

const StartupSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  name: String, surname: String, gmail: String,
  startup_name: String, region: String, startup_logo: String,
  description: String, startup_sphere: String, stage: String,
  founder_name: String, phone: String, telegram: String,
  team_size: Number, pitch_deck: String, commitment: String,
  mrr: Number, users_count: Number, investment_raised: Number,
  status: { type: String, default: 'active' },
  managerId: mongoose.Schema.Types.ObjectId,
}, { timestamps: true });

const ReportSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  startupId: mongoose.Schema.Types.ObjectId,
  weekStart: Date, weekEnd: Date,
  completed: String, notCompleted: String, plans: String,
  status: { type: String, default: 'pending' },
  rejectionReason: String,
  reviewedBy: mongoose.Schema.Types.ObjectId, reviewedAt: Date,
}, { timestamps: true });

const MeetingSchema = new mongoose.Schema({
  managerId: mongoose.Schema.Types.ObjectId,
  userId: mongoose.Schema.Types.ObjectId,
  startupId: mongoose.Schema.Types.ObjectId,
  title: String, topic: String, scheduledAt: Date,
  duration: { type: Number, default: 30 },
  meetLink: String,
  status: { type: String, default: 'available' },
  notes: String,
}, { timestamps: true });

const BookSchema = new mongoose.Schema({
  title: String, author: String, description: String,
  fileUrl: String, coverUrl: String, category: String,
  uploadedBy: mongoose.Schema.Types.ObjectId,
  downloadCount: { type: Number, default: 0 },
}, { timestamps: true });

const TaskProgressSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  startupId: mongoose.Schema.Types.ObjectId,
  taskId: String, quarter: Number, month: Number,
  completed: { type: Boolean, default: false },
  completedAt: Date,
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

const ScheduleSchema = new mongoose.Schema({
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
  timezone: { type: String, default: 'Asia/Tashkent' },
  monday:    { enabled: Boolean, slots: [{ start: String, end: String }] },
  tuesday:   { enabled: Boolean, slots: [{ start: String, end: String }] },
  wednesday: { enabled: Boolean, slots: [{ start: String, end: String }] },
  thursday:  { enabled: Boolean, slots: [{ start: String, end: String }] },
  friday:    { enabled: Boolean, slots: [{ start: String, end: String }] },
  saturday:  { enabled: Boolean, slots: [{ start: String, end: String }] },
  sunday:    { enabled: Boolean, slots: [{ start: String, end: String }] },
  slotDuration: { type: Number, default: 30 },
}, { timestamps: true });
const Schedule = mongoose.models.Schedule || mongoose.model('Schedule', ScheduleSchema);

const Startup = mongoose.models.Startup || mongoose.model('Startup', StartupSchema);
const Report = mongoose.models.Report || mongoose.model('Report', ReportSchema);
const Meeting = mongoose.models.Meeting || mongoose.model('Meeting', MeetingSchema);
const Book = mongoose.models.Book || mongoose.model('Book', BookSchema);
const TaskProgress = mongoose.models.TaskProgress || mongoose.model('TaskProgress', TaskProgressSchema);

function genMeetLink() {
  const c = 'abcdefghijklmnopqrstuvwxyz';
  const s = (n) => Array.from({ length: n }, () => c[Math.floor(Math.random() * c.length)]).join('');
  return `https://meet.google.com/${s(3)}-${s(4)}-${s(3)}`;
}

function weekBounds(weeksAgo = 0) {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + 1 - weeksAgo * 7);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return { weekStart, weekEnd };
}

function future(days, hour = 10) {
  const d = new Date(); d.setDate(d.getDate() + days); d.setHours(hour, 0, 0, 0); return d;
}
function past(days, hour = 10) {
  const d = new Date(); d.setDate(d.getDate() - days); d.setHours(hour, 0, 0, 0); return d;
}

async function seed() {
  console.log('🌱 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  // Clear
  await Promise.all([
    User.deleteMany({}), Startup.deleteMany({}), Report.deleteMany({}),
    Meeting.deleteMany({}), Book.deleteMany({}), TaskProgress.deleteMany({}),
  ]);
  console.log('🗑️  Cleared existing data');

  const pass = await bcrypt.hash('password123', 12);

  // ── Users ──────────────────────────────────────────────────────────────────
  const users = await User.insertMany([
    { name: 'Super', surname: 'Admin', email: 'admin@residency.uz', password: pass, role: 'super_admin' },
    { name: 'Akbar', surname: 'Toshmatov', email: 'manager@residency.uz', password: pass, role: 'manager' },
    { name: 'Aisha', surname: 'Karimova', email: 'aisha@gmail.com', password: pass, role: 'user' },
    { name: 'Jasur', surname: 'Umarov', email: 'jasur@gmail.com', password: pass, role: 'user' },
    { name: 'Nilufar', surname: 'Rahimova', email: 'nilufar@gmail.com', password: pass, role: 'user' },
    { name: 'Bobur', surname: 'Xasanov', email: 'bobur@gmail.com', password: pass, role: 'user' },
    { name: 'Zulfiya', surname: 'Nazarova', email: 'zulfiya@gmail.com', password: pass, role: 'user' },
  ]);
  const [superAdmin, manager, u1, u2, u3, u4, u5] = users;
  console.log(`👤 Created ${users.length} users`);

  // ── Startups ───────────────────────────────────────────────────────────────
  const startups = await Startup.insertMany([
    {
      userId: u1._id, name: 'Aisha', surname: 'Karimova', gmail: 'aisha@gmail.com',
      startup_name: 'MagicStore AI', region: 'Tashkent',
      description: "MagicStore AI — bu tadbirkorlarga bir kun ichida professional onlayn do'kon yaratish imkonini beruvchi platforma. AI yordamida mahsulot tavsifi, narx tahlili va marketing kontenti avtomatik ravishda yaratiladi.",
      startup_sphere: 'AI/ML', stage: 'mvp', founder_name: 'Aisha Karimova',
      phone: '+998901234567', telegram: '@aisha_founder', team_size: 4,
      commitment: 'full-time', mrr: 2800, users_count: 340, investment_raised: 15000,
      status: 'active', managerId: manager._id,
    },
    {
      userId: u2._id, name: 'Jasur', surname: 'Umarov', gmail: 'jasur@gmail.com',
      startup_name: 'EduFlow', region: 'Samarkand',
      description: "EduFlow — maktab o'quvchilariga va talabalariga shaxsiylashtirilgan o'quv yo'nalishi taklif etuvchi EdTech platforma. Adaptiv AI algoritmlari bilan har bir o'quvchining bilim darajasini aniqlaydi.",
      startup_sphere: 'EdTech', stage: 'growth', founder_name: 'Jasur Umarov',
      phone: '+998901112233', telegram: '@jasur_edu', team_size: 7,
      commitment: 'full-time', mrr: 8500, users_count: 1200, investment_raised: 50000,
      status: 'active', managerId: manager._id,
    },
    {
      userId: u3._id, name: 'Nilufar', surname: 'Rahimova', gmail: 'nilufar@gmail.com',
      startup_name: 'AgriSense', region: 'Fergana',
      description: 'AgriSense — dehqonlarga real vaqt rejimida tuproq holati, ob-havo sharoiti va hosil prognozlarini taqdim etuvchi AgriTech yechim.',
      startup_sphere: 'AgriTech', stage: 'idea', founder_name: 'Nilufar Rahimova',
      phone: '+998907654321', telegram: '@nilufar_agri', team_size: 2,
      commitment: 'part-time', mrr: 0, users_count: 0, investment_raised: 0,
      status: 'pending', managerId: manager._id,
    },
    {
      userId: u4._id, name: 'Bobur', surname: 'Xasanov', gmail: 'bobur@gmail.com',
      startup_name: 'PayEasy UZ', region: 'Tashkent',
      description: 'PayEasy UZ — O\'zbekistondagi kichik bizneslar uchun sodda va tez to\'lov qabul qilish tizimi. QR kod va mobil ilovalar orqali ishlaydi.',
      startup_sphere: 'FinTech', stage: 'mvp', founder_name: 'Bobur Xasanov',
      phone: '+998905678901', telegram: '@bobur_pay', team_size: 3,
      commitment: 'full-time', mrr: 1200, users_count: 89, investment_raised: 5000,
      status: 'active', managerId: manager._id,
    },
    {
      userId: u5._id, name: 'Zulfiya', surname: 'Nazarova', gmail: 'zulfiya@gmail.com',
      startup_name: 'HealthTrack', region: 'Tashkent',
      description: 'HealthTrack — bemorlar va shifokorlar o\'rtasidagi raqamli ko\'prik. Davolash tarixi, dori eslatmalari va online konsultatsiya bir joyda.',
      startup_sphere: 'HealthTech', stage: 'scale', founder_name: 'Zulfiya Nazarova',
      phone: '+998906543210', telegram: '@zulfiya_health', team_size: 12,
      commitment: 'full-time', mrr: 22000, users_count: 4800, investment_raised: 200000,
      status: 'active', managerId: manager._id,
    },
  ]);
  const [s1, s2, s3, s4, s5] = startups;
  console.log(`🚀 Created ${startups.length} startups`);

  // ── Reports ────────────────────────────────────────────────────────────────
  await Report.insertMany([
    {
      userId: u1._id, startupId: s1._id, ...weekBounds(0),
      completed: 'Shipped new dashboard UI. MRR grew from $2,200 to $2,800. Onboarded 40 new users.',
      notCompleted: 'Senior engineer hire still pending. Mobile app delayed.',
      plans: 'Hire engineer, launch referral program, hit $3,500 MRR.',
      status: 'pending',
    },
    {
      userId: u1._id, startupId: s1._id, ...weekBounds(1),
      completed: 'Launched MVP beta with 50 new users. Integrated Stripe payments. Fixed 12 bugs.',
      notCompleted: 'Mobile app version not started. Analytics dashboard delayed.',
      plans: 'Reach 100 paying users. Ship mobile beta. Integrate Mixpanel.',
      status: 'accepted', reviewedBy: manager._id, reviewedAt: new Date(),
    },
    {
      userId: u1._id, startupId: s1._id, ...weekBounds(2),
      completed: 'Closed first 5 paying customers at $199/month. Built AI product description generator.',
      notCompleted: 'Partnership with Uzum Market fell through.',
      plans: 'Onboard 20 more beta users. Fix API limits. Reopen partnership.',
      status: 'accepted', reviewedBy: manager._id, reviewedAt: new Date(),
    },
    {
      userId: u2._id, startupId: s2._id, ...weekBounds(0),
      completed: 'Signed MOU with 3 schools in Samarkand. Built adaptive quiz engine.',
      notCompleted: 'Fundraising pitch postponed.',
      plans: 'Close seed round. Launch parent portal. Onboard 2 more schools.',
      status: 'rejected',
      rejectionReason: 'Report lacks specific metrics. Please include DAU, conversion rates, and revenue per school.',
      reviewedBy: manager._id, reviewedAt: new Date(),
    },
    {
      userId: u2._id, startupId: s2._id, ...weekBounds(1),
      completed: 'Reached 1,200 users milestone. Launched gamification features. Got featured in EdTech Uzbekistan newsletter.',
      notCompleted: 'iOS app submission rejected by App Store — working on fix.',
      plans: 'Resubmit iOS app. Run back-to-school campaign. Target 1,500 users.',
      status: 'accepted', reviewedBy: manager._id, reviewedAt: new Date(),
    },
    {
      userId: u5._id, startupId: s5._id, ...weekBounds(0),
      completed: 'MRR hit $22K milestone. Signed contract with 2 private clinics. Launched telemedicine feature.',
      notCompleted: 'GDPR compliance audit not finished.',
      plans: 'Complete compliance audit. Close Series A term sheet. Hire 3 engineers.',
      status: 'pending',
    },
  ]);
  console.log('📄 Created 6 reports');

  // ── Meetings ───────────────────────────────────────────────────────────────
  await Meeting.insertMany([
    {
      managerId: manager._id, userId: u1._id, startupId: s1._id,
      title: 'Weekly Mentor Session', topic: 'MRR growth strategy and hiring plan',
      scheduledAt: future(2, 10), duration: 45, meetLink: genMeetLink(), status: 'booked',
    },
    {
      managerId: manager._id, userId: u2._id, startupId: s2._id,
      title: 'Investor Pitch Prep', topic: 'Seed round deck review and Q&A practice',
      scheduledAt: future(4, 14), duration: 60, meetLink: genMeetLink(), status: 'booked',
    },
    {
      managerId: manager._id, userId: u5._id, startupId: s5._id,
      title: 'Series A Strategy', topic: 'Fundraising timeline and investor targeting',
      scheduledAt: future(6, 11), duration: 90, meetLink: genMeetLink(), status: 'booked',
    },
    {
      managerId: manager._id,
      title: 'Office Hours', scheduledAt: future(1, 11), duration: 30,
      meetLink: genMeetLink(), status: 'available',
    },
    {
      managerId: manager._id,
      title: 'Office Hours', scheduledAt: future(3, 15), duration: 30,
      meetLink: genMeetLink(), status: 'available',
    },
    {
      managerId: manager._id,
      title: 'Demo Day Coaching', scheduledAt: future(7, 10), duration: 90,
      meetLink: genMeetLink(), status: 'available',
    },
    {
      managerId: manager._id,
      title: 'Product Review Slot', scheduledAt: future(5, 16), duration: 45,
      meetLink: genMeetLink(), status: 'available',
    },
    {
      managerId: manager._id, userId: u1._id, startupId: s1._id,
      title: 'Kick-off Meeting', topic: 'Program overview and 90-day goal setting',
      scheduledAt: past(14, 10), duration: 60, meetLink: genMeetLink(), status: 'completed',
    },
    {
      managerId: manager._id, userId: u2._id, startupId: s2._id,
      title: 'Product Review', topic: 'EdTech feature roadmap and user feedback analysis',
      scheduledAt: past(7, 14), duration: 45, meetLink: genMeetLink(), status: 'completed',
    },
    {
      managerId: manager._id, userId: u4._id, startupId: s4._id,
      title: 'FinTech Compliance Call', topic: 'Regulatory requirements for payment processing in Uzbekistan',
      scheduledAt: past(3, 11), duration: 30, meetLink: genMeetLink(), status: 'completed',
    },
  ]);
  console.log('📅 Created 10 meetings');

  // ── Books ──────────────────────────────────────────────────────────────────
  await Book.insertMany([
    { title: 'Zero to One', author: 'Peter Thiel', category: 'Business', description: 'How to build a monopoly business from scratch. The contrarian guide to startup success.', fileUrl: 'https://www.academia.edu/35739748/Zero_to_One', coverUrl: '', uploadedBy: manager._id, downloadCount: 47 },
    { title: 'The Lean Startup', author: 'Eric Ries', category: 'Business', description: 'How to use continuous innovation and validated learning to build successful startups.', fileUrl: 'https://books.google.com/books?id=tvfyz-4JILwC', coverUrl: '', uploadedBy: manager._id, downloadCount: 63 },
    { title: 'Traction', author: 'Gabriel Weinberg & Justin Mares', category: 'Marketing', description: '19 channels to build a customer base. A systematic framework for finding your growth engine.', fileUrl: 'https://www.amazon.com/Traction-Startup-Achieve-Explosive-Customer/dp/1591848369', coverUrl: '', uploadedBy: manager._id, downloadCount: 38 },
    { title: '$100M Offers', author: 'Alex Hormozi', category: 'Sales', description: 'How to make offers so good people feel stupid saying no. Create irresistible value propositions.', fileUrl: 'https://www.acquisition.com/books', coverUrl: '', uploadedBy: manager._id, downloadCount: 89 },
    { title: 'Hooked', author: 'Nir Eyal', category: 'Product', description: 'The Hook Model framework for building habit-forming products users keep coming back to.', fileUrl: 'https://www.nirandfar.com/hooked/', coverUrl: '', uploadedBy: manager._id, downloadCount: 52 },
    { title: 'The Mom Test', author: 'Rob Fitzpatrick', category: 'Product', description: 'How to talk to customers and learn if your idea is good — even when everyone is lying to you.', fileUrl: 'https://www.momtestbook.com/', coverUrl: '', uploadedBy: manager._id, downloadCount: 71 },
    { title: 'Blitzscaling', author: 'Reid Hoffman & Chris Yeh', category: 'Business', description: 'The lightning-fast path to building massively valuable companies by prioritizing speed over efficiency.', fileUrl: 'https://blitzscaling.com/', coverUrl: '', uploadedBy: manager._id, downloadCount: 29 },
    { title: 'Good to Great', author: 'Jim Collins', category: 'Leadership', description: 'Why some companies make the leap from good to great — and others don\'t. Based on 5-year research.', fileUrl: 'https://www.jimcollins.com/books.html', coverUrl: '', uploadedBy: manager._id, downloadCount: 34 },
    { title: 'Crossing the Chasm', author: 'Geoffrey Moore', category: 'Marketing', description: 'Marketing and selling technology products to mainstream customers. The definitive B2B GTM guide.', fileUrl: 'https://www.harpercollins.com/products/crossing-the-chasm-geoffrey-a-moore', coverUrl: '', uploadedBy: manager._id, downloadCount: 41 },
    { title: 'High Output Management', author: 'Andrew Grove', category: 'Leadership', description: 'The definitive guide to management from the legendary Intel CEO. Maximize your team output.', fileUrl: 'https://www.penguinrandomhouse.com/books/72467/high-output-management-by-andrew-s-grove/', coverUrl: '', uploadedBy: manager._id, downloadCount: 56 },
  ]);
  console.log('📚 Created 10 books');


  // ── Manager Schedule ──────────────────────────────────────────────────────
  await Schedule.deleteMany({});
  await Schedule.create({
    managerId: manager._id,
    timezone: 'Asia/Tashkent',
    slotDuration: 30,
    monday:    { enabled: true,  slots: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '17:00' }] },
    tuesday:   { enabled: true,  slots: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '17:00' }] },
    wednesday: { enabled: true,  slots: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '17:00' }] },
    thursday:  { enabled: true,  slots: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '17:00' }] },
    friday:    { enabled: true,  slots: [{ start: '09:00', end: '13:00' }] },
    saturday:  { enabled: false, slots: [] },
    sunday:    { enabled: false, slots: [] },
  });
  console.log('📅 Created manager schedule');

  // ── Task Progress ──────────────────────────────────────────────────────────
  const doneTasks = [
    { taskId: 'q1m1t1', quarter: 1, month: 1 }, { taskId: 'q1m1t2', quarter: 1, month: 1 },
    { taskId: 'q1m1t3', quarter: 1, month: 1 }, { taskId: 'q1m1t4', quarter: 1, month: 1 },
    { taskId: 'q1m1t5', quarter: 1, month: 1 }, { taskId: 'q1m2t1', quarter: 1, month: 2 },
    { taskId: 'q1m2t2', quarter: 1, month: 2 }, { taskId: 'q1m2t3', quarter: 1, month: 2 },
    { taskId: 'q1m3t1', quarter: 1, month: 3 }, { taskId: 'q1m3t2', quarter: 1, month: 3 },
    { taskId: 'q1m3t4', quarter: 1, month: 3 }, { taskId: 'q2m1t1', quarter: 2, month: 1 },
    { taskId: 'q2m1t4', quarter: 2, month: 1 },
  ];
  // EduFlow tasks
  const eduTasks = [
    { taskId: 'q1m1t1', quarter: 1, month: 1 }, { taskId: 'q1m1t2', quarter: 1, month: 1 },
    { taskId: 'q1m2t1', quarter: 1, month: 2 }, { taskId: 'q2m1t1', quarter: 2, month: 1 },
    { taskId: 'q2m1t2', quarter: 2, month: 1 }, { taskId: 'q2m2t1', quarter: 2, month: 2 },
    { taskId: 'q2m2t2', quarter: 2, month: 2 }, { taskId: 'q2m3t4', quarter: 2, month: 3 },
  ];

  await TaskProgress.insertMany([
    ...doneTasks.map((t) => ({ userId: u1._id, startupId: s1._id, ...t, completed: true, completedAt: new Date() })),
    ...eduTasks.map((t) => ({ userId: u2._id, startupId: s2._id, ...t, completed: true, completedAt: new Date() })),
  ]);
  console.log(`✅ Created ${doneTasks.length + eduTasks.length} task progress records`);

  // ── Done ───────────────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉  Seed complete! Database is ready.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('🔐  Login Credentials (password: password123)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Super Admin  →  admin@residency.uz');
  console.log('  Manager      →  manager@residency.uz');
  console.log('  Founder 1    →  aisha@gmail.com       (MagicStore AI — MVP)');
  console.log('  Founder 2    →  jasur@gmail.com       (EduFlow — Growth)');
  console.log('  Founder 3    →  nilufar@gmail.com     (AgriSense — Idea)');
  console.log('  Founder 4    →  bobur@gmail.com       (PayEasy UZ — MVP)');
  console.log('  Founder 5    →  zulfiya@gmail.com     (HealthTrack — Scale)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('\n❌ Seed failed:', err.message);
  process.exit(1);
});
