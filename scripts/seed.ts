#!/usr/bin/env ts-node
/**
 * Seed script — run with:
 *   npx ts-node --project tsconfig.json scripts/seed.ts
 * Or just run the app and register manually.
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = 'mongodb+srv://zohid061007_db_user:jspEMVAtXaQFkrO8@cluster0.xf1ntxi.mongodb.net/residency';

// ── Schemas (inline so script is self-contained) ──────────────────────────────
const UserSchema = new mongoose.Schema({
  name: String, surname: String, email: { type: String, unique: true },
  password: String, role: { type: String, default: 'user' },
}, { timestamps: true });

const StartupSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  name: String, surname: String, gmail: String,
  startup_name: String, region: String, startup_logo: String,
  description: String, startup_sphere: String,
  stage: String, founder_name: String, phone: String,
  telegram: String, team_size: Number, pitch_deck: String,
  commitment: String, mrr: Number, users_count: Number,
  investment_raised: Number, status: { type: String, default: 'active' },
}, { timestamps: true });

const ReportSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  startupId: mongoose.Schema.Types.ObjectId,
  weekStart: Date, weekEnd: Date,
  completed: String, notCompleted: String, plans: String,
  status: { type: String, default: 'pending' },
  rejectionReason: String,
}, { timestamps: true });

const MeetingSchema = new mongoose.Schema({
  managerId: mongoose.Schema.Types.ObjectId,
  userId: mongoose.Schema.Types.ObjectId,
  startupId: mongoose.Schema.Types.ObjectId,
  title: String, topic: String, scheduledAt: Date,
  duration: Number, meetLink: String,
  status: { type: String, default: 'available' },
}, { timestamps: true });

const BookSchema = new mongoose.Schema({
  title: String, author: String, description: String,
  fileUrl: String, coverUrl: String, category: String,
  uploadedBy: mongoose.Schema.Types.ObjectId, downloadCount: Number,
}, { timestamps: true });

const TaskProgressSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  startupId: mongoose.Schema.Types.ObjectId,
  taskId: String, quarter: Number, month: Number,
  completed: Boolean, completedAt: Date,
}, { timestamps: true });

// ── Models ────────────────────────────────────────────────────────────────────
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Startup = mongoose.models.Startup || mongoose.model('Startup', StartupSchema);
const Report = mongoose.models.Report || mongoose.model('Report', ReportSchema);
const Meeting = mongoose.models.Meeting || mongoose.model('Meeting', MeetingSchema);
const Book = mongoose.models.Book || mongoose.model('Book', BookSchema);
const TaskProgress = mongoose.models.TaskProgress || mongoose.model('TaskProgress', TaskProgressSchema);

function meetLink() {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const seg = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `https://meet.google.com/${seg(3)}-${seg(4)}-${seg(3)}`;
}

function weekBounds(weeksAgo: number) {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + 1 - weeksAgo * 7);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return { weekStart, weekEnd };
}

async function seed() {
  console.log('🌱 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected');

  // Clear existing
  await Promise.all([
    User.deleteMany({}), Startup.deleteMany({}), Report.deleteMany({}),
    Meeting.deleteMany({}), Book.deleteMany({}), TaskProgress.deleteMany({}),
  ]);
  console.log('🗑️  Cleared existing data');

  // ── Users ──────────────────────────────────────────────────────────────────
  const hashedPass = await bcrypt.hash('password123', 12);

  const [superAdmin, manager1, user1, user2, user3] = await User.insertMany([
    { name: 'Super', surname: 'Admin', email: 'admin@residency.uz', password: hashedPass, role: 'super_admin' },
    { name: 'Akbar', surname: 'Toshmatov', email: 'manager@residency.uz', password: hashedPass, role: 'manager' },
    { name: 'Aisha', surname: 'Karimova', email: 'aisha@gmail.com', password: hashedPass, role: 'user' },
    { name: 'Jasur', surname: 'Umarov', email: 'jasur@gmail.com', password: hashedPass, role: 'user' },
    { name: 'Nilufar', surname: 'Rahimova', email: 'nilufar@gmail.com', password: hashedPass, role: 'user' },
  ]);
  console.log('👤 Created 5 users');

  // ── Startups ───────────────────────────────────────────────────────────────
  const [startup1, startup2, startup3] = await Startup.insertMany([
    {
      userId: user1._id, name: 'Aisha', surname: 'Karimova', gmail: 'aisha@gmail.com',
      startup_name: 'MagicStore AI', region: 'Tashkent',
      startup_logo: '',
      description: 'MagicStore AI — bu tadbirkorlarga bir kun ichida professional onlayn do\'kon yaratish imkonini beruvchi platforma. AI yordamida mahsulot tavsifi, narx tahlili va marketing kontenti avtomatik ravishda yaratiladi.',
      startup_sphere: 'AI/ML', stage: 'mvp', founder_name: 'Aisha Karimova',
      phone: '+998901234567', telegram: '@aisha_founder', team_size: 4,
      commitment: 'full-time', mrr: 2800, users_count: 340,
      investment_raised: 15000, status: 'active', managerId: manager1._id,
    },
    {
      userId: user2._id, name: 'Jasur', surname: 'Umarov', gmail: 'jasur@gmail.com',
      startup_name: 'EduFlow', region: 'Samarkand',
      startup_logo: '',
      description: 'EduFlow — maktab o\'quvchilariga va talabalariga shaxsiylashtirilgan o\'quv yo\'nalishi taklif etuvchi EdTech platforma. Adaptiv AI algoritmlari bilan har bir o\'quvchining bilim darajasini aniqlaydi.',
      startup_sphere: 'EdTech', stage: 'growth', founder_name: 'Jasur Umarov',
      phone: '+998901112233', telegram: '@jasur_edu', team_size: 7,
      commitment: 'full-time', mrr: 8500, users_count: 1200,
      investment_raised: 50000, status: 'active', managerId: manager1._id,
    },
    {
      userId: user3._id, name: 'Nilufar', surname: 'Rahimova', gmail: 'nilufar@gmail.com',
      startup_name: 'AgriSense', region: 'Fergana',
      startup_logo: '',
      description: 'AgriSense — dehqonlarga real vaqt rejimida tuproq holati, ob-havo sharoiti va hosil prognozlarini taqdim etuvchi AgriTech yechim. IoT sensorlari va ML modellari asosida ishlaydi.',
      startup_sphere: 'AgriTech', stage: 'idea', founder_name: 'Nilufar Rahimova',
      phone: '+998907654321', telegram: '@nilufar_agri', team_size: 2,
      commitment: 'part-time', mrr: 0, users_count: 0,
      investment_raised: 0, status: 'pending', managerId: manager1._id,
    },
  ]);
  console.log('🚀 Created 3 startups');

  // ── Reports ────────────────────────────────────────────────────────────────
  await Report.insertMany([
    {
      userId: user1._id, startupId: startup1._id, ...weekBounds(1),
      completed: 'Launched MVP beta with 50 new users onboarded. Integrated Stripe payments. Fixed 12 critical bugs from user feedback.',
      notCompleted: 'Did not complete the mobile app version. Analytics dashboard delayed by 3 days.',
      plans: 'Reach 100 paying users. Ship mobile beta. Integrate Mixpanel for analytics tracking.',
      status: 'accepted',
    },
    {
      userId: user1._id, startupId: startup1._id, ...weekBounds(2),
      completed: 'Closed first 5 paying customers at $199/month each. Built AI product description generator.',
      notCompleted: 'Partnership with Uzum Market fell through. API rate limits hit production.',
      plans: 'Onboard 20 more beta users. Fix API rate limiting. Reopen partnership talks.',
      status: 'accepted',
    },
    {
      userId: user1._id, startupId: startup1._id, ...weekBounds(0),
      completed: 'Shipped new dashboard UI. Grew to 340 total users. MRR increased from $2,200 to $2,800.',
      notCompleted: 'Team hiring delayed — no senior engineer hired yet.',
      plans: 'Hire senior engineer by Friday. Launch referral program. Hit $3,500 MRR.',
      status: 'pending',
    },
    {
      userId: user2._id, startupId: startup2._id, ...weekBounds(1),
      completed: 'Signed MOU with 3 schools in Samarkand. Built adaptive quiz engine. User count grew to 1,200.',
      notCompleted: 'Fundraising pitch postponed due to investor travel.',
      plans: 'Close seed round negotiations. Launch parent portal. Onboard 2 more schools.',
      status: 'rejected',
      rejectionReason: 'Report lacks specific metrics. Please include conversion rates, daily active users, and specific revenue breakdown per school.',
    },
  ]);
  console.log('📄 Created 4 reports');

  // ── Meetings ───────────────────────────────────────────────────────────────
  const now = new Date();
  const futureDate = (days: number, hour: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    d.setHours(hour, 0, 0, 0);
    return d;
  };
  const pastDate = (days: number, hour: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    d.setHours(hour, 0, 0, 0);
    return d;
  };

  await Meeting.insertMany([
    {
      managerId: manager1._id, userId: user1._id, startupId: startup1._id,
      title: 'Weekly Mentor Session', topic: 'MRR growth strategy and hiring plan',
      scheduledAt: futureDate(2, 10), duration: 45, meetLink: meetLink(), status: 'booked',
    },
    {
      managerId: manager1._id, userId: user2._id, startupId: startup2._id,
      title: 'Investor Pitch Prep', topic: 'Seed round deck review',
      scheduledAt: futureDate(4, 14), duration: 60, meetLink: meetLink(), status: 'booked',
    },
    {
      managerId: manager1._id,
      title: 'Office Hours', scheduledAt: futureDate(1, 11), duration: 30,
      meetLink: meetLink(), status: 'available',
    },
    {
      managerId: manager1._id,
      title: 'Office Hours', scheduledAt: futureDate(3, 15), duration: 30,
      meetLink: meetLink(), status: 'available',
    },
    {
      managerId: manager1._id,
      title: 'Demo Day Prep', scheduledAt: futureDate(7, 10), duration: 90,
      meetLink: meetLink(), status: 'available',
    },
    {
      managerId: manager1._id, userId: user1._id, startupId: startup1._id,
      title: 'Kick-off Meeting', topic: 'Program overview and goal setting',
      scheduledAt: pastDate(14, 10), duration: 60, meetLink: meetLink(), status: 'completed',
    },
    {
      managerId: manager1._id, userId: user2._id, startupId: startup2._id,
      title: 'Product Review', topic: 'EdTech feature roadmap feedback',
      scheduledAt: pastDate(7, 14), duration: 45, meetLink: meetLink(), status: 'completed',
    },
  ]);
  console.log('📅 Created 7 meetings');

  // ── Books ──────────────────────────────────────────────────────────────────
  await Book.insertMany([
    {
      title: 'Zero to One', author: 'Peter Thiel', category: 'Business',
      description: 'Notes on startups, or how to build the future. The counterintuitive guide to building a monopoly business.',
      fileUrl: 'https://www.academia.edu/35739748/Zero_to_One_Notes_on_Startups_or_How_to_Build_the_Future',
      coverUrl: '', uploadedBy: manager1._id, downloadCount: 47,
    },
    {
      title: 'The Lean Startup', author: 'Eric Ries', category: 'Business',
      description: 'How today\'s entrepreneurs use continuous innovation to create radically successful businesses.',
      fileUrl: 'https://books.google.com/books/about/The_Lean_Startup.html',
      coverUrl: '', uploadedBy: manager1._id, downloadCount: 63,
    },
    {
      title: 'Traction', author: 'Gabriel Weinberg & Justin Mares', category: 'Marketing',
      description: '19 channels you can use to build a customer base. A framework for finding the right growth channel.',
      fileUrl: 'https://www.amazon.com/Traction-Startup-Achieve-Explosive-Customer/dp/1591848369',
      coverUrl: '', uploadedBy: manager1._id, downloadCount: 38,
    },
    {
      title: '$100M Offers', author: 'Alex Hormozi', category: 'Sales',
      description: 'How to make offers so good people feel stupid saying no. The ultimate guide to creating irresistible offers.',
      fileUrl: 'https://www.acquisition.com/books',
      coverUrl: '', uploadedBy: manager1._id, downloadCount: 89,
    },
    {
      title: 'Blitzscaling', author: 'Reid Hoffman', category: 'Business',
      description: 'The lightning-fast path to building massively valuable companies. Growing to dominate your market quickly.',
      fileUrl: 'https://blitzscaling.com/',
      coverUrl: '', uploadedBy: manager1._id, downloadCount: 29,
    },
    {
      title: 'Hooked', author: 'Nir Eyal', category: 'Product',
      description: 'How to build habit-forming products using the Hook Model framework.',
      fileUrl: 'https://www.nirandfar.com/hooked/',
      coverUrl: '', uploadedBy: manager1._id, downloadCount: 52,
    },
    {
      title: 'The Mom Test', author: 'Rob Fitzpatrick', category: 'Product',
      description: 'How to talk to customers and learn if your business is a good idea when everyone is lying to you.',
      fileUrl: 'https://www.momtestbook.com/',
      coverUrl: '', uploadedBy: manager1._id, downloadCount: 71,
    },
    {
      title: 'Good to Great', author: 'Jim Collins', category: 'Leadership',
      description: 'Why some companies make the leap and others don\'t. Research-backed principles of elite company building.',
      fileUrl: 'https://www.jimcollins.com/books.html',
      coverUrl: '', uploadedBy: manager1._id, downloadCount: 34,
    },
  ]);
  console.log('📚 Created 8 books');

  // ── Task Progress (some done for startup1) ─────────────────────────────────
  const completedTasks = [
    { taskId: 'q1m1t1', quarter: 1, month: 1 },
    { taskId: 'q1m1t2', quarter: 1, month: 1 },
    { taskId: 'q1m1t3', quarter: 1, month: 1 },
    { taskId: 'q1m1t4', quarter: 1, month: 1 },
    { taskId: 'q1m1t5', quarter: 1, month: 1 },
    { taskId: 'q1m2t1', quarter: 1, month: 2 },
    { taskId: 'q1m2t2', quarter: 1, month: 2 },
    { taskId: 'q1m2t3', quarter: 1, month: 2 },
    { taskId: 'q1m3t1', quarter: 1, month: 3 },
    { taskId: 'q1m3t2', quarter: 1, month: 3 },
    { taskId: 'q1m3t4', quarter: 1, month: 3 },
    { taskId: 'q2m1t1', quarter: 2, month: 1 },
    { taskId: 'q2m1t4', quarter: 2, month: 1 },
  ];

  await TaskProgress.insertMany(
    completedTasks.map((t) => ({
      userId: user1._id, startupId: startup1._id,
      ...t, completed: true, completedAt: new Date(),
    }))
  );
  console.log('✅ Created task progress records');

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n🎉 Seed complete!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔐 Login Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Super Admin: admin@residency.uz       / password123');
  console.log('Manager:     manager@residency.uz     / password123');
  console.log('Founder 1:   aisha@gmail.com          / password123');
  console.log('Founder 2:   jasur@gmail.com          / password123');
  console.log('Founder 3:   nilufar@gmail.com        / password123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
