import { useNavigate } from "react-router-dom";
import { GraduationCap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.jpeg";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative">
      <img src={logo} alt="KSP Pathsala Logo" className="absolute top-4 left-4 w-16 h-16 rounded-full object-cover shadow-lg" />
      <div className="text-center mb-10 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
          KSP Pathsala - Rank Booster Test
        </div>
        <h1 className="text-4xl md:text-6xl font-heading font-bold text-foreground mb-4">
          Rank Booster
          <span className="gradient-text block">Test</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto mb-4">
          Unlock your potential. Conquer your dreams.
        </p>
        {/* HELLO ASPIRANTS highlight */}
        <div className="inline-block mt-1 px-6 py-2 rounded-full bg-gradient-to-r from-yellow-400/20 via-orange-400/20 to-yellow-400/20 border border-yellow-400/50 animate-pulse">
          <span className="text-xl md:text-2xl font-heading font-extrabold tracking-widest bg-gradient-to-r from-yellow-300 via-orange-400 to-yellow-300 bg-clip-text text-transparent drop-shadow">
            🎯 HELLO ASPIRANTS
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 w-full max-w-lg animate-fade-in mb-10">
        <button
          onClick={() => navigate("/student")}
          className="flex-1 group glass-card rounded-2xl p-8 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
        >
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
            <GraduationCap className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="font-heading font-semibold text-xl text-foreground mb-2">Student</h2>
          <p className="text-muted-foreground text-sm">Take a test & view results</p>
        </button>

        <button
          onClick={() => navigate("/admin/login")}
          className="flex-1 group glass-card rounded-2xl p-8 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
        >
          <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
            <ShieldCheck className="w-8 h-8 text-accent-foreground" />
          </div>
          <h2 className="font-heading font-semibold text-xl text-foreground mb-2">Admin</h2>
          <p className="text-muted-foreground text-sm">Manage questions & view responses</p>
        </button>
      </div>

      {/* Social Links Section */}
      <div className="w-full max-w-lg animate-fade-in">
        <div className="glass-card rounded-2xl p-5 text-center">
          <p className="text-muted-foreground text-sm font-semibold mb-3 uppercase tracking-wider">Follow us on</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="https://whatsapp.com/channel/0029VanFJC35vKA8UrbY2T2q"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-all hover:scale-105 font-medium text-sm"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              WhatsApp Channel
            </a>
            <a
              href="https://youtube.com/@ksppathsala?si=w91zJzpGbV0SyQbM"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all hover:scale-105 font-medium text-sm"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              YouTube Channel
            </a>
            <a
              href="https://t.me/ksp_pathsala"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-all hover:scale-105 font-medium text-sm"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
              Telegram
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
