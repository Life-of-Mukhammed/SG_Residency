import crypto from 'crypto';
import type { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Startup from '@/models/Startup';
import { linkResidentByEmail } from '@/lib/link-resident';

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const googleConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

export const authOptions: AuthOptions = {
  providers: [
    ...(googleConfigured
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        await connectDB();

        const user = await User.findOne({ email: credentials.email.toLowerCase() }).select('+password');
        if (!user) throw new Error('No account found with this email');
        if (!user.password) throw new Error('This account uses Google sign-in');

        const isValid = await user.comparePassword(credentials.password);
        if (!isValid) throw new Error('Invalid password');

        return {
          id:    user._id.toString(),
          name:  `${user.name} ${user.surname}`,
          email: user.email,
          role:  user.role,
        };
      },
    }),
    CredentialsProvider({
      id: 'otp',
      name: 'Email OTP',
      credentials: {
        email: { label: 'Email', type: 'email' },
        otp:   { label: 'OTP',   type: 'text'  },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.otp) {
          throw new Error('Email va kod kiritilishi shart');
        }
        if (!/^\d{6}$/.test(credentials.otp)) {
          throw new Error('Kod 6 raqamdan iborat bo‘lishi kerak');
        }

        await connectDB();

        const inputEmail = credentials.email.toLowerCase().trim();

        // Match by User.email first, then by Startup.gmail (placeholder users)
        let user = await User.findOne({ email: inputEmail })
          .select('+verificationCode +verificationExpires +password');

        if (!user) {
          const startup = await Startup.findOne({
            gmail: { $regex: `^${escapeRegex(inputEmail)}$`, $options: 'i' },
            deletedAt: null,
          }).select('userId').lean();
          if (startup?.userId) {
            user = await User.findById(startup.userId)
              .select('+verificationCode +verificationExpires +password');
          }
        }

        if (!user) throw new Error('Bu email bo‘yicha akkount topilmadi');
        if (!user.verificationCode || !user.verificationExpires) {
          throw new Error('Avval kod so‘rang');
        }
        if (user.verificationExpires.getTime() < Date.now()) {
          throw new Error('Kod muddati o‘tdi. Qayta so‘rang');
        }

        const hashed = crypto.createHash('sha256').update(credentials.otp).digest('hex');
        if (hashed !== user.verificationCode) {
          throw new Error('Kod noto‘g‘ri');
        }

        // Promote synthetic placeholder email to the real one used for login
        if (user.email.endsWith('@startupgarage.local')) {
          user.email = inputEmail;
        }

        // Clear the OTP after successful verification
        user.verificationCode = undefined;
        user.verificationExpires = undefined;
        user.emailVerified = true;
        user.status = 'active';
        await user.save();

        // Make sure resident-startup link is established
        try { await linkResidentByEmail(user._id, inputEmail); } catch (e) { console.error('[otp authorize] link', e); }

        return {
          id:    user._id.toString(),
          name:  `${user.name} ${user.surname}`,
          email: user.email,
          role:  user.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== 'google' || !user.email) {
        return true;
      }

      await connectDB();

      const email = user.email.toLowerCase();
      const existingUser = await User.findOne({ email });
      const fullName = (user.name || profile?.name || '').trim();
      const [firstName = 'Google', ...rest] = fullName.split(' ').filter(Boolean);
      const surname = rest.join(' ') || 'User';

      if (!existingUser) {
        const createdUser = await User.create({
          name: firstName,
          surname,
          email,
          password: undefined,
          avatar: user.image || undefined,
          role: 'user',
        });

        // If a resident was previously imported with this gmail, transfer ownership
        try { await linkResidentByEmail(createdUser._id, email); } catch (e) { console.error('[linkResidentByEmail]', e); }

        user.id = createdUser._id.toString();
        user.role = createdUser.role;
        return true;
      }

      if (user.image && existingUser.avatar !== user.image) {
        existingUser.avatar = user.image;
        await existingUser.save();
      }

      // Also link on subsequent Google sign-ins, in case import happened after account creation
      try { await linkResidentByEmail(existingUser._id, email); } catch (e) { console.error('[linkResidentByEmail]', e); }

      user.id = existingUser._id.toString();
      user.role = existingUser.role;
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (trigger === 'update' && session) {
        token.name = session.name ?? token.name;
        token.email = session.email ?? token.email;
        token.picture = session.image ?? token.picture;
      }

      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string; role: string }).id = token.id as string;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture as string | null | undefined;
        (session.user as { id: string; role: string }).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error:  '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge:   30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
