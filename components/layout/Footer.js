// === /components/layout/Footer.js ===
export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-10 mt-10 border-t border-blue-100 bg-white/85 backdrop-blur-md px-4 sm:px-6 py-8 text-center">
      <div className="max-w-xl mx-auto flex flex-col items-center space-y-2">
        <h2 className="text-lg font-bold tracking-wide text-gray-800 ">
          &copy; {currentYear} <span className="text-gradient">Ibile Mart Store</span>
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          All rights reserved.
        </p>
        <p className="text-xs text-gray-400">
          Powered by{" "}
          <span className="font-semibold text-blue-500 hover:text-blue-800 transition-colors duration-300">
            Hetch Tech
          </span>
        </p>
      </div>

      <style jsx>{`
        .text-gradient {
          background: linear-gradient(to right, #4f46e5, #06b6d4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>
    </footer>
  );
}
