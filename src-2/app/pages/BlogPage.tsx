import { motion } from 'motion/react';
import { Link } from 'react-router';
import { Clock, Calendar, Tag } from 'lucide-react';
import { LazyImage } from '@/app/components/ui/lazy-image';
import { blogPosts, categoryColors } from '@/app/data/blog-posts';

export function BlogPage() {
  const [featured, ...rest] = blogPosts;

  return (
    <div className="min-h-screen bg-[#f5f7f9]" dir="rtl">
      {/* Hero */}
      <section className="bg-[#1a2332] pt-16 pb-12">
        <div className="mx-auto max-w-5xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-[#7a9db8] mb-4">
              מרכז הידע
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              הבלוג של ClinicFlow
            </h1>
            <p className="text-[#7a9db8] text-base max-w-xl">
              מדריכים מקצועיים, טיפים ותובנות לניהול מרפאה חכם ויעיל יותר.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* Featured post */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="mb-10"
        >
          <Link
            to={`/blog/${featured.slug}`}
            className="group block bg-white rounded-2xl overflow-hidden border border-[#e1e6ec] shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="grid md:grid-cols-2">
              <div className="overflow-hidden">
                <LazyImage
                  src={featured.image}
                  alt={featured.title}
                  ratio={16 / 9}
                  inView
                  aspectRatioClassName="rounded-none"
                  className="transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-col justify-center p-5 sm:p-8 gap-4">
                <span
                  className="inline-flex items-center gap-1.5 self-start rounded-full px-3 py-1 text-xs font-medium text-white"
                  style={{ background: categoryColors[featured.category] ?? '#0d47a1' }}
                >
                  <Tag size={11} />
                  {featured.category}
                </span>
                <h2 className="text-xl font-bold text-[#1a2332] leading-snug group-hover:text-[#0d47a1] transition-colors">
                  {featured.title}
                </h2>
                <p className="text-[#6b7c93] text-sm leading-relaxed line-clamp-3">
                  {featured.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-[#6b7c93] pt-1 border-t border-[#e1e6ec]">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {featured.createdAt}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {featured.readTime}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((post, i) => (
            <motion.div
              key={post.slug}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 + i * 0.05 }}
            >
              <Link
                to={`/blog/${post.slug}`}
                className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-[#e1e6ec] shadow-sm hover:shadow-md transition-shadow h-full"
              >
                <div className="overflow-hidden">
                  <LazyImage
                    src={post.image}
                    alt={post.title}
                    ratio={16 / 9}
                    inView
                    aspectRatioClassName="rounded-none"
                    className="transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-col gap-3 p-5 flex-1">
                  <span
                    className="inline-flex items-center gap-1.5 self-start rounded-full px-2.5 py-0.5 text-[11px] font-medium text-white"
                    style={{ background: categoryColors[post.category] ?? '#0d47a1' }}
                  >
                    {post.category}
                  </span>
                  <h2 className="text-base font-bold text-[#1a2332] leading-snug line-clamp-2 group-hover:text-[#0d47a1] transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-[#6b7c93] text-sm leading-relaxed line-clamp-3 flex-1">
                    {post.description}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-[#6b7c93] pt-3 border-t border-[#e1e6ec] mt-auto">
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      {post.createdAt}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {post.readTime}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
