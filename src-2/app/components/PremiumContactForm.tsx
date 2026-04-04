import { useState } from 'react';
import { Mail, Phone, User, Building2 } from 'lucide-react';

export function PremiumContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    clinicName: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    // Simulate form submission
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setFormData({ name: '', email: '', phone: '', clinicName: '', message: '' });
      setTimeout(() => setSuccess(false), 3000);
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-[#1a2332] mb-2">השאר פרטים</h3>
        <p className="text-[#6b7c93]">אנחנו נחזור אליך בקרוב</p>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-600 text-sm">✓ התקבלנו את פרטיך בהצלחה!</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-[#1a2332] mb-2">
            שם מלא
          </label>
          <div className="flex items-center h-10 px-3 border border-[#e1e6ec] rounded-lg focus-within:ring-2 focus-within:ring-[#0d47a1] transition-all overflow-hidden bg-white">
            <User className="w-5 h-5 text-[#6b7c93] flex-shrink-0" />
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="h-full px-3 w-full outline-none bg-transparent text-[#1a2332]"
              placeholder="שמך המלא"
              required
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-[#1a2332] mb-2">
            דוא"ל
          </label>
          <div className="flex items-center h-10 px-3 border border-[#e1e6ec] rounded-lg focus-within:ring-2 focus-within:ring-[#0d47a1] transition-all overflow-hidden bg-white">
            <Mail className="w-5 h-5 text-[#6b7c93] flex-shrink-0" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="h-full px-3 w-full outline-none bg-transparent text-[#1a2332]"
              placeholder="your@email.com"
              required
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-[#1a2332] mb-2">
            טלפון
          </label>
          <div className="flex items-center h-10 px-3 border border-[#e1e6ec] rounded-lg focus-within:ring-2 focus-within:ring-[#0d47a1] transition-all overflow-hidden bg-white">
            <Phone className="w-5 h-5 text-[#6b7c93] flex-shrink-0" />
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="h-full px-3 w-full outline-none bg-transparent text-[#1a2332]"
              placeholder="05X-XXX-XXXX"
              required
            />
          </div>
        </div>

        {/* Clinic Name */}
        <div>
          <label className="block text-sm font-medium text-[#1a2332] mb-2">
            שם הקליניקה
          </label>
          <div className="flex items-center h-10 px-3 border border-[#e1e6ec] rounded-lg focus-within:ring-2 focus-within:ring-[#0d47a1] transition-all overflow-hidden bg-white">
            <Building2 className="w-5 h-5 text-[#6b7c93] flex-shrink-0" />
            <input
              type="text"
              name="clinicName"
              value={formData.clinicName}
              onChange={handleChange}
              className="h-full px-3 w-full outline-none bg-transparent text-[#1a2332]"
              placeholder="שם הקליניקה"
              required
            />
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-[#1a2332] mb-2">
            הודעה
          </label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 bg-white border border-[#e1e6ec] rounded-lg resize-none outline-none focus:ring-2 focus:ring-[#0d47a1] transition-all text-[#1a2332]"
            placeholder="ספר לנו יותר על הצרכים שלך..."
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white font-medium py-3 rounded-lg hover:shadow-lg hover:shadow-[#0d47a1]/30 transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? 'שולח...' : 'שלח'}
        </button>
      </div>
    </form>
  );
}
