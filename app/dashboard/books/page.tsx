'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import axios from 'axios';
import toast from 'react-hot-toast';
import Header from '@/components/dashboard/Header';
import { useSession } from 'next-auth/react';
import { BookOpen, Download, Plus, Trash2, Search } from 'lucide-react';

type Book = {
  _id: string;
  title: string;
  author: string;
  description: string;
  fileUrl: string;
  coverUrl?: string;
  category: string;
  downloadCount?: number;
};

type BookForm = {
  title: string;
  author: string;
  description: string;
  fileUrl: string;
  coverUrl: string;
  category: string;
};

export default function BooksPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const isManagerOrAdmin = user ? ['manager', 'super_admin'].includes(user.role) : false;

  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [addModal, setAddModal] = useState(false);
  const [form, setForm] = useState<BookForm>({ title: '', author: '', description: '', fileUrl: '', coverUrl: '', category: '' });
  const [adding, setAdding] = useState(false);

  const categories = ['Business', 'Marketing', 'Technology', 'Leadership', 'Finance', 'Product', 'Design', 'Sales'];

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await axios.get<{ books: Book[] }>(`/api/books${query}`);
      setBooks(res.data.books || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load books');
    }
    finally { setLoading(false); }
  };

  useEffect(() => {
    void fetchBooks();
  }, [search]);

  const addBook = async () => {
    if (!form.title || !form.author || !form.fileUrl || !form.category) {
      toast.error('Please fill all required fields');
      return;
    }
    setAdding(true);
    try {
      await axios.post('/api/books', { ...form, description: form.description || 'No description provided.' });
      toast.success('Book added!');
      setAddModal(false);
      setForm({ title: '', author: '', description: '', fileUrl: '', coverUrl: '', category: '' });
      void fetchBooks();
    } catch { toast.error('Failed to add book'); }
    finally { setAdding(false); }
  };

  const deleteBook = async (id: string) => {
    try {
      await axios.delete(`/api/books/${id}`);
      toast.success('Book deleted');
      void fetchBooks();
    } catch { toast.error('Failed to delete'); }
  };

  const handleDownload = async (book: Book) => {
    try {
      await axios.patch(`/api/books/${book._id}`, { action: 'download' });
      window.open(book.fileUrl, '_blank', 'noopener,noreferrer');
      void fetchBooks();
    } catch (error) {
      console.error(error);
      toast.error('Failed to start download');
    }
  };

  const BOOK_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6'];

  return (
    <div className="animate-fade-in">
      <Header title="Library" subtitle="Curated books and resources for founders" />
      <div className="p-8 space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
              placeholder="Search books..."
            />
          </div>
          {isManagerOrAdmin && (
            <button onClick={() => setAddModal(true)} className="btn-primary flex items-center gap-2">
              <Plus size={16} /> Add Book
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-56" />)}
          </div>
        ) : books.length === 0 ? (
          <div className="card text-center py-16">
            <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No books yet</p>
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
              {isManagerOrAdmin ? 'Add the first book to the library' : 'Check back soon for resources'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {books.map((book, i) => (
              <div key={book._id} className="card p-0 overflow-hidden group">
                {/* Cover */}
                <div className="h-44 flex items-center justify-center relative" style={{ background: `linear-gradient(135deg, ${BOOK_COLORS[i % BOOK_COLORS.length]}22, ${BOOK_COLORS[(i + 2) % BOOK_COLORS.length]}33)` }}>
                  {book.coverUrl ? (
                    <Image
                      src={book.coverUrl}
                      alt={book.title}
                      fill
                      sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="text-center px-4">
                      <BookOpen size={32} style={{ color: BOOK_COLORS[i % BOOK_COLORS.length], margin: '0 auto 8px' }} />
                      <p className="text-xs font-bold text-center" style={{ color: BOOK_COLORS[i % BOOK_COLORS.length] }}>{book.category}</p>
                    </div>
                  )}
                  {isManagerOrAdmin && (
                    <button
                      onClick={() => deleteBook(book._id)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'rgba(239,68,68,0.9)' }}
                    >
                      <Trash2 size={12} className="text-white" />
                    </button>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-semibold text-sm mb-1 line-clamp-2" style={{ color: 'var(--text-primary)' }}>{book.title}</p>
                  <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{book.author}</p>
                  <p className="text-xs mb-3 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{book.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="badge badge-mvp text-xs">{book.category}</span>
                    <button onClick={() => handleDownload(book)} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--accent)' }}>
                      <Download size={12} /> {book.downloadCount || 0}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Book Modal */}
      {addModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="card p-8 w-full max-w-lg animate-fade-in">
            <h3 className="font-semibold text-lg mb-6" style={{ color: 'var(--text-primary)' }}>Add Book to Library</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Title *</label>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" placeholder="Zero to One" />
                </div>
                <div>
                  <label className="label">Author *</label>
                  <input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} className="input" placeholder="Peter Thiel" />
                </div>
              </div>
              <div>
                <label className="label">Category *</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input">
                  <option value="">Select category...</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">PDF/Book URL *</label>
                <input value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} className="input" placeholder="https://..." />
              </div>
              <div>
                <label className="label">Cover Image URL (optional)</label>
                <input value={form.coverUrl} onChange={(e) => setForm({ ...form, coverUrl: e.target.value })} className="input" placeholder="https://..." />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input min-h-20 resize-none" placeholder="Brief description..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setAddModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={addBook} disabled={adding} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {adding ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Add Book'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
