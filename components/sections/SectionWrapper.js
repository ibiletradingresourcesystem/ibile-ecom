// components/sections/SectionWrapper.js
export default function SectionWrapper({ title, children }) {
  return (
    <section className="py-12 bg-gradient-to-br from-sky-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="text-center mb-10">
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-700 via-indigo-600 to-teal-500 bg-clip-text text-transparent">
            {title}
          </h2>
        </header>
        {children}
      </div>
    </section>
  );
}
