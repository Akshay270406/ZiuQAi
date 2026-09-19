import { Twitter, Facebook, Github } from "lucide-react";
import Logo from "../common/Logo";
import FooterLink from "./FooterLink";
import SocialIcon from "./SocialIcon";

/*
    Footer component
    - Uses Footerlink, Social Icons, Logo
*/

const Footer = () => {
  return (
    <footer
      className="
            w-full border-t 
            border-slate-200 dark:border-slate-700
            bg-slate-50 dark:bg-slate-900
            text-slate-700 dark:text-slate-300
            py-12 px-6 md:px-16 font-roboto
        "
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <Logo text="ZiuQ.AI" />
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Empowering smarter quizzes with AI-driven learning tools.
          </p>
        </div>

        <div className="flex flex-col gap-y-2">
          <p className="font-semibold text-slate-900 dark:text-white">
            Product
          </p>
          <FooterLink text="Features" />
          <FooterLink text="Pricing" />
          <FooterLink text="Demo" />
        </div>

        <div className="flex flex-col gap-y-2">
          <p className="font-semibold text-slate-900 dark:text-white">
            Resources
          </p>
          <FooterLink text="Blog" />
          <FooterLink text="Support" />
          <FooterLink text="Contact Us" />
        </div>

        <div className="flex flex-col gap-y-2">
          <p className="font-semibold text-slate-900 dark:text-white">
            Company
          </p>
          <FooterLink text="About Us" />
          <FooterLink text="Cookie Policy" />
          <FooterLink text="Legal" />
        </div>
      </div>

      <div
        className="
                max-w-7xl mx-auto mt-12 
                flex flex-col md:flex-row 
                justify-between items-center gap-6
            "
      >
        <p className="text-sm text-slate-600 dark:text-slate-400">
          © 2025 Quiz. All rights reserved.
        </p>

        <div className="flex items-center gap-4">
          <SocialIcon icon={<Twitter />} />
          <SocialIcon icon={<Facebook />} />
          <SocialIcon icon={<Github />} />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
