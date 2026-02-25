'use client';
import Image from "next/image";
import logoImg from "@/assets/logo_new.svg";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";
import { FaDiscord, FaMedium, FaXTwitter, FaYoutube } from "react-icons/fa6";
import { FaTelegramPlane } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { toast } from "react-toastify";

export function Footer() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubscribe = () => {
    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email');
      return;
    }
    setIsSubmitting(true);
    fetch(`https://api.world3.ai/v1/email/subscribe?email=${email}`, {
      method: 'POST',
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response;
      })
      .then(() => {
        toast.success('Subscribe successfully!');
        setEmail('');
      })
      .catch(err => {
        console.error(err);
        toast.error('Failed to subscribe.');
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  }
  return (
    <footer className="bg-[#171717] py-10 font-onest">
      <div className="mx-auto w-[calc(100%-32px)] max-w-[1280px]">
        <div className="flex flex-col items-start border-[1px] border-solid border-transparent border-b-[#262626] pb-8 md:flex-row md:items-center md:justify-between md:pb-[5%]">
          <div>
            <Image
              src={logoImg}
              alt=""
              className="mb-6 h-[58px] w-auto md:mb-[25px] md:h-[58px]"
            />
            <ul className="flex items-center gap-x-5 md:gap-x-[21px]">
              {SOCIALS.map((item) => (
                <Link href={item.link} key={item.link} target="_blank">
                  <item.icon
                    className={cn(
                      'text-xl text-[#d4d4d4] md:text-xl ',
                      'hover:opacity-80 cursor-pointer duration-200 transition-opacity'
                    )}
                  />
                </Link>
              ))}
            </ul>
          </div>
          <div className="w-full max-md:mt-10 md:w-[39.06%]">
            <h3 className="font-WixDisplay text-2xl font-medium text-[#fff]">
              Join our newsletter
            </h3>
            <p className="mb-6 mt-1 text-sm font-light text-[#737373] md:mb-[4.8%] md:mt-[1.6%] md:text-base">
              Subscribe to our newsletter and stay updated
            </p>
            <div className="flex flex-col gap-x-[3.2%] md:flex-row md:items-stretch">
              <input
                value={email}
                type="email"
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
                placeholder="Enter your email"
                className="flex-1 rounded-[10px] bg-[#262626] px-4 py-[12px] text-base outline-none placeholder:text-base placeholder:text-[#A3A3A3] focus:outline-none md:rounded-[10px] md:px-4 md:py-[12px] md:text-base md:placeholder:text-base"
              />
              <button
                className={cn(
                  'flex w-full items-center justify-center rounded-[10px] bg-[#f3f2ff] text-base font-medium text-[#010101] max-md:mt-6 max-md:h-[48px] md:aspect-[125/48] md:w-[125px] md:rounded-[10px] md:text-base',
                  'hover:opacity-80 cursor-pointer duration-200 transition-opacity'
                )}
                disabled={isSubmitting}
                onClick={handleSubscribe}
              >
                {isSubmitting ? 'Subscribing...' : 'Subscribe'}
              </button>
            </div>
            <p className="mt-5 text-xs leading-[1.17] text-[#A3A3A3] max-md:text-center md:mt-4 md:text-xs">
              By subscribing you agree to with our Privacy Policy
            </p>
          </div>
        </div>
        <div className="flex flex-col-reverse items-center justify-between gap-y-3 pt-9 md:flex-row md:items-start md:pt-[2.5%]">
          <p className="text-xs leading-[1.17] text-[#a3a3a3] md:text-xs">
            WORLD3 © {new Date().getFullYear()}. All Copyrights Reserved.
          </p>
          <ul className="flex items-center gap-x-4 md:gap-x-4">
            {LINKS.map((item) => (
              <Link
                key={item.link}
                target="_blank"
                href={item.link}
                className={cn(
                  'text-xs leading-[14/12] text-[#a3a3a3] md:text-xs',
                  'hover:opacity-80 cursor-pointer duration-200 transition-opacity'
                )}
              >
                {item.text}
              </Link>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}

const SOCIALS = [
  {
    icon: FaXTwitter,
    link: "https://twitter.com/WORLD3_AI"
  },
  {
    icon: FaTelegramPlane,
    link: "https://t.me/WORLD3_AI"
  },
  {
    icon: FaDiscord,
    link: 'https://discord.com/invite/QMYQB9nDy5'
  },
  {
    icon: FaYoutube,
    link: 'https://www.youtube.com/@WORLD3_AI'
  },
  {
    icon: FaMedium,
    link: 'https://medium.com/@WORLD3_AI'
  },
  {
    icon: MdEmail,
    link: 'mailto:contact@world3.ai'
  }
];

const LINKS = [
  {
    text: 'Terms of Use',
    link: 'https://world3.ai/assets/WORLD3 Terms of Use.pdf'
  },
  {
    text: 'Privacy Policy',
    link: 'https://world3.ai/assets/WORLD3 Privacy Policy.html'
  }
];