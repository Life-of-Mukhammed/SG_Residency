import type { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import connectDB from '@/lib/db';
import User from '@/models/User';

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
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

        user.id = createdUser._id.toString();
        user.role = createdUser.role;
        return true;
      }

      if (user.image && existingUser.avatar !== user.image) {
        existingUser.avatar = user.image;
        await existingUser.save();
      }

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
