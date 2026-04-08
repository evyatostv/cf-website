import { useParams, Link } from 'react-router';
import { motion } from 'motion/react';
import { ArrowRight, Clock, Calendar, Tag } from 'lucide-react';
import { blogPosts, categoryColors } from '@/app/data/blog-posts';

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    return (
      <div className="min-h-screen bg-[#f5f7f9] flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <p className="text-[#1a2332] font-bold text-xl mb-2">הפוסט לא נמצא</p>
          <Link to="/blog" className="text-[#0d47a1] text-sm hover:underline">
            חזרה לבלוג
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7f9]" dir="rtl">
      {/* Hero */}
      <section className="bg-[#1a2332] pt-16 pb-0">
        <div className="mx-auto max-w-3xl px-6 pt-8 pb-10">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="flex flex-col gap-4"
          >
            <Link
              to="/blog"
              className="inline-flex items-center gap-1.5 text-[#7a9db8] text-sm hover:text-white transition-colors self-start"
            >
              <ArrowRight size={14} />
              כל הפוסטים
            </Link>
            <span
              className="inline-flex items-center gap-1.5 self-start rounded-full px-3 py-1 text-xs font-medium text-white"
              style={{ background: categoryColors[post.category] ?? '#0d47a1' }}
            >
              <Tag size={11} />
              {post.category}
            </span>
            <h1 className="text-2xl font-bold text-white leading-snug">
              {post.title}
            </h1>
            <p className="text-[#7a9db8] text-sm leading-relaxed">
              {post.description}
            </p>
            <div className="flex items-center gap-4 text-xs text-[#7a9db8]">
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {post.createdAt}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {post.readTime}
              </span>
              <span>מאת {post.author}</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Image */}
      <div className="mx-auto max-w-3xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="-mt-6 rounded-2xl overflow-hidden shadow-lg border border-[#e1e6ec]"
        >
          <img
            src={post.image}
            alt={post.title}
            className="w-full object-cover max-h-72"
          />
        </motion.div>
      </div>

      {/* Content placeholder */}
      <motion.article
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.2 }}
        className="mx-auto max-w-3xl px-6 py-10"
      >
        <div className="bg-white rounded-2xl border border-[#e1e6ec] p-8 shadow-sm">
          <p className="text-[#6b7c93] text-center text-sm py-8">
            התוכן יתווסף בקרוב.
          </p>
        </div>

        {/* Related posts */}
        <div className="mt-10">
          <h3 className="text-base font-bold text-[#1a2332] mb-4">פוסטים נוספים</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {blogPosts
              .filter((p) => p.slug !== post.slug)
              .slice(0, 2)
              .map((related) => (
                <Link
                  key={related.slug}
                  to={`/blog/${related.slug}`}
                  className="group flex gap-3 bg-white rounded-xl border border-[#e1e6ec] p-4 hover:shadow-sm transition-shadow"
                >
                  <img
                    src={related.image}
                    alt={related.title}
                    className="w-20 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex flex-col justify-center gap-1 min-w-0">
                    <span className="text-[11px] text-[#6b7c93]">{related.category}</span>
                    <p className="text-sm font-semibold text-[#1a2332] line-clamp-2 group-hover:text-[#0d47a1] transition-colors">
                      {related.title}
                    </p>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </motion.article>
    </div>
  );
}
